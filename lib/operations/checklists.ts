/**
 * Service-specific starter checklists, added to a project as ordinary tasks
 * (ops_project_tasks) so nothing new is stored. Items are prompts for the
 * crew, not specifications: test methods, frequencies and pass criteria come
 * from the project's own specification and the manufacturer's instructions.
 */
import type { ProjectService } from "./types.ts";

export type ChecklistSet = "readiness" | "quality" | "handover";
export type ChecklistFamily = "geomembrane" | "liner" | "steel" | "waterproofing";

export const READINESS_PREFIX = "Site readiness: ";

export const CHECKLIST_SET_LABELS: Record<ChecklistSet, string> = {
  readiness: "Site readiness",
  quality: "Quality checks",
  handover: "Handover",
};

export const FAMILY_LABELS: Record<ChecklistFamily, string> = {
  geomembrane: "HDPE geomembrane lining",
  liner: "PVC / reservoir liner",
  steel: "Corrugated steel reservoir",
  waterproofing: "Waterproofing",
};

/** Which checklist family suits a service; null for supply-only and unknown work. */
export function checklistFamily(service: ProjectService): ChecklistFamily | null {
  switch (service) {
    case "hdpe_dam_lining":
      return "geomembrane";
    case "pvc_lining":
    case "reservoir_lining":
      return "liner";
    case "steel_reservoir":
      return "steel";
    case "torch_on_bitumen":
    case "roof_waterproofing":
    case "foundation_waterproofing":
    case "repairs":
      return "waterproofing";
    default:
      return null;
  }
}

const READINESS: Record<ChecklistFamily, string[]> = {
  geomembrane: [
    "Site access confirmed for delivery and crew",
    "Excavation and shaping complete",
    "Subgrade smooth, compacted and free of stones and roots",
    "Water removed from the dam",
    "Anchor trench prepared (where specified)",
    "Offloading equipment arranged",
    "Storage area for rolls agreed",
  ],
  liner: [
    "Site access confirmed for delivery and crew",
    "Surface prepared and free of sharp objects",
    "Dimensions re-measured against the liner ordered",
    "Fixing or anchoring method agreed",
    "Water removed (where relining)",
  ],
  steel: [
    "Foundation prepared to size and level",
    "Foundation accepted for loading (per design / manufacturer)",
    "Delivery access confirmed",
    "Offloading arranged",
    "Assembly area clear",
    "Inlet and outlet positions confirmed",
    "Water for filling arranged (where applicable)",
  ],
  waterproofing: [
    "Access and safe working at height arranged (where needed)",
    "Surface clean and dry",
    "Existing defects and repairs identified",
    "Weather window checked",
    "Materials on site",
  ],
};

const QUALITY: Record<ChecklistFamily, string[]> = {
  geomembrane: [
    "Material type and thickness match the quote",
    "Roll / batch numbers and material documents recorded",
    "Subgrade accepted before deploying panels",
    "Panel layout recorded",
    "Trial welds done (where the specification requires)",
    "Seams tested non-destructively as specified",
    "Destructive seam samples taken (where specified)",
    "Repairs marked and re-tested",
    "Final visual inspection done",
    "Completion photos taken",
  ],
  liner: [
    "Liner material and size match the quote",
    "Fabrication / factory seam information recorded (if supplied)",
    "Liner placed and positioned",
    "Fixing / anchoring complete",
    "Final visual inspection done",
    "Completion photos taken",
  ],
  steel: [
    "Diameter, height and ring count confirmed",
    "Components checked against the delivery note",
    "Ring assembly checked",
    "Fasteners checked per manufacturer instructions",
    "Liner and protective layers installed",
    "Roof and fittings installed (where included)",
    "Connections inspected",
    "Leak inspection during filling",
    "Completion photos taken",
  ],
  waterproofing: [
    "Substrate prepared and repairs done",
    "Primer applied per product instructions",
    "Membrane / coating applied",
    "Details finished (upstands, outlets, joints)",
    "Final inspection (flood test where specified)",
    "Completion photos taken",
  ],
};

const HANDOVER = [
  "Snag list walked with the customer",
  "Snags resolved",
  "Care and use instructions given",
  "Warranty documents issued (where applicable)",
  "Customer sign-off received",
];

const KIND: Record<ChecklistSet, "task" | "quality" | "handover"> = { readiness: "task", quality: "quality", handover: "handover" };

/** Tasks to insert for a checklist, skipping titles the project already has. */
export function checklistTasks(set: ChecklistSet, family: ChecklistFamily, existingTitles: string[]): { title: string; kind: "task" | "quality" | "handover" }[] {
  const have = new Set(existingTitles.map((t) => t.trim().toLowerCase()));
  const items = set === "readiness" ? READINESS[family].map((t) => `${READINESS_PREFIX}${t}`) : set === "quality" ? QUALITY[family] : HANDOVER;
  return items.filter((t) => !have.has(t.toLowerCase())).map((title) => ({ title, kind: KIND[set] }));
}

export function isReadinessTask(title: string): boolean {
  return title.startsWith(READINESS_PREFIX);
}
