"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPublicRfqAction } from "@/app/actions/submit-public-rfq";
import { PROVINCE_OPTIONS } from "@/lib/form";
import {
  ASSET_TYPE_LABELS,
  defaultMeasurementMethod,
  SERVICE_TYPES,
  type PublicRfqAssetInput,
} from "@/lib/rfq/public-schema";
import type { MeasurementMethod, RfqAssetType } from "@/lib/rfq/calculations";
import { calculateRfqAsset, PUBLIC_QUANTITY_DISCLAIMER } from "@/lib/rfq/calculations";
import {
  clearQuotePrefill,
  peekQuotePrefill,
} from "@/lib/calculator-rfq-prefill";

const STAGES = [
  "Contact",
  "Location",
  "Services",
  "Measurements",
  "Site conditions",
  "Documents",
  "Review",
] as const;

const DRAFT_KEY = "damtech.rfqWizardDraft.v1";

type DraftState = {
  stage: number;
  formStartedAt: number;
  submissionId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  alternativePhone: string;
  preferredContactMethod: string;
  vatNumber: string;
  companyRegistration: string;
  farmProjectName: string;
  addressLine: string;
  town: string;
  province: string;
  postalCode: string;
  mapsLink: string;
  accessNotes: string;
  distanceFromTownKm: string;
  servicesRequested: string[];
  waterInDam: string;
  sharpRock: string;
  accessEquipment: string;
  message: string;
  assets: PublicRfqAssetInput[];
  calculatorSource: {
    calculatorType: string;
    inputs: Record<string, unknown>;
    results: Record<string, unknown>;
  } | null;
};

function newAsset(partial?: Partial<PublicRfqAssetInput>): PublicRfqAssetInput {
  const assetType = (partial?.assetType || "earth_dam") as RfqAssetType;
  return {
    localId: partial?.localId || crypto.randomUUID(),
    assetName: partial?.assetName || "Dam 1",
    assetType,
    quantity: partial?.quantity || 1,
    measurementMethod:
      partial?.measurementMethod || defaultMeasurementMethod(assetType),
    materialPreference: partial?.materialPreference || "",
    siteNotes: partial?.siteNotes || "",
    siteConditions: partial?.siteConditions || {},
    rawInputs: partial?.rawInputs || {
      measuredAreaM2: "",
      includesAnchorTrench: "unknown",
      includesOverlapWaste: "unknown",
      overlapPercent: 5,
      wastePercent: 10,
      topLengthM: "",
      topWidthM: "",
      depthM: "",
      bottomLengthM: "",
      bottomWidthM: "",
      sideSlopeZH: "",
      diameterM: "",
      shellHeightM: "",
      requiredCapacityKL: "",
    },
  };
}

function emptyDraft(): DraftState {
  return {
    stage: 0,
    formStartedAt: Date.now(),
    submissionId: crypto.randomUUID(),
    name: "",
    company: "",
    email: "",
    phone: "",
    alternativePhone: "",
    preferredContactMethod: "phone",
    vatNumber: "",
    companyRegistration: "",
    farmProjectName: "",
    addressLine: "",
    town: "",
    province: "",
    postalCode: "",
    mapsLink: "",
    accessNotes: "",
    distanceFromTownKm: "",
    servicesRequested: ["HDPE dam lining"],
    waterInDam: "unknown",
    sharpRock: "unknown",
    accessEquipment: "unknown",
    message: "",
    assets: [newAsset({ assetName: "Dam 1" })],
    calculatorSource: null,
  };
}

function measurementOptions(assetType: RfqAssetType): Array<{
  value: MeasurementMethod;
  label: string;
}> {
  if (assetType === "corrugated_steel_tank") {
    return [
      { value: "dimensions", label: "Known diameter and height" },
      { value: "known_capacity", label: "Known required capacity" },
      { value: "catalogue_selection", label: "Select from Damtech tank catalogue" },
      { value: "site_measurement_required", label: "Not yet known" },
    ];
  }
  if (
    assetType === "earth_dam" ||
    assetType === "circular_open_reservoir"
  ) {
    return [
      { value: "known_total_area", label: "Known total lining area in m²" },
      { value: "dimensions", label: "Calculate from dimensions" },
      { value: "separate_areas", label: "Enter separate floor and wall areas" },
      { value: "drawings", label: "Upload drawings / site survey" },
      { value: "site_measurement_required", label: "Dimensions not yet known" },
    ];
  }
  return [
    { value: "known_total_area", label: "Known total area" },
    { value: "dimensions", label: "Internal dimensions" },
    { value: "drawings", label: "Upload drawings" },
    { value: "site_measurement_required", label: "Site measurement required" },
  ];
}

