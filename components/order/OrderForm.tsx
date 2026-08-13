"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { submitCatalogueOrder } from "@/app/actions/submit-order";
import { OrderSummary } from "@/components/order/OrderSummary";
import { pushCatalogueAnalytics } from "@/components/catalogue/pushCatalogueAnalytics";
import {
  buildCatalogueAnalyticsItem,
  CATALOGUE_ANALYTICS_EVENTS,
} from "@/lib/catalogue/analytics";
import {
  invoiceRequestPath,
  parseCatalogueQuantity,
} from "@/lib/catalogue";
import { PROVINCE_OPTIONS } from "@/lib/form";
import { breakdownVatInclusive } from "@/lib/orders/money";
import type { OrderPriceSnapshot } from "@/lib/orders/pricing";
import { ORDER_FULFILMENT_METHOD } from "@/lib/orders/types";
import { ShieldCheckIcon } from "@/components/icons/StrokeIcons";

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

export function OrderForm({ snapshot }: { snapshot: OrderPriceSnapshot }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(snapshot.quantity);
  const [submissionId] = useState(() => crypto.randomUUID());
  const [formStartedAt] = useState(() => Date.now());
  const liveSnapshot = useMemo(() => {
    const breakdown = breakdownVatInclusive(
      snapshot.unitPriceInclVatZar,
      quantity,
      snapshot.vatRatePercent,
    );
    return {
      ...snapshot,
      quantity,
      vatAmountZar: breakdown.vatAmountZar,
      totalInclVatZar: breakdown.totalInclVatZar,
      breakdown,
    };
  }, [snapshot, quantity]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await submitCatalogueOrder(formData);
      if (!result.success) {
        pushCatalogueAnalytics(
          CATALOGUE_ANALYTICS_EVENTS.orderError,
          buildCatalogueAnalyticsItem(snapshot.product, quantity),
          { error_code: result.code ?? "UNKNOWN" },
        );
        setError(result.error);
        return;
      }
      pushCatalogueAnalytics(
        CATALOGUE_ANALYTICS_EVENTS.orderSubmitted,
        buildCatalogueAnalyticsItem(snapshot.product, result.quantity),
        { order_reference: result.orderReference },
      );
      router.replace(
        `/order/success/?ref=${encodeURIComponent(result.orderReference)}&token=${encodeURIComponent(result.viewToken)}`,
      );
    });
  }

  return (
    <div className="order-layout">
      <form
        className="order-form"
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={error ? "order-form-error" : undefined}
      >
        <input type="hidden" name="sku" value={snapshot.sku} />
        <input type="hidden" name="submissionId" value={submissionId} />
        <input type="hidden" name="formStartedAt" value={String(formStartedAt)} />
        <input
          type="hidden"
          name="fulfilmentMethod"
          value={ORDER_FULFILMENT_METHOD}
        />
        <div
          aria-hidden
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
        >
          <label htmlFor="order-website">Website</label>
          <input
            id="order-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        {error ? (
          <p id="order-form-error" className="order-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <fieldset className="order-fieldset">
          <legend>Customer</legend>
          <Field id="customerType" label="Customer type" required>
            <select
              id="customerType"
              name="customerType"
              className="form-input"
              required
              defaultValue="individual"
              disabled={isPending}
            >
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </Field>
          <Field id="customerName" label="Full name" required>
            <input
              id="customerName"
              name="customerName"
              type="text"
              autoComplete="name"
              className="form-input"
              required
              maxLength={200}
              disabled={isPending}
            />
          </Field>
          <Field id="businessName" label="Business name">
            <input
              id="businessName"
              name="businessName"
              type="text"
              autoComplete="organization"
              className="form-input"
              maxLength={200}
              disabled={isPending}
            />
          </Field>
          <div className="order-form__grid">
            <Field id="email" label="Email address" required>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="form-input"
                required
                maxLength={320}
                disabled={isPending}
              />
            </Field>
            <Field
              id="phone"
              label="South African mobile number"
              required
              hint="International formatting is accepted."
            >
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="form-input"
                required
                maxLength={40}
                disabled={isPending}
              />
            </Field>
          </div>
          <div className="order-form__grid">
            <Field id="vatNumber" label="VAT number">
              <input
                id="vatNumber"
                name="vatNumber"
                type="text"
                className="form-input"
                maxLength={20}
                disabled={isPending}
              />
            </Field>
            <Field id="customerPoNumber" label="Purchase-order number">
              <input
                id="customerPoNumber"
                name="customerPoNumber"
                type="text"
                className="form-input"
                maxLength={80}
                disabled={isPending}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="order-fieldset">
          <legend>Billing</legend>
          <Field id="billingLine1" label="Billing address line 1" required>
            <input
              id="billingLine1"
              name="billingLine1"
              type="text"
              autoComplete="address-line1"
              className="form-input"
              required
              maxLength={200}
              disabled={isPending}
            />
          </Field>
          <Field id="billingLine2" label="Billing address line 2">
            <input
              id="billingLine2"
              name="billingLine2"
              type="text"
              autoComplete="address-line2"
              className="form-input"
              maxLength={200}
              disabled={isPending}
            />
          </Field>
          <div className="order-form__grid">
            <Field id="suburb" label="Suburb" required>
              <input
                id="suburb"
                name="suburb"
                type="text"
                autoComplete="address-level3"
                className="form-input"
                required
                maxLength={120}
                disabled={isPending}
              />
            </Field>
            <Field id="city" label="City or town" required>
              <input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                className="form-input"
                required
                maxLength={120}
                disabled={isPending}
              />
            </Field>
          </div>
          <div className="order-form__grid">
            <Field id="province" label="Province" required>
              <select
                id="province"
                name="province"
                className="form-input"
                required
                defaultValue=""
                disabled={isPending}
              >
                <option value="" disabled>
                  Select a province
                </option>
                {PROVINCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="postalCode" label="Postal code" required>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                autoComplete="postal-code"
                className="form-input"
                required
                maxLength={12}
                disabled={isPending}
              />
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
              max={99}
              step={1}
              className="form-input catalogue-buybox__qty-input"
              value={quantity}
              onChange={(event) =>
                setQuantity(parseCatalogueQuantity(event.target.value))
              }
              disabled={isPending}
            />
          </Field>
          <Field id="notes" label="Customer notes">
            <textarea
              id="notes"
              name="notes"
              className="form-input"
              rows={4}
              maxLength={2000}
              disabled={isPending}
            />
          </Field>
        </fieldset>

        <section className="order-section" aria-labelledby="order-fulfilment-heading">
          <h2 id="order-fulfilment-heading" className="order-section__heading">
            How will you receive your kit?
          </h2>
          <div className="order-fulfilment-card">
            <div className="order-fulfilment-card__top">
              <p className="order-fulfilment-card__title">
                Collection or own transport
                <span className="sr-only">, selected fulfilment method</span>
              </p>
              <span className="order-fulfilment-card__badge">Selected</span>
            </div>
            <p>
              You or your appointed transporter will collect the kit. DamTech
              will confirm the collection point and collection arrangements on
              your invoice.
            </p>
            <p className="order-fulfilment-card__notice">
              Transport is not included in your order total.
            </p>
          </div>
          <div className="order-transport-panel">
            <h3 className="order-section__subheading">
              Need DamTech to arrange transport?
            </h3>
            <p>Request a separate transport quote for delivery to your location.</p>
            <Link
              href={invoiceRequestPath(snapshot.sku, quantity)}
              className="btn-secondary order-transport-panel__button"
              onClick={() => {
                pushCatalogueAnalytics(
                  CATALOGUE_ANALYTICS_EVENTS.addToRfq,
                  buildCatalogueAnalyticsItem(snapshot.product, quantity),
                );
              }}
            >
              Request a transport quote
            </Link>
          </div>
        </section>

        <fieldset className="order-fieldset">
          <legend>Confirmation</legend>
          <label className="order-check">
            <input
              type="checkbox"
              name="confirmSupplyOnly"
              value="true"
              required
              disabled={isPending}
            />
            <span>I confirm that this is a fixed-price supply-only kit.</span>
          </label>
          <label className="order-check">
            <input
              type="checkbox"
              name="confirmExclusions"
              value="true"
              required
              disabled={isPending}
            />
            <span>I understand that transport and installation are excluded.</span>
          </label>
          <label className="order-check">
            <input
              type="checkbox"
              name="confirmPolicies"
              value="true"
              required
              disabled={isPending}
            />
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

        <section className="order-section" aria-labelledby="order-payment-heading">
          <h2 id="order-payment-heading" className="order-section__heading">
            Invoice payment
          </h2>
          <p>
            After you place your order, DamTech will email your order
            confirmation. Your formal invoice will follow separately.
          </p>
          <p className="order-payment-security">
            <ShieldCheckIcon className="order-payment-security__icon" />
            <span>
              Only make payment using the banking details shown on the official
              DamTech invoice.
            </span>
          </p>
        </section>

        <div className="order-submit">
          <p className="order-submit__confirm">
            You are placing an order for a fixed-price supply-only kit. Transport
            and installation are excluded.
          </p>
          <button
            type="submit"
            className="btn-primary order-submit__button"
            disabled={isPending}
          >
            {isPending ? "Placing order…" : "Place order"}
          </button>
          <p className="order-submit__note">No payment is collected on this page.</p>
        </div>
      </form>
      <OrderSummary snapshot={liveSnapshot} sticky />
    </div>
  );
}
