"use server";

import { headers } from "next/headers";
import { enqueueNotificationOutbox } from "@/lib/rfq/communications";
import { getRfqEmailConfig } from "@/lib/rfq/email/config";
import { customerMessageForCode } from "@/lib/rfq/submission-result";
import { newIncidentId } from "@/lib/rfq/diagnostics";
import { limitPublicOrderSubmit } from "@/lib/rate-limit/public-order";
import {
  createCatalogueOrder,
  parsePublicOrderFormData,
  resolveOrderableProduct,
  updateOrderEmailStatus,
} from "@/lib/orders";
import { publicOrderSuccess } from "@/lib/orders/result";
import {
  sendCustomerOrderConfirmation,
  sendInternalOrderNotification,
} from "@/lib/orders/email/send";
import type { OrderEmailStatus } from "@/lib/orders/types";
import type { EmailSendResult } from "@/lib/rfq/email/types";
import { attemptDatabaseFallbackAfterPersistenceFailure } from "@/lib/fallback/after-persistence-failure";
import { buildCatalogueOrderFallbackInput } from "@/lib/fallback/payloads";

export type SubmitOrderResult =
  | {
      success: true;
      deliveryMode: "normal";
      orderReference: string;
      viewToken: string;
      email: string;
      productName: string;
      quantity: number;
      totalInclVatZar: number;
      confirmationEmailStatus: OrderEmailStatus;
      internalEmailStatus: OrderEmailStatus;
    }
  | {
      success: true;
      deliveryMode: "fallback";
      incidentId: string;
    }
  | { success: false; error: string; code?: string; incidentId?: string };

function emailStatus(result: EmailSendResult): OrderEmailStatus {
  if (result.ok) return result.status === "skipped" ? "skipped" : "sent";
  return result.status;
}

export async function submitCatalogueOrder(
  formData: FormData,
): Promise<SubmitOrderResult> {
  const incidentId = newIncidentId();
  const parsed = parsePublicOrderFormData(formData);
  if (!parsed.ok) {
    return { success: false, error: parsed.error, code: "VALIDATION_ERROR" };
  }

  if (Date.now() - parsed.data.formStartedAt < 4000) {
    return {
      success: false,
      error: "Please take a moment to review your details.",
      code: "VALIDATION_ERROR",
    };
  }

  if (parsed.isSpam) {
    return {
      ...publicOrderSuccess({
        orderReference: "DT-RECEIVED",
        viewToken: "spam",
        email: parsed.data.email,
        productName: "Order received",
        quantity: parsed.data.quantity,
        totalInclVatZar: 0,
        confirmationEmailStatus: "sent",
        internalEmailStatus: "sent",
      }),
      deliveryMode: "normal",
    };
  }

  const snapshot = resolveOrderableProduct(
    parsed.data.sku,
    parsed.data.quantity,
  );
  if (!snapshot) {
    return {
      success: false,
      error: "This kit is not available to order online.",
      code: "VALIDATION_ERROR",
    };
  }

  const headerList = await headers();
  const limited = await limitPublicOrderSubmit(headerList);
  if (!limited.success && limited.reason === "rate_limited") {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((limited.resetAt - Date.now()) / 1000),
    );
    return {
      success: false,
      error: customerMessageForCode("RATE_LIMITED", { retryAfterSeconds }),
      code: "RATE_LIMITED",
    };
  }

  const acceptedAtIso = new Date().toISOString();
  const created = await createCatalogueOrder({
    data: parsed.data,
    snapshot,
    acceptedAtIso,
  });

  if (!created.ok) {
    console.error("[orders] persist_failed", {
      incidentId,
      code: created.code,
    });

    const fallback = await attemptDatabaseFallbackAfterPersistenceFailure({
      incidentId,
      databaseErrorCode: created.code,
      fallbackInput: buildCatalogueOrderFallbackInput({
        incidentId,
        submissionId: parsed.data.submissionId,
        data: parsed.data,
        snapshot,
      }),
    });

    if (fallback.ok) {
      return {
        success: true,
        deliveryMode: "fallback",
        incidentId: fallback.incidentId,
      };
    }

    return {
      success: false,
      error: fallback.customerMessage,
      code: created.code,
      incidentId,
    };
  }

  if (created.order.idempotentReplay) {
    return {
      ...publicOrderSuccess({
        orderReference: created.order.orderReference,
        viewToken: created.order.confirmationViewToken,
        email: created.order.email,
        productName: created.order.productName,
        quantity: created.order.quantity,
        totalInclVatZar: created.order.totalInclVatZar,
        confirmationEmailStatus: "sent",
        internalEmailStatus: "sent",
      }),
      deliveryMode: "normal",
    };
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.dam-tech.co.za";
  const adminUrl = `${origin}/admin/orders/${created.order.id}/`;
  const emailConfig = getRfqEmailConfig();

  const [customerResult, internalResult] = await Promise.all([
    sendCustomerOrderConfirmation({
      orderReference: created.order.orderReference,
      placedAtIso: created.order.createdAt,
      data: parsed.data,
      snapshot,
    }),
    sendInternalOrderNotification({
      orderReference: created.order.orderReference,
      placedAtIso: created.order.createdAt,
      data: parsed.data,
      snapshot,
      adminUrl,
      termsAcceptedAt: acceptedAtIso,
      privacyAcceptedAt: acceptedAtIso,
      exclusionsAcceptedAt: acceptedAtIso,
    }),
  ]);

  await updateOrderEmailStatus({
    orderId: created.order.id,
    confirmation: emailStatus(customerResult),
    internal: emailStatus(internalResult),
  });

  if (!customerResult.ok) {
    console.error("[orders] customer_email_failed", {
      incidentId,
      orderId: created.order.id,
      status: customerResult.status,
    });
  }
  if (!internalResult.ok) {
    console.error("[orders] internal_email_failed", {
      incidentId,
      orderId: created.order.id,
      status: internalResult.status,
    });
    await enqueueNotificationOutbox({
      entityType: "catalogue_order",
      entityId: created.order.id,
      notificationType: "admin_notification",
      recipient: emailConfig.internalNotificationEmail,
      payload: {
        orderReference: created.order.orderReference,
        adminUrl,
      },
    });
  }

  return {
    ...publicOrderSuccess({
      orderReference: created.order.orderReference,
      viewToken: created.order.confirmationViewToken,
      email: created.order.email,
      productName: created.order.productName,
      quantity: created.order.quantity,
      totalInclVatZar: created.order.totalInclVatZar,
      confirmationEmailStatus: emailStatus(customerResult),
      internalEmailStatus: emailStatus(internalResult),
    }),
    deliveryMode: "normal",
  };
}
