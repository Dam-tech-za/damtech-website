export type FallbackFormType =
  | "simple_quote"
  | "calculator_rfq"
  | "contact"
  | "catalogue_order";

export const FALLBACK_FORM_LABELS: Record<FallbackFormType, string> = {
  simple_quote: "Simple quote / invoice request",
  calculator_rfq: "Calculator multi-asset RFQ",
  contact: "Contact enquiry",
  catalogue_order: "Catalogue order",
};

export type FallbackEmailSection = {
  title: string;
  rows: Array<{ label: string; value: string }>;
};

export type DatabaseFallbackInput = {
  formType: FallbackFormType;
  submissionId: string;
  incidentId: string;
  sourcePage?: string;
  attachmentsNote?: string;
  sections: FallbackEmailSection[];
};

export type DatabaseFallbackResult =
  | { ok: true; incidentId: string; idempotentReplay: boolean }
  | { ok: false; incidentId: string; reason: "resend_unavailable" | "resend_rejected" };

export type PublicSubmissionSuccess =
  | {
      success: true;
      deliveryMode: "normal";
      rfqNumber?: string;
      uploadToken?: string;
      orderReference?: string;
      viewToken?: string;
      notificationStatus?: string;
      [key: string]: unknown;
    }
  | {
      success: true;
      deliveryMode: "fallback";
      incidentId: string;
    };
