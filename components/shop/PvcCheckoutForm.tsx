"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { startPvcCheckout } from "@/app/actions/start-pvc-checkout";
import { LegalSupplierDetails } from "@/components/LegalSupplierDetails";
import { ShieldCheckIcon } from "@/components/icons/StrokeIcons";
import { formatZarExactAmount } from "@/lib/catalogue/format";
import { checkRequiredFields } from "@/lib/form-required";
import type { PayfastForm } from "@/lib/payfast/payment";
import { DELIVERY_PROVINCES, deliveryQuoteForProvince } from "@/lib/shop/delivery";
import {
  PVC_LINER_MANUFACTURE_LABEL,
  PVC_LINER_MAX_QUANTITY,
  PVC_LINER_PAGE_PATH,
  type PvcLiner,
  type PvcLinerColour,
} from "@/lib/shop/pvc-liners";
import { ORDER_FULFILMENT_METHOD } from "@/lib/orders/types";

function Field({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

function TextInput(props: {
  id: string;
  autoComplete?: string;
  type?: string;
  maxLength: number;
  required?: boolean;
  disabled: boolean;
}) {
  return (
    <input
      id={props.id}
      name={props.id}
      type={props.type ?? "text"}
      autoComplete={props.autoComplete}
      className="form-input"
      required={props.required}
      maxLength={props.maxLength}
      disabled={props.disabled}
    />
  );
}

export function PvcCheckoutForm({
  liner,
  colour,
  initialQuantity,
}: {
  liner: PvcLiner;
  colour: PvcLinerColour;
  initialQuantity: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [province, setProvince] = useState("");
  const [payfast, setPayfast] = useState<PayfastForm | null>(null);
  const [submissionId] = useState(() => crypto.randomUUID());
  const [formStartedAt] = useState(() => Date.now());
  const payfastFormRef = useRef<HTMLFormElement>(null);

  const totals = useMemo(() => {
    const goodsCents = liner.priceInclVatCents * quantity;
    const delivery = deliveryQuoteForProvince(province);
    return {
      goods: goodsCents / 100,
      delivery: delivery ? delivery.feeInclVatZar : null,
      total: delivery ? (goodsCents + delivery.feeInclVatCents) / 100 : null,
    };
  }, [liner, quantity, province]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || payfast) return;
    setError(null);
    const form = event.currentTarget;
    const missing = checkRequiredFields(form);
    if (missing) {
      setError(missing);
      return;
    }
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await startPvcCheckout(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setPayfast(result.payfast);
      // Post the signed form to PayFast once React has rendered it.
      requestAnimationFrame(() => payfastFormRef.current?.submit());
    });
  }

  const busy = isPending || Boolean(payfast);

  return (
    <div className="order-layout">
      <form className="order-form" onSubmit={handleSubmit} noValidate>
        <input type="hidden" name="sku" value={liner.sku} />
        <input type="hidden" name="colour" value={colour} />
        <input type="hidden" name="submissionId" value={submissionId} />
        <input type="hidden" name="formStartedAt" value={String(formStartedAt)} />
        <input type="hidden" name="fulfilmentMethod" value={ORDER_FULFILMENT_METHOD} />
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0">
          <label htmlFor="pvc-website">Website</label>
          <input id="pvc-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        {error ? (
          <p className="order-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <fieldset className="order-fieldset">
          <legend>Customer</legend>
          <Field id="customerType" label="Customer type" required>
            <select id="customerType" name="customerType" className="form-input" required defaultValue="individual" disabled={busy}>
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </Field>
          <Field id="customerName" label="Full name" required>
            <TextInput id="customerName" autoComplete="name" maxLength={200} required disabled={busy} />
          </Field>
          <Field id="businessName" label="Business name">
            <TextInput id="businessName" autoComplete="organization" maxLength={200} disabled={busy} />
          </Field>
          <div className="order-form__grid">
            <Field id="email" label="Email address" required>
              <TextInput id="email" type="email" autoComplete="email" maxLength={320} required disabled={busy} />
            </Field>
            <Field id="phone" label="Phone number" required hint="We call this number to arrange delivery.">
              <TextInput id="phone" type="tel" autoComplete="tel" maxLength={40} required disabled={busy} />
            </Field>
          </div>
          <div className="order-form__grid">
            <Field id="vatNumber" label="VAT number">
              <TextInput id="vatNumber" maxLength={20} disabled={busy} />
            </Field>
            <Field id="customerPoNumber" label="Purchase-order number">
              <TextInput id="customerPoNumber" maxLength={80} disabled={busy} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="order-fieldset">
          <legend>Delivery address</legend>
          <Field id="billingLine1" label="Street address" required>
            <TextInput id="billingLine1" autoComplete="address-line1" maxLength={200} required disabled={busy} />
          </Field>
          <Field id="billingLine2" label="Address line 2">
            <TextInput id="billingLine2" autoComplete="address-line2" maxLength={200} disabled={busy} />
          </Field>
          <div className="order-form__grid">
            <Field id="suburb" label="Suburb or district" required>
              <TextInput id="suburb" autoComplete="address-level3" maxLength={120} required disabled={busy} />
            </Field>
            <Field id="city" label="Town or city" required>
              <TextInput id="city" autoComplete="address-level2" maxLength={120} required disabled={busy} />
            </Field>
          </div>
          <div className="order-form__grid">
            <Field id="province" label="Province" required hint="The delivery fee depends on the province.">
              <select
                id="province"
                name="province"
                className="form-input"
                required
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                disabled={busy}
              >
                <option value="" disabled>
                  Select a province
                </option>
                {DELIVERY_PROVINCES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="postalCode" label="Postal code" required>
              <TextInput id="postalCode" autoComplete="postal-code" maxLength={12} required disabled={busy} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="order-fieldset">
          <legend>Order</legend>
          <Field id="quantity" label="Quantity" required>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              max={PVC_LINER_MAX_QUANTITY}
              step={1}
              className="form-input catalogue-buybox__qty-input"
              value={quantity}
              onChange={(event) => {
                const n = Math.trunc(Number(event.target.value));
                setQuantity(Number.isFinite(n) ? Math.min(PVC_LINER_MAX_QUANTITY, Math.max(1, n)) : 1);
              }}
              disabled={busy}
            />
          </Field>
          <Field id="notes" label="Delivery instructions" hint="Optional: gate codes, farm directions, best time to call.">
            <textarea id="notes" name="notes" className="form-input" rows={3} maxLength={2000} disabled={busy} />
          </Field>
        </fieldset>

        <fieldset className="order-fieldset">
          <legend>Confirmation</legend>
          <label className="order-check">
            <input type="checkbox" name="confirmSupplyOnly" value="true" required disabled={busy} />
            <span>
              I have checked that this {colour} liner matches my tank ({liner.diameterM} m diameter, {liner.rows} rows).
              It is made to order for this size.
            </span>
          </label>
          <label className="order-check">
            <input type="checkbox" name="confirmExclusions" value="true" required disabled={busy} />
            <span>I understand that installation is not included.</span>
          </label>
          <label className="order-check">
            <input type="checkbox" name="confirmPolicies" value="true" required disabled={busy} />
            <span>
              I agree to DamTech’s{" "}
              <Link href="/terms/" className="text-water hover:underline">
                terms
              </Link>
              ,{" "}
              <Link href="/privacy/" className="text-water hover:underline">
                privacy policy
              </Link>{" "}
              and{" "}
              <Link href="/returns/" className="text-water hover:underline">
                returns/cancellation policy
              </Link>
              .
            </span>
          </label>
        </fieldset>

        <section className="order-section" aria-labelledby="supplier-details">
          <LegalSupplierDetails compact />
        </section>

        <section className="order-section" aria-labelledby="pvc-payment-heading">
          <h2 id="pvc-payment-heading" className="order-section__heading">
            Payment
          </h2>
          <p>
            You pay securely on PayFast by card, Instant EFT or another method PayFast offers. DamTech never sees your
            card details.
          </p>
          <p className="order-payment-security">
            <ShieldCheckIcon className="order-payment-security__icon" />
            <span>Manufacture starts once PayFast confirms your payment.</span>
          </p>
        </section>

        <div className="order-submit">
          <button type="submit" className="btn-primary order-submit__button" disabled={busy}>
            {payfast ? "Opening PayFast…" : isPending ? "Saving your order…" : "Continue to secure payment"}
          </button>
          <p className="order-submit__note">You will be taken to PayFast to pay.</p>
        </div>
      </form>

      <aside className="order-summary order-summary--sticky" aria-labelledby="pvc-summary-heading">
        <h2 id="pvc-summary-heading" className="order-summary__heading">
          Order summary
        </h2>
        <div className="order-summary__product">
          <div className="order-summary__product-copy">
            <p className="order-summary__name">
              {liner.name}, {colour}
            </p>
            <p className="order-summary__sku">SKU {liner.sku}</p>
            <p className="order-summary__spec">{liner.summary}</p>
            <p className="order-summary__qty">Quantity {quantity}</p>
          </div>
        </div>
        <section className="order-summary__block order-summary__block--last" aria-label="Price">
          <dl className="order-summary__rows">
            <div>
              <dt>Liner incl. VAT</dt>
              <dd>
                <span className="order-money">{formatZarExactAmount(totals.goods)}</span>
              </dd>
            </div>
            <div>
              <dt>Delivery incl. VAT</dt>
              <dd>
                {totals.delivery === null ? (
                  <span>Select a province</span>
                ) : (
                  <span className="order-money">{formatZarExactAmount(totals.delivery)}</span>
                )}
              </dd>
            </div>
            <div className="order-summary__rows-total">
              <dt>Total to pay</dt>
              <dd>
                {totals.total === null ? "–" : <span className="order-money">{formatZarExactAmount(totals.total)}</span>}
              </dd>
            </div>
          </dl>
          <p className="order-summary__price-note">
            {PVC_LINER_MANUFACTURE_LABEL}, then delivered. Installation is not included.{" "}
            <Link href={`${PVC_LINER_PAGE_PATH}?sku=${liner.sku}`} className="text-water hover:underline">
              Change size
            </Link>
          </p>
        </section>
      </aside>

      {payfast ? (
        <form ref={payfastFormRef} action={payfast.action} method="post" hidden aria-hidden>
          {payfast.fields.map((field) => (
            <input key={field.name} type="hidden" name={field.name} value={field.value} />
          ))}
        </form>
      ) : null}
    </div>
  );
}