type PublicRfqWizardProps = {
  sourcePage?: string;
  /** Server-consumed calculator draft — authoritative over URL/query params. */
  initialCalculatorSource?: {
    calculatorType: string;
    inputs: Record<string, unknown>;
    results: Record<string, unknown>;
  } | null;
};

export function PublicRfqWizard({
  sourcePage = "/calculators#project-budget",
  initialCalculatorSource = null,
}: PublicRfqWizardProps) {
  const router = useRouter();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [draft, setDraft] = useState<DraftState>(() => {
    const base = emptyDraft();
    if (initialCalculatorSource) {
      base.calculatorSource = initialCalculatorSource;
    }
    return base;
  });
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [pending, startTransition] = useTransition();

  if (isClient && !hydrated) {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    let next = emptyDraft();
    if (saved) {
      try {
        next = { ...emptyDraft(), ...(JSON.parse(saved) as DraftState) };
        if (!next.submissionId) {
          next.submissionId = crypto.randomUUID();
        }
      } catch {
        /* ignore */
      }
    }
    if (initialCalculatorSource) {
      next.calculatorSource = initialCalculatorSource;
    }
    const prefill = peekQuotePrefill();
    if (prefill) {
      next.message = prefill.message || next.message;
      next.company = prefill.company || next.company;
      next.province = prefill.province || next.province;
      next.farmProjectName = prefill.projectLocation || next.farmProjectName;
      if (prefill.serviceRequired) {
        next.servicesRequested = [prefill.serviceRequired];
      }
      // Prefer server draft; only use session calculatorJson as UI fallback.
      if (!next.calculatorSource && prefill.calculatorJson) {
        try {
          const json = JSON.parse(prefill.calculatorJson) as {
            calculatorType: string;
            inputs: Record<string, unknown>;
            results: Record<string, unknown>;
          };
          next.calculatorSource = json;
          const fromTank =
            prefill.sourceCalculatorId.includes("tank") ||
            prefill.sourceCalculatorId.includes("steel") ||
            prefill.sourceCalculatorId.includes("reservoir");
          if (fromTank) {
            next.assets = [
              newAsset({
                assetName: "Steel Tank 1",
                assetType: "corrugated_steel_tank",
                measurementMethod: "known_capacity",
                rawInputs: {
                  requiredCapacityKL:
                    json.results.requiredVolumeM3 ??
                    json.results.suggestedVolumeM3 ??
                    "",
                  quantity: 1,
                },
              }),
            ];
            next.servicesRequested = ["Corrugated steel water tank"];
          } else {
            next.assets = [
              newAsset({
                assetName: "Dam 1",
                assetType: "earth_dam",
                measurementMethod: "known_total_area",
                rawInputs: {
                  measuredAreaM2:
                    json.results.estimatedLinerAreaM2 ??
                    json.results.estimatedMaterialAreaM2 ??
                    json.results.totalAreaM2 ??
                    "",
                  includesAnchorTrench: "unknown",
                  includesOverlapWaste: "unknown",
                  measurementSource: "calculator",
                  overlapPercent: 5,
                  wastePercent: 10,
                },
              }),
            ];
          }
        } catch {
          /* ignore */
        }
      }
      clearQuotePrefill();
    }

    // Seed a starter asset from the server draft when none exists yet.
    if (
      next.calculatorSource &&
      (!next.assets.length ||
        (next.assets.length === 1 &&
          !Object.values(next.assets[0].rawInputs || {}).some(
            (v) => v !== "" && v !== "unknown" && v != null,
          )))
    ) {
      const calcId = next.calculatorSource.calculatorType || "";
      const results = next.calculatorSource.results || {};
      const fromTank =
        calcId.includes("tank") ||
        calcId.includes("steel") ||
        calcId.includes("reservoir") ||
        calcId.includes("rainwater");
      if (fromTank) {
        next.assets = [
          newAsset({
            assetName: "Steel Tank 1",
            assetType: "corrugated_steel_tank",
            measurementMethod: "known_capacity",
            rawInputs: {
              requiredCapacityKL:
                results["Recommended storage volume (litres)"] ??
                results.requiredVolumeM3 ??
                results.suggestedVolumeM3 ??
                "",
              quantity: 1,
            },
          }),
        ];
        if (!next.servicesRequested.length) {
          next.servicesRequested = ["Corrugated steel water tank"];
        }
      } else if (!next.assets.length || next.assets[0].assetType === "earth_dam") {
        next.assets = [
          newAsset({
            assetName: "Dam 1",
            assetType: "earth_dam",
            measurementMethod: "known_total_area",
            rawInputs: {
              measuredAreaM2:
                results["Estimated material area (incl. overlap & wastage)"] ??
                results.estimatedLinerAreaM2 ??
                results.estimatedMaterialAreaM2 ??
                results.totalAreaM2 ??
                results["Total area (m²)"] ??
                "",
              includesAnchorTrench: "unknown",
              includesOverlapWaste: "unknown",
              measurementSource: "calculator",
              overlapPercent: 5,
              wastePercent: 10,
            },
          }),
        ];
      }
    }

    setDraft(next);
    setHydrated(true);
  }

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  const previews = useMemo(
    () =>
      draft.assets.map((asset) =>
        calculateRfqAsset({
          assetType: asset.assetType,
          measurementMethod: asset.measurementMethod,
          quantity: asset.quantity,
          rawInputs: { ...asset.rawInputs, quantity: asset.quantity },
        }),
      ),
    [draft.assets],
  );

  function updateAsset(localId: string, patch: Partial<PublicRfqAssetInput>) {
    setDraft((d) => ({
      ...d,
      assets: d.assets.map((a) => {
        if (a.localId !== localId) return a;
        const next = { ...a, ...patch };
        if (patch.assetType && patch.assetType !== a.assetType) {
          next.measurementMethod = defaultMeasurementMethod(patch.assetType);
        }
        return next;
      }),
    }));
  }

  function setRaw(localId: string, key: string, value: string | number | boolean) {
    setDraft((d) => ({
      ...d,
      assets: d.assets.map((a) =>
        a.localId === localId
          ? { ...a, rawInputs: { ...a.rawInputs, [key]: value } }
          : a,
      ),
    }));
  }

  function validateStage(): string | null {
    if (draft.stage === 0) {
      if (!draft.name.trim()) return "Full name is required.";
      if (!draft.phone.trim() && !draft.email.trim()) {
        return "Provide a phone number or email address.";
      }
    }
    if (draft.stage === 2 && draft.servicesRequested.length === 0) {
      return "Select at least one service.";
    }
    if (draft.stage === 3) {
      if (!draft.assets.length) return "Add at least one dam, tank or reservoir.";
      for (const asset of draft.assets) {
        if (!asset.assetName.trim()) return "Each asset needs a name.";
      }
    }
    return null;
  }

  function nextStage() {
    const err = validateStage();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setDraft((d) => ({ ...d, stage: Math.min(d.stage + 1, STAGES.length - 1) }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitPublicRfqAction({
        name: draft.name,
        company: draft.company,
        email: draft.email,
        phone: draft.phone,
        alternativePhone: draft.alternativePhone,
        preferredContactMethod: draft.preferredContactMethod,
        vatNumber: draft.vatNumber,
        companyRegistration: draft.companyRegistration,
        farmProjectName: draft.farmProjectName,
        addressLine: draft.addressLine,
        town: draft.town,
        province: draft.province,
        postalCode: draft.postalCode,
        mapsLink: draft.mapsLink,
        accessNotes: draft.accessNotes,
        distanceFromTownKm: draft.distanceFromTownKm
          ? Number(draft.distanceFromTownKm)
          : null,
        servicesRequested: draft.servicesRequested,
        siteConditions: {
          waterInDam: draft.waterInDam,
          sharpRock: draft.sharpRock,
          accessEquipment: draft.accessEquipment,
        },
        message: draft.message,
        assets: draft.assets,
        sourcePage,
        website: honeypot,
        formStartedAt: draft.formStartedAt,
        submissionId: draft.submissionId,
        calculatorSource: draft.calculatorSource,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }
      sessionStorage.removeItem(DRAFT_KEY);
      sessionStorage.setItem(
        "damtech.rfqSuccess",
        JSON.stringify({
          rfqNumber: result.rfqNumber,
          uploadToken: result.uploadToken,
        }),
      );
      router.push(
        `/quote/success/?ref=${encodeURIComponent(result.rfqNumber)}&upload=${encodeURIComponent(result.uploadToken)}`,
      );
    });
  }

  if (!hydrated) {
    return <p className="text-subtle">Loading quotation form…</p>;
  }

  return (
    <div className="rfq-wizard">
      <nav className="rfq-wizard__progress" aria-label="Form progress">
        {STAGES.map((label, i) => (
          <button
            key={label}
            type="button"
            className={
              i === draft.stage
                ? "is-active"
                : i < draft.stage
                  ? "is-done"
                  : undefined
            }
            onClick={() => setDraft((d) => ({ ...d, stage: i }))}
          >
            <span>{i + 1}</span>
            {label}
          </button>
        ))}
      </nav>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      {/* honeypot */}
      <div className="rfq-wizard__hp" aria-hidden="true">
        <label>
          Website
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      {draft.stage === 0 ? (
        <section className="rfq-wizard__panel">
          <h2>Contact details</h2>
          <div className="form-grid">
            <label>
              Full name *
              <input
                className="form-input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label>
              Company / farm / organisation
              <input
                className="form-input"
                value={draft.company}
                onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                className="form-input"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </label>
            <label>
              Mobile number
              <input
                className="form-input"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </label>
            <label>
              Alternative number
              <input
                className="form-input"
                value={draft.alternativePhone}
                onChange={(e) =>
                  setDraft({ ...draft, alternativePhone: e.target.value })
                }
              />
            </label>
            <label>
              Preferred contact method
              <select
                className="form-input"
                value={draft.preferredContactMethod}
                onChange={(e) =>
                  setDraft({ ...draft, preferredContactMethod: e.target.value })
                }
              >
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </label>
            <label>
              VAT number
              <input
                className="form-input"
                value={draft.vatNumber}
                onChange={(e) => setDraft({ ...draft, vatNumber: e.target.value })}
              />
            </label>
            <label>
              Company registration
              <input
                className="form-input"
                value={draft.companyRegistration}
                onChange={(e) =>
                  setDraft({ ...draft, companyRegistration: e.target.value })
                }
              />
            </label>
          </div>
        </section>
      ) : null}

      {draft.stage === 1 ? (
        <section className="rfq-wizard__panel">
          <h2>Project location</h2>
          <div className="form-grid">
            <label>
              Farm / project name
              <input
                className="form-input"
                value={draft.farmProjectName}
                onChange={(e) =>
                  setDraft({ ...draft, farmProjectName: e.target.value })
                }
              />
            </label>
            <label>
              Address
              <input
                className="form-input"
                value={draft.addressLine}
                onChange={(e) =>
                  setDraft({ ...draft, addressLine: e.target.value })
                }
              />
            </label>
            <label>
              Town
              <input
                className="form-input"
                value={draft.town}
                onChange={(e) => setDraft({ ...draft, town: e.target.value })}
              />
            </label>
            <label>
              Province
              <select
                className="form-input"
                value={draft.province}
                onChange={(e) => setDraft({ ...draft, province: e.target.value })}
              >
                <option value="">Select…</option>
                {PROVINCE_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Postal code
              <input
                className="form-input"
                value={draft.postalCode}
                onChange={(e) =>
                  setDraft({ ...draft, postalCode: e.target.value })
                }
              />
            </label>
            <label>
              Google Maps link
              <input
                className="form-input"
                value={draft.mapsLink}
                onChange={(e) => setDraft({ ...draft, mapsLink: e.target.value })}
              />
            </label>
            <label>
              Approx. distance from nearest town (km)
              <input
                className="form-input"
                type="number"
                value={draft.distanceFromTownKm}
                onChange={(e) =>
                  setDraft({ ...draft, distanceFromTownKm: e.target.value })
                }
              />
            </label>
            <label className="form-grid__full">
              Access notes
              <textarea
                className="form-input"
                rows={3}
                value={draft.accessNotes}
                onChange={(e) =>
                  setDraft({ ...draft, accessNotes: e.target.value })
                }
              />
            </label>
          </div>
          <p className="text-xs text-subtle">
            GPS coordinates are optional and will not be trusted automatically.
          </p>
        </section>
      ) : null}

      {draft.stage === 2 ? (
        <section className="rfq-wizard__panel">
          <h2>Services</h2>
          <div className="rfq-wizard__checks">
            {SERVICE_TYPES.map((service) => (
              <label key={service}>
                <input
                  type="checkbox"
                  checked={draft.servicesRequested.includes(service)}
                  onChange={(e) => {
                    setDraft((d) => ({
                      ...d,
                      servicesRequested: e.target.checked
                        ? [...d.servicesRequested, service]
                        : d.servicesRequested.filter((s) => s !== service),
                    }));
                  }}
                />{" "}
                {service}
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {draft.stage === 3 ? (
        <section className="rfq-wizard__panel">
          <h2>Measurements</h2>
          <p className="text-sm text-subtle">{PUBLIC_QUANTITY_DISCLAIMER}</p>
          {draft.assets.map((asset, index) => {
            const preview = previews[index];
            return (
              <article key={asset.localId} className="rfq-asset-card">
                <header>
                  <h3>
                    Asset {index + 1}
                    <button
                      type="button"
                      className="btn btn--sm btn--secondary"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          assets: d.assets.filter((a) => a.localId !== asset.localId),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </h3>
                </header>
                <div className="form-grid">
                  <label>
                    Asset name
                    <input
                      className="form-input"
                      value={asset.assetName}
                      onChange={(e) =>
                        updateAsset(asset.localId, { assetName: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Asset type
                    <select
                      className="form-input"
                      value={asset.assetType}
                      onChange={(e) =>
                        updateAsset(asset.localId, {
                          assetType: e.target.value as RfqAssetType,
                        })
                      }
                    >
                      {(Object.keys(ASSET_TYPE_LABELS) as RfqAssetType[]).map(
                        (type) => (
                          <option key={type} value={type}>
                            {ASSET_TYPE_LABELS[type]}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Quantity of identical units
                    <input
                      className="form-input"
                      type="number"
                      min={1}
                      value={asset.quantity}
                      onChange={(e) =>
                        updateAsset(asset.localId, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                    />
                  </label>
                  <label>
                    Material preference (provisional)
                    <input
                      className="form-input"
                      value={asset.materialPreference || ""}
                      onChange={(e) =>
                        updateAsset(asset.localId, {
                          materialPreference: e.target.value,
                        })
                      }
                      placeholder="e.g. HDPE 1.5 mm"
                    />
                  </label>
                </div>

                <fieldset className="rfq-method-cards">
                  <legend>Measurement method</legend>
                  {measurementOptions(asset.assetType).map((opt) => (
                    <label
                      key={opt.value}
                      className={
                        asset.measurementMethod === opt.value ? "is-selected" : ""
                      }
                    >
                      <input
                        type="radio"
                        name={`method-${asset.localId}`}
                        checked={asset.measurementMethod === opt.value}
                        onChange={() =>
                          updateAsset(asset.localId, {
                            measurementMethod: opt.value,
                          })
                        }
                      />
                      {opt.label}
                    </label>
                  ))}
                </fieldset>

                {asset.measurementMethod === "known_total_area" ? (
                  <div className="form-grid">
                    <label>
                      Measured lining area (m²)
                      <input
                        className="form-input"
                        type="number"
                        value={String(asset.rawInputs.measuredAreaM2 ?? "")}
                        onChange={(e) =>
                          setRaw(asset.localId, "measuredAreaM2", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Includes anchor trench?
                      <select
                        className="form-input"
                        value={String(asset.rawInputs.includesAnchorTrench ?? "unknown")}
                        onChange={(e) =>
                          setRaw(asset.localId, "includesAnchorTrench", e.target.value)
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </label>
                    <label>
                      Includes overlap/waste?
                      <select
                        className="form-input"
                        value={String(asset.rawInputs.includesOverlapWaste ?? "unknown")}
                        onChange={(e) =>
                          setRaw(asset.localId, "includesOverlapWaste", e.target.value)
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </label>
                  </div>
                ) : null}

                {asset.measurementMethod === "dimensions" &&
                asset.assetType === "earth_dam" ? (
                  <div className="form-grid">
                    {(
                      [
                        ["topLengthM", "Top length (m)"],
                        ["topWidthM", "Top width (m)"],
                        ["depthM", "Depth (m)"],
                        ["bottomLengthM", "Bottom length (m)"],
                        ["bottomWidthM", "Bottom width (m)"],
                        ["sideSlopeZH", "Side slope zH:1V"],
                        ["anchorRunoutWidthM", "Anchor runout width (m)"],
                        ["overlapPercent", "Overlap %"],
                        ["wastePercent", "Waste %"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          className="form-input"
                          type="number"
                          step="any"
                          value={String(asset.rawInputs[key] ?? "")}
                          onChange={(e) => setRaw(asset.localId, key, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                ) : null}

                {asset.measurementMethod === "dimensions" &&
                asset.assetType === "circular_open_reservoir" ? (
                  <div className="form-grid">
                    {(
                      [
                        ["topDiameterM", "Top diameter (m)"],
                        ["bottomDiameterM", "Bottom diameter (m)"],
                        ["depthM", "Depth (m)"],
                        ["anchorRunoutWidthM", "Anchor runout (m)"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          className="form-input"
                          type="number"
                          step="any"
                          value={String(asset.rawInputs[key] ?? "")}
                          onChange={(e) => setRaw(asset.localId, key, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                ) : null}

                {asset.assetType === "corrugated_steel_tank" &&
                (asset.measurementMethod === "dimensions" ||
                  asset.measurementMethod === "known_capacity") ? (
                  <div className="form-grid">
                    {asset.measurementMethod === "dimensions" ? (
                      <>
                        <label>
                          Internal diameter (m)
                          <input
                            className="form-input"
                            type="number"
                            step="any"
                            value={String(asset.rawInputs.diameterM ?? "")}
                            onChange={(e) =>
                              setRaw(asset.localId, "diameterM", e.target.value)
                            }
                          />
                        </label>
                        <label>
                          Shell height (m)
                          <input
                            className="form-input"
                            type="number"
                            step="any"
                            value={String(asset.rawInputs.shellHeightM ?? "")}
                            onChange={(e) =>
                              setRaw(asset.localId, "shellHeightM", e.target.value)
                            }
                          />
                        </label>
                        <label>
                          Freeboard (m)
                          <input
                            className="form-input"
                            type="number"
                            step="any"
                            value={String(asset.rawInputs.freeboardM ?? "")}
                            onChange={(e) =>
                              setRaw(asset.localId, "freeboardM", e.target.value)
                            }
                          />
                        </label>
                      </>
                    ) : (
                      <label>
                        Required capacity (kL)
                        <input
                          className="form-input"
                          type="number"
                          step="any"
                          value={String(asset.rawInputs.requiredCapacityKL ?? "")}
                          onChange={(e) =>
                            setRaw(asset.localId, "requiredCapacityKL", e.target.value)
                          }
                        />
                      </label>
                    )}
                  </div>
                ) : null}

                <label>
                  Site notes for this asset
                  <textarea
                    className="form-input"
                    rows={2}
                    value={asset.siteNotes || ""}
                    onChange={(e) =>
                      updateAsset(asset.localId, { siteNotes: e.target.value })
                    }
                  />
                </label>

                <div className="rfq-asset-preview">
                  {preview.ok ? (
                    <>
                      <p>
                        Status: <strong>{preview.measurementStatus}</strong>
                      </p>
                      {"installationAreaM2" in preview.outputs &&
                      preview.outputs.installationAreaM2 != null ? (
                        <p>
                          Provisional installation area:{" "}
                          {String(preview.outputs.installationAreaM2)} m²
                        </p>
                      ) : null}
                      {"materialAreaM2" in preview.outputs &&
                      preview.outputs.materialAreaM2 != null ? (
                        <p>
                          Provisional material area:{" "}
                          {String(preview.outputs.materialAreaM2)} m²
                        </p>
                      ) : null}
                      {"grossCapacityKL" in preview.outputs &&
                      preview.outputs.grossCapacityKL != null ? (
                        <p>
                          Estimated geometric capacity:{" "}
                          {String(preview.outputs.grossCapacityKL)} kL
                        </p>
                      ) : null}
                      {"grossVolumeM3" in preview.outputs &&
                      preview.outputs.grossVolumeM3 != null ? (
                        <p>
                          Estimated geometric capacity:{" "}
                          {String(preview.outputs.grossVolumeM3)} m³
                        </p>
                      ) : null}
                      {preview.warnings.map((w) => (
                        <p key={w.code} className="text-xs text-subtle">
                          {w.message}
                        </p>
                      ))}
                    </>
                  ) : (
                    <p className="form-error">{preview.errors.join(" ")}</p>
                  )}
                </div>
              </article>
            );
          })}

          <button
            type="button"
            className="btn btn--md btn--secondary"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                assets: [
                  ...d.assets,
                  newAsset({
                    assetName: `Asset ${d.assets.length + 1}`,
                  }),
                ],
              }))
            }
          >
            Add another dam, tank or reservoir
          </button>
        </section>
      ) : null}

      {draft.stage === 4 ? (
        <section className="rfq-wizard__panel">
          <h2>Site conditions</h2>
          <div className="form-grid">
            {(
              [
                ["waterInDam", "Water currently in dam?", draft.waterInDam],
                ["sharpRock", "Known sharp rock?", draft.sharpRock],
                [
                  "accessEquipment",
                  "Access for welding equipment?",
                  draft.accessEquipment,
                ],
              ] as const
            ).map(([key, label, value]) => (
              <label key={key}>
                {label}
                <select
                  className="form-input"
                  value={value}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value } as DraftState)
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>
            ))}
            <label className="form-grid__full">
              Additional notes
              <textarea
                className="form-input"
                rows={4}
                value={draft.message}
                onChange={(e) => setDraft({ ...draft, message: e.target.value })}
              />
            </label>
          </div>
        </section>
      ) : null}

      {draft.stage === 5 ? (
        <section className="rfq-wizard__panel">
          <h2>Documents and photographs</h2>
          <p>
            After you submit, you can securely upload photos and drawings on the
            success page. Allowed: JPG, PNG, WEBP, PDF.
          </p>
          <p className="text-sm text-subtle">
            Files are stored privately. Public links are never used.
          </p>
        </section>
      ) : null}

      {draft.stage === 6 ? (
        <section className="rfq-wizard__panel">
          <h2>Review and submit</h2>
          <p className="rfq-disclaimer">{PUBLIC_QUANTITY_DISCLAIMER}</p>
          <dl className="rfq-review">
            <div>
              <dt>Contact</dt>
              <dd>
                {draft.name} · {draft.email || "—"} · {draft.phone || "—"}
              </dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>
                {[draft.farmProjectName, draft.town, draft.province]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt>Services</dt>
              <dd>{draft.servicesRequested.join(", ")}</dd>
            </div>
          </dl>
          <ul className="rfq-review-assets">
            {draft.assets.map((asset, i) => {
              const preview = previews[i];
              return (
                <li key={asset.localId}>
                  <strong>{asset.assetName}</strong> —{" "}
                  {ASSET_TYPE_LABELS[asset.assetType]} · {asset.measurementMethod}
                  {preview.ok ? (
                    <span>
                      {" "}
                      · install {String(preview.outputs.installationAreaM2 ?? "—")}{" "}
                      m² · material{" "}
                      {String(preview.outputs.materialAreaM2 ?? "—")} m²
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--sm btn--secondary"
                    onClick={() => setDraft((d) => ({ ...d, stage: 3 }))}
                  >
                    Edit
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="rfq-wizard__nav">
        {draft.stage > 0 ? (
          <button
            type="button"
            className="btn btn--md btn--secondary"
            onClick={() =>
              setDraft((d) => ({ ...d, stage: Math.max(0, d.stage - 1) }))
            }
          >
            Back
          </button>
        ) : null}
        {draft.stage < STAGES.length - 1 ? (
          <button
            type="button"
            className="btn btn--md btn--primary"
            onClick={nextStage}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--md btn--primary"
            disabled={pending}
            onClick={submit}
          >
            {pending ? "Submitting…" : "Submit RFQ"}
          </button>
        )}
      </div>
    </div>
  );
}
