import { after } from "next/server";
import {
  clientIpFromHeaders,
  confirmItnWithPayfast,
  getPayfastConfig,
  isItnAmountValid,
  isItnSignatureValid,
  isPayfastSourceIp,
  parseItnBody,
} from "@/lib/payfast";
import { shopOrigin } from "@/lib/shop/origin";
import { sendPvcPaidEmails } from "@/lib/shop/pvc-emails";
import {
  getPvcOrderByReference,
  logPaymentEvent,
  markPvcOrderPaid,
  markPvcOrderPaymentFailed,
  setPvcOrderEmailStatus,
} from "@/lib/shop/pvc-orders";

export const dynamic = "force-dynamic";

/**
 * PayFast Instant Transaction Notification (ITN).
 * Checks, per PayFast: signature, source, amount, and server confirmation.
 * Only a notification that passes signature + amount + server confirmation
 * can mark an order paid. The source-IP check is logged, not enforced,
 * because the server confirmation already proves the data came from PayFast.
 */
export async function POST(request: Request): Promise<Response> {
  const configResult = getPayfastConfig();
  if (!configResult.ok) {
    console.error("[payfast-itn] not configured:", configResult.reason);
    return new Response("Not configured", { status: 503 });
  }
  const config = configResult.config;

  const body = await request.text();
  if (body.length > 10_000) return new Response("Too large", { status: 413 });
  const itn = parseItnBody(body);
  const sourceIp = clientIpFromHeaders(request.headers);

  const signatureValid = isItnSignatureValid(itn, config.passphrase);
  const merchantMatches = itn.merchantId === config.merchantId;
  const order = itn.mPaymentId ? await getPvcOrderByReference(itn.mPaymentId) : null;
  const amountMatches = order ? isItnAmountValid(itn, Math.round(order.amountDueZar * 100)) : false;
  const tokenMatches = order ? itn.viewToken === order.viewToken : false;

  let serverConfirmed = false;
  let sourceIpRecognised = false;
  if (signatureValid && merchantMatches && order) {
    [serverConfirmed, sourceIpRecognised] = await Promise.all([
      confirmItnWithPayfast(config, itn.paramString),
      isPayfastSourceIp(sourceIp).catch(() => false),
    ]);
  }

  let outcome: string;
  let status = 200;
  if (!signatureValid) {
    outcome = "rejected_signature";
    status = 400;
  } else if (!merchantMatches) {
    outcome = "rejected_merchant";
    status = 400;
  } else if (!order) {
    outcome = "rejected_unknown_order";
  } else if (!serverConfirmed) {
    outcome = "rejected_not_confirmed";
    status = 400;
  } else if (itn.paymentStatus === "COMPLETE") {
    if (!amountMatches || !tokenMatches) {
      outcome = !amountMatches ? "rejected_amount_mismatch" : "rejected_token_mismatch";
    } else {
      const changed = await markPvcOrderPaid({
        orderId: order.id,
        payfastPaymentId: itn.pfPaymentId,
        amountPaidZar: Number(itn.amountGross),
      });
      outcome = changed ? "paid" : "duplicate_paid";
      if (changed) {
        const paidOrder = { ...order, status: "paid", paymentStatus: "paid", amountPaidZar: Number(itn.amountGross) };
        const adminUrl = `${shopOrigin()}/admin/orders/${order.id}/`;
        // Reply to PayFast quickly; send the emails after the response.
        after(async () => {
          const result = await sendPvcPaidEmails(paidOrder, adminUrl);
          await setPvcOrderEmailStatus(order.id, result.customer, result.internal);
        });
      }
    }
  } else if (itn.paymentStatus === "CANCELLED" || itn.paymentStatus === "FAILED") {
    await markPvcOrderPaymentFailed(order.id, itn.paymentStatus === "FAILED" ? "failed" : "cancelled");
    outcome = `payment_${itn.paymentStatus.toLowerCase()}`;
  } else {
    outcome = `ignored_status_${itn.paymentStatus || "missing"}`.slice(0, 60);
  }

  if (outcome.startsWith("rejected")) {
    console.error("[payfast-itn]", outcome, { ref: itn.mPaymentId, sourceIp });
  }

  await logPaymentEvent({
    orderId: order?.id ?? null,
    mPaymentId: itn.mPaymentId,
    providerPaymentId: itn.pfPaymentId,
    providerStatus: itn.paymentStatus,
    amountGross: itn.amountGross,
    signatureValid,
    sourceIp,
    sourceIpRecognised,
    serverConfirmed,
    amountMatches,
    outcome,
    payload: itn.fields,
  });

  return new Response(status === 200 ? "OK" : "Rejected", { status });
}
