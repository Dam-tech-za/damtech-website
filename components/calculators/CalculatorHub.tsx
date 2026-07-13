"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  InfoCircleIcon,
} from "@/components/icons/StrokeIcons";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import {
  CALCULATOR_FAQS,
  CALCULATOR_GUIDANCE_CHECKLIST,
  CALCULATOR_USE_CASES,
  CALCULATORS,
  DEFAULT_CALCULATOR_ID,
  type CalculatorConfig,
  type CalculatorField,
} from "@/lib/calculators-config";
import {
  buildQuotePrefill,
  storeQuotePrefill,
} from "@/lib/calculator-rfq-prefill";
import {
  calculateCalculator,
  type CalculatorResult,
} from "@/lib/calculators-logic";

function buildDefaultValues(calculator: CalculatorConfig): Record<string, string> {
  return Object.fromEntries(
    calculator.fields.map((field) => [field.name, field.defaultValue ?? ""]),
  );
}

function FieldInfoTip({ text }: { text: string }) {
  const tipId = useId();

  return (
    <span className="calc-field-info">
      <button
        type="button"
        className="calc-field-info__trigger"
        aria-describedby={tipId}
        aria-label="More information"
      >
        <InfoCircleIcon className="calc-field-info__icon" />
      </button>
      <span id={tipId} role="tooltip" className="calc-field-info__popup">
        {text}
      </span>
    </span>
  );
}

function CalculatorFieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: CalculatorField;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
}) {
  const inputId = useId();
  const errorId = error ? `${inputId}-error` : undefined;
  const inputClassName = `form-input min-h-12${error ? " border-red-400 focus:border-red-500 focus:ring-red-200" : ""}`;

  const label = (
    <div className="calc-field-label">
      <label htmlFor={inputId} className="form-label">
        {field.label}
        {field.unit ? (
          <span className="ml-1 font-normal text-subtle">({field.unit})</span>
        ) : null}
      </label>
      {field.info ? <FieldInfoTip text={field.info} /> : null}
    </div>
  );

  if (field.type === "select") {
    return (
      <div className="form-field">
        {label}
        <select
          id={inputId}
          name={field.name}
          className={inputClassName}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          onChange={(event) => onChange(field.name, event.target.value)}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <p id={errorId} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : field.helperText ? (
          <p className="text-xs text-subtle">{field.helperText}</p>
        ) : null}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="form-field">
        {label}
        <textarea
          id={inputId}
          name={field.name}
          className={`${inputClassName} min-h-24 resize-y`}
          placeholder={field.placeholder}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          onChange={(event) => onChange(field.name, event.target.value)}
        />
        {error ? (
          <p id={errorId} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : field.helperText ? (
          <p className="text-xs text-subtle">{field.helperText}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="form-field">
      {label}
      <input
        id={inputId}
        name={field.name}
        type={field.type}
        className={inputClassName}
        placeholder={field.placeholder}
        value={value}
        min={field.min}
        step={field.step ?? (field.type === "number" ? "any" : undefined)}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
      {error ? (
        <p id={errorId} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : field.helperText ? (
        <p className="text-xs text-subtle">{field.helperText}</p>
      ) : null}
    </div>
  );
}

function FixedAllowances({ fields }: { fields: CalculatorField[] }) {
  if (fields.length === 0) return null;

  return (
    <div className="calc-fixed-allowances" aria-label="Fixed planning allowances">
      <p className="calc-fixed-allowances__title">Included planning allowances</p>
      <p className="calc-fixed-allowances__intro">
        These Damtech defaults are applied automatically and cannot be edited here. Final
        values are confirmed during quote and site inspection.
      </p>
      <ul className="calc-fixed-allowances__list">
        {fields.map((field) => (
          <li key={field.name} className="calc-fixed-allowances__item">
            <span className="calc-fixed-allowances__label">
              {field.label}
              {field.info ? <FieldInfoTip text={field.info} /> : null}
            </span>
            <span className="calc-fixed-allowances__value">
              {field.defaultValue ?? "—"}
              {field.unit ? ` ${field.unit}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CalculatorHub() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(DEFAULT_CALCULATOR_ID);
  const [formValues, setFormValues] = useState<Record<string, string>>(() =>
    buildDefaultValues(CALCULATORS[0]!),
  );
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasCalculated, setHasCalculated] = useState(false);

  const selectedCalculator =
    CALCULATORS.find((calc) => calc.id === selectedId) ?? CALCULATORS[0]!;

  const editableFields = selectedCalculator.fields.filter((field) => !field.fixed);
  const fixedFields = selectedCalculator.fields.filter((field) => field.fixed);

  const clearCalculationState = useCallback(() => {
    setResult(null);
    setCalcError(null);
    setFieldErrors({});
    setHasCalculated(false);
  }, []);

  const selectCalculator = useCallback(
    (id: string, scroll = false) => {
      const calculator = CALCULATORS.find((calc) => calc.id === id);
      if (!calculator) return;
      setSelectedId(id);
      setFormValues(buildDefaultValues(calculator));
      clearCalculationState();

      if (typeof window !== "undefined") {
        const nextHash = `#${id}`;
        if (window.location.hash !== nextHash) {
          window.history.replaceState(null, "", nextHash);
        }
      }

      if (scroll) {
        window.requestAnimationFrame(() => {
          window.setTimeout(() => {
            document
              .getElementById("calculator-workspace")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 40);
        });
      }
    },
    [clearCalculationState],
  );

  useEffect(() => {
    const applyHash = (scroll: boolean) => {
      const hash = window.location.hash.replace("#", "");
      if (hash && CALCULATORS.some((calc) => calc.id === hash)) {
        selectCalculator(hash, scroll);
      }
    };

    applyHash(Boolean(window.location.hash));

    const onHashChange = () => applyHash(true);
    const onCustomSelect = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; scroll?: boolean }>).detail;
      if (detail?.id) selectCalculator(detail.id, detail.scroll !== false);
    };

    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("damtech:select-calculator", onCustomSelect);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("damtech:select-calculator", onCustomSelect);
    };
  }, [selectCalculator]);

  const handleFieldChange = (name: string, value: string) => {
    setFormValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    if (hasCalculated) {
      setResult(null);
      setCalcError(null);
      setHasCalculated(false);
    }
  };

  const handleReset = () => {
    setFormValues(buildDefaultValues(selectedCalculator));
    clearCalculationState();
  };

  const valuesForQuote = () => ({
    ...buildDefaultValues(selectedCalculator),
    ...formValues,
    ...Object.fromEntries(
      fixedFields.map((field) => [field.name, field.defaultValue ?? ""]),
    ),
  });

  const goToQuoteWithPrefill = () => {
    const prefill = buildQuotePrefill({
      calculatorId: selectedId,
      formValues: valuesForQuote(),
      result: hasCalculated && result && !calcError ? result : null,
    });
    if (prefill) storeQuotePrefill(prefill);
    router.push("/quote/");
  };

  const handleCalculate = (event: React.FormEvent) => {
    event.preventDefault();
    // Ensure fixed defaults are always present in submitted values.
    const valuesWithFixed = {
      ...buildDefaultValues(selectedCalculator),
      ...formValues,
      ...Object.fromEntries(
        fixedFields.map((field) => [field.name, field.defaultValue ?? ""]),
      ),
    };
    const output = calculateCalculator(selectedId, valuesWithFixed);

    if ("error" in output) {
      setResult(null);
      setCalcError(output.error);
      setFieldErrors(output.fieldErrors ?? {});
      setHasCalculated(true);
      return;
    }

    setCalcError(null);
    setFieldErrors({});
    setResult(output);
    setHasCalculated(true);
  };

  const getResultValue = (label: string): string => {
    if (!result) return "—";
    const value = result.values[label];
    if (value === undefined || value === null) return "—";
    return String(value);
  };

  return (
    <>
      <section
        id="calculator-selector"
        className="calc-selector-section"
        aria-labelledby="calc-selector-heading"
      >
        <PageSectionHeader
          id="calc-selector-heading"
          eyebrow="SELECT A TOOL"
          title="Choose a Calculator"
          intro="Select a dam lining calculator, water storage tool or waterproofing estimator based on your project. Each tool provides preliminary planning estimates for farms, mines and properties across South Africa."
        />

        <div className="calc-selector-mobile mt-8 lg:hidden">
          <label htmlFor="calc-mobile-select" className="form-label">
            Calculator
          </label>
          <select
            id="calc-mobile-select"
            className="form-input min-h-12"
            value={selectedId}
            onChange={(event) => selectCalculator(event.target.value, true)}
          >
            {CALCULATORS.map((calc) => (
              <option key={calc.id} value={calc.id}>
                {calc.shortName} — {calc.bestFor}
              </option>
            ))}
          </select>
        </div>

        <div
          className="calc-selector-grid mt-8 hidden lg:grid"
          role="tablist"
          aria-label="Calculator selection"
        >
          {CALCULATORS.map((calc) => {
            const Icon = calc.icon;
            const isActive = calc.id === selectedId;
            return (
              <button
                key={calc.id}
                type="button"
                role="tab"
                id={`calc-tab-${calc.id}`}
                aria-selected={isActive}
                aria-controls="calculator-workspace"
                className={`calc-selector-card${isActive ? " calc-selector-card--active" : ""}`}
                onClick={() => selectCalculator(calc.id, true)}
              >
                <span className="calc-selector-card__icon-wrap" aria-hidden>
                  <Icon className="calc-selector-card__icon" />
                </span>
                <span className="calc-selector-card__name">{calc.shortName}</span>
                <span className="calc-selector-card__desc">{calc.description}</span>
                <span className="calc-selector-card__best-for">
                  Best for: {calc.bestFor}
                </span>
              </button>
            );
          })}
        </div>

        <div className="calc-selector-scroll mt-6 flex gap-3 overflow-x-auto pb-2 lg:hidden">
          {CALCULATORS.map((calc) => {
            const isActive = calc.id === selectedId;
            return (
              <button
                key={calc.id}
                type="button"
                className={`calc-selector-chip${isActive ? " calc-selector-chip--active" : ""}`}
                aria-pressed={isActive}
                onClick={() => selectCalculator(calc.id, true)}
              >
                {calc.shortName}
              </button>
            );
          })}
        </div>
      </section>

      <div
        className="calc-workspace mt-10 scroll-mt-[calc(var(--header-height)+1rem)]"
        role="region"
        aria-label={`${selectedCalculator.name} workspace`}
        id="calculator-workspace"
      >
        <div className="calc-workspace__grid">
          <div className="calc-workspace__inputs site-form-card">
            <h3 className="calc-workspace__title">{selectedCalculator.name}</h3>
            <p className="calc-workspace__desc">{selectedCalculator.description}</p>

            <form className="mt-6 space-y-4" onSubmit={handleCalculate} noValidate>
              {calcError ? (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {calcError}
                </p>
              ) : null}

              {editableFields.map((field) => (
                <CalculatorFieldInput
                  key={field.name}
                  field={field}
                  value={formValues[field.name] ?? ""}
                  onChange={handleFieldChange}
                  error={fieldErrors[field.name]}
                />
              ))}

              <FixedAllowances fields={fixedFields} />

              <div className="calc-workspace__actions">
                <button type="submit" className="btn-primary min-h-12 w-full sm:w-auto">
                  Calculate Estimate
                </button>
                <button
                  type="button"
                  className="btn-secondary min-h-12 w-full sm:w-auto"
                  onClick={handleReset}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <aside className="calc-workspace__results" aria-live="polite" aria-atomic="true">
            <div className="calc-results-card">
              <h3 className="calc-results-card__title">Estimate Preview</h3>

              {!hasCalculated ? (
                <p className="calc-results-card__hint">
                  Enter your project details and click Calculate Estimate.
                </p>
              ) : calcError ? (
                <p className="calc-results-card__hint text-red-700">
                  Correct the highlighted fields and calculate again.
                </p>
              ) : result ? (
                <p className="calc-results-card__status">Preliminary planning estimate</p>
              ) : null}

              <dl className="calc-results-card__list">
                {selectedCalculator.resultLabels.map((label) => (
                  <div key={label} className="calc-results-card__item">
                    <dt className="calc-results-card__label">{label}</dt>
                    <dd className="calc-results-card__value">
                      {hasCalculated && result ? getResultValue(label) : "—"}
                    </dd>
                  </div>
                ))}
              </dl>

              {result?.warnings && result.warnings.length > 0 ? (
                <div className="calc-results-card__warnings mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-sm font-medium text-amber-900">Warnings</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-amber-800">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result?.assumptions && result.assumptions.length > 0 ? (
                <div className="calc-results-card__assumptions mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-medium text-slate-800">Assumptions</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-600">
                    {result.assumptions.map((assumption) => (
                      <li key={assumption}>{assumption}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="calc-results-card__help">
                <p className="text-sm font-medium text-navy">How this estimate helps</p>
                <p className="mt-1 text-sm text-slate-600">{selectedCalculator.resultHelp}</p>
              </div>

              <div className="calc-results-card__cta">
                <button
                  type="button"
                  className="btn-primary min-h-12 w-full text-center"
                  onClick={goToQuoteWithPrefill}
                >
                  Request a Quote
                </button>
                {selectedCalculator.relatedServiceHref.replace(/\/$/, "") ===
                "/quote" ? (
                  <button
                    type="button"
                    className="calc-results-card__service-link"
                    onClick={goToQuoteWithPrefill}
                  >
                    {selectedCalculator.relatedServiceLabel}
                    <ArrowRightIcon className="ml-1 inline h-4 w-4" aria-hidden />
                  </button>
                ) : (
                  <Link
                    href={selectedCalculator.relatedServiceHref}
                    className="calc-results-card__service-link"
                  >
                    {selectedCalculator.relatedServiceLabel}
                    <ArrowRightIcon className="ml-1 inline h-4 w-4" aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <section className="calc-use-cases mt-16" aria-labelledby="calc-use-cases-heading">
        <PageSectionHeader
          id="calc-use-cases-heading"
          eyebrow="USE CASES"
          title="Choose the Right Calculator for Your Project"
          intro="Not sure where to start? Match your project need to the recommended dam lining, water storage or waterproofing calculator."
        />

        <div className="calc-use-cases__grid mt-8">
          {CALCULATOR_USE_CASES.map((useCase) => (
            <article key={useCase.id} className="calc-use-case-card">
              <h3 className="calc-use-case-card__title">{useCase.title}</h3>
              <p className="calc-use-case-card__desc">{useCase.description}</p>
              <p className="calc-use-case-card__recommended">
                <strong>Recommended:</strong> {useCase.recommended}
              </p>
              <button
                type="button"
                className="btn-primary calc-use-case-card__btn min-h-12 w-full"
                onClick={() => selectCalculator(useCase.calculatorId, true)}
              >
                Use calculator
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="calc-guidance mt-16" aria-labelledby="calc-guidance-heading">
        <div className="calc-guidance__grid">
          <div>
            <PageSectionHeader
              id="calc-guidance-heading"
              eyebrow="GUIDANCE"
              title="How to Use These Estimates"
            />
            <div className="calc-guidance__text space-y-4 text-body">
              <p>
                These calculators provide early planning estimates only. They help you prepare
                dimensions, water demand and material areas before requesting a dam lining quote
                or site inspection from Damtech.
              </p>
              <p>
                Final material quantities depend on site inspection, slopes, anchor trenches,
                overlaps, waste, access and supplier specifications. Irrigation and water
                requirement values depend on rainfall, crop type, soil, system efficiency and
                seasonal demand.
              </p>
              <p>
                Damtech can confirm requirements during quote and site inspection. For accurate
                dam liner material estimates, steel water tank sizing or waterproofing area
                calculations, send us your site photos and dimensions.
              </p>
              <p>
                Explore our{" "}
                <Link href="/dam-liners" className="text-water hover:underline">
                  dam lining services
                </Link>
                ,{" "}
                <Link href="/hdpe-dam-lining" className="text-water hover:underline">
                  HDPE dam lining
                </Link>{" "}
                and{" "}
                <Link href="/steel-water-storage-tanks" className="text-water hover:underline">
                  steel water tanks
                </Link>{" "}
                for more detail on Damtech solutions.
              </p>
            </div>
          </div>

          <div className="calc-guidance__checklist site-form-card">
            <h3 className="text-lg font-bold text-navy">Pre-quote checklist</h3>
            <ul className="mt-4 space-y-3">
              {CALCULATOR_GUIDANCE_CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircleIcon
                    className="mt-0.5 h-5 w-5 shrink-0 text-water"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="calc-disclaimer mt-12">
        <p>
          These calculators provide preliminary planning estimates only. Final material
          quantities, water storage requirements and installation recommendations must be
          confirmed by Damtech after reviewing site dimensions, site conditions, access,
          material specifications and project requirements.
        </p>
        <p className="mt-2">
          Calculator results are not engineering designs, legal water-use approvals or final
          quotations.
        </p>
      </div>

      <section className="calc-faq mt-16" aria-labelledby="calc-faq-heading">
        <PageSectionHeader
          id="calc-faq-heading"
          eyebrow="FAQ"
          title="Calculator FAQs"
          intro="Common questions about dam lining calculators, water storage estimates and quote preparation."
        />
        <dl className="calc-faq__list mt-8">
          {CALCULATOR_FAQS.map((faq) => (
            <div key={faq.question} className="calc-faq__item">
              <dt className="calc-faq__question">{faq.question}</dt>
              <dd className="calc-faq__answer">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
