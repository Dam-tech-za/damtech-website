import {
  formatRegisteredAddressLines,
  hasPublishedRegistrationNumber,
  LEGAL_ENTITY,
} from "@/lib/legal-entity";

type LegalSupplierDetailsProps = {
  compact?: boolean;
  heading?: string;
  headingId?: string;
};

export function LegalSupplierDetails({
  compact = false,
  heading = "Supplier details",
  headingId = "supplier-details",
}: LegalSupplierDetailsProps) {
  const lines = formatRegisteredAddressLines();

  return (
    <div className={compact ? "legal-supplier legal-supplier--compact" : "legal-supplier"}>
      {heading ? (
        <h2 id={headingId} className={compact ? "legal-supplier__heading" : undefined}>
          {heading}
        </h2>
      ) : null}
      <p>
        <strong>{LEGAL_ENTITY.legalName}</strong>, trading as {LEGAL_ENTITY.tradingName}.
        A private company registered in {LEGAL_ENTITY.placeOfRegistration}.
      </p>
      {hasPublishedRegistrationNumber() ? (
        <p>Registration number: {LEGAL_ENTITY.registrationNumber}</p>
      ) : null}
      <p>
        Physical address: {lines.join(", ")}. {LEGAL_ENTITY.walkInNote}
      </p>
      <p>
        Telephone: <a href={`tel:${LEGAL_ENTITY.phoneTel}`}>{LEGAL_ENTITY.phone}</a>
        {" · "}
        Email: <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>
        {" · "}
        Website: {LEGAL_ENTITY.website.replace(/^https?:\/\//, "")}
      </p>
    </div>
  );
}
