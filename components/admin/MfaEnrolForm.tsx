"use client";

import { useState, useTransition } from "react";
import { startTotpEnrolAction, verifyTotpAction, type TotpEnrolment } from "@/app/admin/mfa/actions";
import {
  AdminActionForm,
  AdminButton,
  AdminHelpText,
  AdminInput,
  AdminLabel,
  AdminSubmitButton,
} from "@/components/admin/ui";

/** First-time authenticator-app set-up: QR code, then the first code. */
export function MfaEnrolForm({ nextPath }: { nextPath: string }) {
  const [enrolment, setEnrolment] = useState<TotpEnrolment | null>(null);
  const [pending, startTransition] = useTransition();

  if (!enrolment?.ok) {
    return (
      <div className="admin-login__form">
        <p className="admin-login__lead">
          Admin sign-in now needs a code from an authenticator app (Google
          Authenticator, Microsoft Authenticator, Authy or similar). This is a
          once-off set-up.
        </p>
        <AdminButton
          disabled={pending}
          onClick={() => startTransition(async () => setEnrolment(await startTotpEnrolAction()))}
        >
          {pending ? "Preparing…" : "Set up authenticator app"}
        </AdminButton>
        {enrolment && !enrolment.ok ? (
          <p className="admin-login__error" role="alert">
            {enrolment.error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <AdminActionForm action={verifyTotpAction} className="admin-login__form">
      <ol className="admin-mfa__steps">
        <li>Open your authenticator app and add a new account.</li>
        <li>Scan this QR code with it.</li>
      </ol>
      {/* Supabase returns the QR code as an SVG data URI; next/image adds nothing here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="admin-mfa__qr"
        src={enrolment.qrCode}
        alt="QR code for adding Damtech Admin to your authenticator app"
        width={200}
        height={200}
      />
      <AdminHelpText>
        Can&apos;t scan? Enter this key in the app instead:{" "}
        <code className="admin-mfa__secret">{enrolment.secret}</code>
      </AdminHelpText>
      <input type="hidden" name="factorId" value={enrolment.factorId} />
      <input type="hidden" name="next" value={nextPath} />
      <div className="admin-login__field">
        <AdminLabel htmlFor="mfa-code" required>
          6-digit code from the app
        </AdminLabel>
        <AdminInput
          id="mfa-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
        />
      </div>
      <AdminSubmitButton pendingLabel="Checking…">Finish set-up</AdminSubmitButton>
    </AdminActionForm>
  );
}
