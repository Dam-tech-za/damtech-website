export type EmailSendResult =
  | {
      ok: true;
      providerMessageId?: string;
      status: "sent" | "skipped";
    }
  | {
      ok: false;
      error: string;
      status: "failed" | "pending_configuration";
    };

export type RfqCommunicationType =
  | "customer_confirmation"
  | "admin_notification"
  | "admin_resend";
