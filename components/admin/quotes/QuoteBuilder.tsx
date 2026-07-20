"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { CustomerRecord } from "@/components/admin/customers/CustomerSummaryCard";
import {
  AdminButton,
  AdminDropdownMenu,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/ui";
import {
  QuoteActionBar,
  QuoteCustomerPanel,
  QuoteItemsPanel,
  QuoteProgressStrip,
  QuoteProjectPanel,
  QuoteScopePanel,
  QuoteSummaryPanel,
  QuoteTermsPanel,
  RfqImportDialog,
  SendQuoteDialog,
  VatModeChangeDialog,
  StalePriceWarning,
  type SendQuotePayload,
} from "@/components/admin/quotes";
import { calculateQuote, convertLinesForVatModeChange } from "@/lib/quotes/calculate-quote";
import type { RfqImportPreview } from "@/lib/quotes/import-rfq";
import type {
  DiscountType,
  EditableLine,
  QuoteBuilderDefaults,
  SaveStatus,
  VatPricingMode,
} from "@/lib/quotes/quote-builder-types";
import {
  assessQuoteReadiness,
  validatePreview,
  validateSend,
} from "@/lib/quotes/quote-validation";
import type { QuoteLineType, QuoteStatus } from "@/lib/quotes/types";
import { formatQuoteNumber } from "@/lib/quotes/types";

export type QuoteBuilderProps = {
  mode: "create" | "edit";
  showCost: boolean;
  canCreateCustomer: boolean;
  canSend: boolean;
  customers: CustomerRecord[];
  defaults: QuoteBuilderDefaults;
  onSave: (formData: FormData) => Promise<
    | { ok: true; quoteId: string; quoteNumber?: string }
    | { ok: false; error: string }
  >;
  onSend?: (
    quoteId: string,
    payload: SendQuotePayload,
  ) => Promise<{ ok: boolean; error?: string }>;
  onSearchRfqs?: (query: string) => Promise<
    | { ok: true; results: import("@/lib/quotes/import-rfq").RfqSearchResult[] }
    | { ok: false; error: string }
  >;
  onLoadRfqPreview?: (
    rfqId: string,
    currentCustomerId?: string,
  ) => Promise<
    | { ok: true; preview: RfqImportPreview }
    | { ok: false; error: string }
  >;
  cancelHref?: string;
  duplicateHref?: string;
  tankModels?: import("./TankModelPickerDialog").TankModelRecord[];
  staleAssessments?: import("@/lib/pricing/stale-prices").StaleLineAssessment[];
};

function emptyLine(sortOrder: number, lineType: QuoteLineType = "custom"): EditableLine {
  return {
    sortOrder,
    lineType,
    itemCode: "",
    category: "",
    description: lineType === "heading" ? "Section heading" : "",
    quantity: lineType === "heading" || lineType === "note" ? 0 : 1,
    unit: "ea",
    costUnitPrice: null,
    sellUnitPrice: 0,
    discountPercent: 0,
    taxCategory: "standard",
    sourceMaterialItemId: null,
    sourceLabourItemId: null,
    sourceSupplierPriceId: null,
    metadata: null,
  };
}

export function QuoteBuilder({
  mode,
  showCost,
  canCreateCustomer,
  canSend,
  customers,
  defaults,
  onSave,
  onSend,
  onSearchRfqs,
  onLoadRfqPreview,
  cancelHref = "/admin/quotes/",
  duplicateHref,
  tankModels = [],
  staleAssessments = [],
}: QuoteBuilderProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [rfqImportOpen, setRfqImportOpen] = useState(false);
  const [vatModeDialogOpen, setVatModeDialogOpen] = useState(false);
  const [pendingVatMode, setPendingVatMode] = useState<VatPricingMode | null>(null);
  const [staleDismissed, setStaleDismissed] = useState(false);

  const [quoteId, setQuoteId] = useState(defaults.quoteId ?? "");
  const [quoteNumber, setQuoteNumber] = useState(defaults.quoteNumber ?? "");
  const [revisionNumber, setRevisionNumber] = useState(defaults.revisionNumber ?? 0);
  const [status, setStatus] = useState<QuoteStatus>(defaults.status ?? "draft");
  const [customerOptions, setCustomerOptions] = useState(customers);
  const [customerId, setCustomerId] = useState(defaults.customerId);
  const [lines, setLines] = useState<EditableLine[]>(
    defaults.lines.length ? defaults.lines : [emptyLine(0)],
  );

  const [title, setTitle] = useState(defaults.title);
  const [rfqId, setRfqId] = useState(defaults.rfqId);
  const [rfqReference, setRfqReference] = useState(defaults.rfqReference ?? "");
  const [projectReference, setProjectReference] = useState(defaults.projectReference);
  const [projectLocation, setProjectLocation] = useState(defaults.projectLocation);
  const [serviceRequired, setServiceRequired] = useState(defaults.serviceRequired);
  const [projectDescription, setProjectDescription] = useState(defaults.projectDescription);
  const [scopeSummary, setScopeSummary] = useState(defaults.scopeSummary);
  const [assumptions, setAssumptions] = useState(defaults.assumptions);
  const [exclusions, setExclusions] = useState(defaults.exclusions);
  const [paymentTerms, setPaymentTerms] = useState(defaults.paymentTerms);
  const [programmeNotes, setProgrammeNotes] = useState(defaults.programmeNotes);
  const [warrantyWording, setWarrantyWording] = useState(defaults.warrantyWording);
  const [customerMessage, setCustomerMessage] = useState(defaults.customerMessage);
  const [internalNotes, setInternalNotes] = useState(defaults.internalNotes);
  const [issueDate, setIssueDate] = useState(defaults.issueDate);
  const [validUntil, setValidUntil] = useState(defaults.validUntil);
  const [depositPercent, setDepositPercent] = useState(defaults.depositPercent);
  const [contactName, setContactName] = useState(defaults.contactName);
  const [companyName, setCompanyName] = useState(defaults.companyName);
  const [email, setEmail] = useState(defaults.email);
  const [phone, setPhone] = useState(defaults.phone);
  const [province, setProvince] = useState(defaults.province);
  const [discountType, setDiscountType] = useState<DiscountType>(defaults.discountType);
  const [discountValue, setDiscountValue] = useState(
    defaults.discountType === "percent" ? defaults.discountPercent : defaults.discountAmount,
  );
  const [discountReason, setDiscountReason] = useState(defaults.discountReason);
  const [vatRate, setVatRate] = useState(defaults.vatRate);
  const [vatPricingMode, setVatPricingMode] = useState<VatPricingMode>(
    defaults.vatPricingMode,
  );
  const [estimatorConfirmed, setEstimatorConfirmed] = useState(
    defaults.estimatorConfirmedSuggestions,
  );
  const [hasCalculatorSuggestions, setHasCalculatorSuggestions] = useState(
    defaults.hasCalculatorSuggestions,
  );

  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setSaveStatus("unsaved");
  }, []);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const totals = useMemo(
    () =>
      calculateQuote(lines, {
        discountAmount: discountType === "amount" ? discountValue : 0,
        discountType,
        discountPercent: discountType === "percent" ? discountValue : 0,
        vatRatePercent: vatRate,
        vatPricingMode,
      }),
    [lines, discountType, discountValue, vatRate, vatPricingMode],
  );

  const readiness = useMemo(
    () =>
      assessQuoteReadiness({
        customerId,
        title,
        email,
        lines,
        issueDate,
        validUntil,
        paymentTerms,
        hasCalculatorSuggestions: hasCalculatorSuggestions,
        estimatorConfirmedSuggestions: estimatorConfirmed,
      }),
    [
      customerId,
      title,
      email,
      lines,
      issueDate,
      validUntil,
      paymentTerms,
      hasCalculatorSuggestions,
      estimatorConfirmed,
    ],
  );

  const previewBlockers = useMemo(
    () => validatePreview({ customerId, title, lines }),
    [customerId, title, lines],
  );

  const sendBlockers = useMemo(
    () =>
      validateSend({
        customerId,
        title,
        email,
        lines,
        issueDate,
        validUntil,
        paymentTerms,
        hasCalculatorSuggestions: hasCalculatorSuggestions,
        estimatorConfirmedSuggestions: estimatorConfirmed,
        status,
      }),
    [
      customerId,
      title,
      email,
      lines,
      issueDate,
      validUntil,
      paymentTerms,
      hasCalculatorSuggestions,
      estimatorConfirmed,
      status,
    ],
  );

  function applyCustomer(customer: CustomerRecord | null) {
    setCustomerId(customer?.id ?? "");
    if (!customer) return;
    setCustomerOptions((prev) =>
      prev.some((item) => item.id === customer.id) ? prev : [customer, ...prev],
    );
    setContactName(customer.name || "");
    setCompanyName(customer.company_name || customer.name || "");
    setEmail(customer.email || "");
    setPhone(customer.phone || "");
    setProvince(customer.province || "");
    markDirty();
  }

  function handleFieldChange(field: string, value: string | number) {
    markDirty();
    switch (field) {
      case "title":
        setTitle(String(value));
        break;
      case "rfqId":
        setRfqId(String(value));
        break;
      case "projectReference":
        setProjectReference(String(value));
        break;
      case "projectLocation":
        setProjectLocation(String(value));
        break;
      case "serviceRequired":
        setServiceRequired(String(value));
        break;
      case "projectDescription":
        setProjectDescription(String(value));
        break;
      case "scopeSummary":
        setScopeSummary(String(value));
        break;
      case "assumptions":
        setAssumptions(String(value));
        break;
      case "exclusions":
        setExclusions(String(value));
        break;
      case "customerMessage":
        setCustomerMessage(String(value));
        break;
      case "internalNotes":
        setInternalNotes(String(value));
        break;
      case "issueDate":
        setIssueDate(String(value));
        break;
      case "validUntil":
        setValidUntil(String(value));
        break;
      case "paymentTerms":
        setPaymentTerms(String(value));
        break;
      case "warrantyWording":
        setWarrantyWording(String(value));
        break;
      case "programmeNotes":
        setProgrammeNotes(String(value));
        break;
      case "depositPercent":
        setDepositPercent(Number(value));
        break;
      default:
        break;
    }
  }

  function buildFormData(): FormData {
    const formData = new FormData();
    formData.set("title", title);
    formData.set("customerId", customerId);
    formData.set("rfqId", rfqId);
    formData.set("projectReference", projectReference);
    formData.set("projectLocation", projectLocation);
    formData.set("serviceRequired", serviceRequired);
    formData.set("scopeSummary", scopeSummary);
    formData.set("projectDescription", projectDescription);
    formData.set("assumptions", assumptions);
    formData.set("exclusions", exclusions);
    formData.set("paymentTerms", paymentTerms);
    formData.set("programmeNotes", programmeNotes);
    formData.set("warrantyWording", warrantyWording);
    formData.set("customerMessage", customerMessage);
    formData.set("internalNotes", internalNotes);
    formData.set("issueDate", issueDate);
    formData.set("validUntil", validUntil);
    formData.set("depositPercent", String(depositPercent));
    formData.set("contactName", contactName);
    formData.set("companyName", companyName);
    formData.set("email", email);
    formData.set("phone", phone);
    formData.set("province", province);
    formData.set("discountAmount", String(discountType === "amount" ? discountValue : 0));
    formData.set("discountType", discountType);
    formData.set("discountPercent", String(discountType === "percent" ? discountValue : 0));
    formData.set("discountReason", discountReason);
    formData.set("vatRate", String(vatRate));
    formData.set("vatPricingMode", vatPricingMode);
    formData.set(
      "estimatorConfirmedSuggestions",
      estimatorConfirmed ? "true" : "false",
    );
    formData.set("linesJson", JSON.stringify(lines));
    return formData;
  }

  function applyRfqImport(preview: RfqImportPreview) {
    setRfqId(preview.rfqId);
    setRfqReference(preview.rfqNumber);
    setCustomerId(preview.customerId);
    setContactName(preview.contactName);
    setCompanyName(preview.companyName);
    setEmail(preview.email);
    setPhone(preview.phone);
    setProvince(preview.province);
    setTitle(preview.title);
    setProjectReference(preview.projectReference);
    setProjectLocation(preview.projectLocation);
    setServiceRequired(preview.serviceRequired);
    setProjectDescription(preview.projectDescription);
    if (preview.suggestedLines.length) {
      setLines(preview.suggestedLines);
      setHasCalculatorSuggestions(true);
      setEstimatorConfirmed(false);
    }
    markDirty();
  }

  function requestVatModeChange(nextMode: VatPricingMode) {
    if (nextMode === vatPricingMode) return;
    const hasPricedLines = lines.some(
      (line) =>
        line.lineType !== "heading" &&
        line.lineType !== "note" &&
        line.sellUnitPrice > 0,
    );
    if (!hasPricedLines) {
      markDirty();
      setVatPricingMode(nextMode);
      return;
    }
    setPendingVatMode(nextMode);
    setVatModeDialogOpen(true);
  }

  function confirmVatModeChange(strategy: "preserve_value" | "preserve_total") {
    if (!pendingVatMode) return;
    markDirty();
    if (strategy === "preserve_total") {
      setLines((current) =>
        convertLinesForVatModeChange(
          current,
          vatPricingMode,
          pendingVatMode,
          vatRate,
          "preserve_total",
        ) as EditableLine[],
      );
    }
    setVatPricingMode(pendingVatMode);
    setPendingVatMode(null);
    setVatModeDialogOpen(false);
  }

  async function persistDraft(): Promise<
    | { ok: true; quoteId: string; quoteNumber?: string }
    | { ok: false; error: string }
  > {
    if (savingRef.current) {
      return { ok: false, error: "Save already in progress." };
    }
    savingRef.current = true;
    setSaveStatus("saving");
    setError(null);
    try {
      const result = await onSave(buildFormData());
      if (!result.ok) {
        setSaveStatus("error");
        setError(result.error);
        return result;
      }
      dirtyRef.current = false;
      setSaveStatus("saved");
      setSavedAt(
        new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
      );
      setQuoteId(result.quoteId);
      if (result.quoteNumber) setQuoteNumber(result.quoteNumber);
      return result;
    } finally {
      savingRef.current = false;
    }
  }

  function handleSaveDraft(closeAfter = false) {
    startTransition(async () => {
      const result = await persistDraft();
      if (!result.ok) return;
      if (mode === "create" && !closeAfter) {
        router.replace(`/admin/quotes/${result.quoteId}/edit/`);
      } else if (closeAfter) {
        router.push(cancelHref);
      } else {
        router.refresh();
      }
    });
  }

  function handlePreview() {
    if (previewBlockers.length) {
      setError(previewBlockers[0]?.message ?? "Complete required fields before preview.");
      return;
    }
    startTransition(async () => {
      const result = await persistDraft();
      if (!result.ok) return;
      if (mode === "create") {
        router.replace(`/admin/quotes/${result.quoteId}/edit/`);
      }
      window.open(`/admin/quotes/${result.quoteId}/preview/`, "_blank", "noopener,noreferrer");
    });
  }

  function handleSendClick() {
    if (sendBlockers.some((b) => b.level === "error")) return;
    startTransition(async () => {
      let activeQuoteId = quoteId;
      if (!activeQuoteId) {
        const result = await persistDraft();
        if (!result.ok) return;
        activeQuoteId = result.quoteId;
        if (mode === "create") {
          router.replace(`/admin/quotes/${result.quoteId}/edit/`);
        }
      }
      setSendOpen(true);
    });
  }

  const headerTitle =
    mode === "create"
      ? "New Quote"
      : quoteNumber
        ? `Edit Quote ${formatQuoteNumber(quoteNumber, revisionNumber).label}`
        : "Edit Quote";

  const isEditable = status === "draft" || status === "internal_review";

  return (
    <div className="admin-quote-builder-page admin-stack--page">
      <AdminPageHeader
        title={headerTitle}
        description="Prepare the customer, project, pricing and commercial terms before previewing or sending the quotation."
        toolbar={<AdminStatusBadge status={status} domain="quote" />}
        secondaryActions={
          isEditable ? (
            <>
              <AdminButton
                type="button"
                variant="secondary"
                onClick={() => handleSaveDraft()}
                disabled={pending}
              >
                {pending ? "Saving…" : "Save Draft"}
              </AdminButton>
              <AdminButton
                type="button"
                variant="secondary"
                onClick={handlePreview}
                disabled={previewBlockers.length > 0}
              >
                Preview
              </AdminButton>
              <AdminDropdownMenu
                triggerLabel="More actions"
                items={[
                  {
                    id: "save-close",
                    label: "Save and close",
                    onSelect: () => handleSaveDraft(true),
                  },
                  {
                    id: "duplicate",
                    label: "Duplicate",
                    href: duplicateHref,
                    hidden: !duplicateHref,
                  },
                  {
                    id: "import-rfq",
                    label: "Import from RFQ",
                    onSelect: () => setRfqImportOpen(true),
                    hidden: !onSearchRfqs || !onLoadRfqPreview,
                  },
                  { id: "sep", label: "", separator: true },
                  {
                    id: "cancel",
                    label: "Cancel",
                    href: cancelHref,
                  },
                ]}
              />
            </>
          ) : null
        }
      />

      <QuoteProgressStrip sections={readiness} />

      {!staleDismissed && staleAssessments.length > 0 ? (
        <StalePriceWarning
          assessments={staleAssessments}
          onKeepCurrent={() => setStaleDismissed(true)}
          onUpdateSelected={(lineIds) => {
            markDirty();
            setLines((current) =>
              current.map((line, index) => {
                const key = line.id ?? String(index);
                if (!lineIds.includes(key)) return line;
                const assessment = staleAssessments.find(
                  (row) => (row.lineId ?? String(row.sortOrder)) === key,
                );
                if (!assessment?.newSellPrice) return line;
                return { ...line, sellUnitPrice: assessment.newSellPrice };
              }),
            );
            setStaleDismissed(true);
          }}
          onUpdateAll={() => {
            markDirty();
            setLines((current) =>
              current.map((line, index) => {
                const key = line.id ?? String(index);
                const assessment = staleAssessments.find(
                  (row) =>
                    (row.lineId ?? String(row.sortOrder)) === key &&
                    row.newSellPrice != null,
                );
                if (!assessment?.newSellPrice) return line;
                return { ...line, sellUnitPrice: assessment.newSellPrice };
              }),
            );
            setStaleDismissed(true);
          }}
        />
      ) : null}

      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}

      <form
        ref={formRef}
        className="admin-quote-builder"
        onSubmit={(event) => {
          event.preventDefault();
          handleSaveDraft();
        }}
      >
        <div className="admin-quote-builder__main">
          <QuoteCustomerPanel
            customers={customerOptions}
            customerId={customerId}
            onCustomerSelect={applyCustomer}
            canCreateCustomer={canCreateCustomer}
            contactName={contactName}
            companyName={companyName}
            email={email}
            phone={phone}
            province={province}
            onSnapshotChange={(field, value) => {
              markDirty();
              if (field === "contactName") setContactName(value);
              if (field === "companyName") setCompanyName(value);
              if (field === "email") setEmail(value);
              if (field === "phone") setPhone(value);
              if (field === "province") setProvince(value);
            }}
            editDetailsOpen={editDetailsOpen}
            onEditDetailsToggle={() => setEditDetailsOpen((prev) => !prev)}
          />

          <QuoteProjectPanel
            title={title}
            rfqReference={rfqReference}
            projectReference={projectReference}
            projectLocation={projectLocation}
            serviceRequired={serviceRequired}
            projectDescription={projectDescription}
            onChange={handleFieldChange}
            onImportRfq={
              onSearchRfqs && onLoadRfqPreview
                ? () => setRfqImportOpen(true)
                : undefined
            }
          />

          <QuoteItemsPanel
            lines={lines}
            showCost={showCost}
            hasCalculatorSuggestions={hasCalculatorSuggestions}
            estimatorConfirmedSuggestions={estimatorConfirmed}
            tankModels={tankModels}
            onLinesChange={(next) => {
              markDirty();
              setLines(next);
            }}
            onEstimatorConfirmChange={(confirmed) => {
              markDirty();
              setEstimatorConfirmed(confirmed);
            }}
          />

          <QuoteScopePanel
            scopeSummary={scopeSummary}
            assumptions={assumptions}
            exclusions={exclusions}
            customerMessage={customerMessage}
            internalNotes={internalNotes}
            onChange={handleFieldChange}
          />

          <QuoteTermsPanel
            issueDate={issueDate}
            validUntil={validUntil}
            depositPercent={depositPercent}
            paymentTerms={paymentTerms}
            warrantyWording={warrantyWording}
            programmeNotes={programmeNotes}
            onChange={handleFieldChange}
          />
        </div>

        <QuoteSummaryPanel
          status={status}
          customerName={contactName || companyName || "—"}
          projectTitle={title || "Untitled project"}
          totals={totals}
          showCost={showCost}
          discountType={discountType}
          discountValue={discountValue}
          vatPricingMode={vatPricingMode}
          vatRate={vatRate}
          onDiscountTypeChange={(type) => {
            markDirty();
            setDiscountType(type);
          }}
          onDiscountValueChange={(value) => {
            markDirty();
            setDiscountValue(value);
          }}
          onVatModeChange={requestVatModeChange}
          onVatRateChange={(rate) => {
            markDirty();
            setVatRate(rate);
          }}
          sections={readiness}
          blockers={sendBlockers}
          saveStatus={saveStatus}
          savedAt={savedAt}
          onSaveDraft={() => handleSaveDraft()}
          onPreview={handlePreview}
          onSend={handleSendClick}
          savePending={pending}
          canSend={canSend && isEditable}
          sendDisabled={sendBlockers.some((b) => b.level === "error")}
        />
      </form>

      <QuoteActionBar
        onSave={() => handleSaveDraft()}
        onPreview={handlePreview}
        onSend={handleSendClick}
        savePending={pending}
        previewDisabled={previewBlockers.length > 0}
        sendDisabled={sendBlockers.some((b) => b.level === "error") || !canSend || !isEditable}
      />

      {quoteId && onSend ? (
        <SendQuoteDialog
          key={`${quoteId}-${sendOpen ? "open" : "closed"}`}
          open={sendOpen}
          onClose={() => setSendOpen(false)}
          quoteId={quoteId}
          quoteNumber={quoteNumber}
          revisionNumber={revisionNumber}
          customerName={contactName || companyName || "Customer"}
          projectTitle={title}
          totalIncVat={totals.totalIncVat}
          validUntil={validUntil}
          defaultEmail={email}
          defaultMessage={customerMessage || undefined}
          canSendTest
          onSend={(payload) => onSend(quoteId, payload)}
        />
      ) : null}

      {onSearchRfqs && onLoadRfqPreview ? (
        <RfqImportDialog
          key={rfqImportOpen ? "rfq-import-open" : "rfq-import-closed"}
          open={rfqImportOpen}
          onClose={() => setRfqImportOpen(false)}
          currentCustomerId={customerId || undefined}
          onSearch={onSearchRfqs}
          onLoadPreview={(id) => onLoadRfqPreview(id, customerId || undefined)}
          onApply={applyRfqImport}
        />
      ) : null}

      <VatModeChangeDialog
        open={vatModeDialogOpen}
        onClose={() => {
          setVatModeDialogOpen(false);
          setPendingVatMode(null);
        }}
        onChoose={confirmVatModeChange}
      />
    </div>
  );
}
