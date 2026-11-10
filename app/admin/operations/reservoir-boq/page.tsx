import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { designDiameter, type BoqSelection } from "@/lib/reservoir-boq/boq";
import { loadReservoirDesign, loadReservoirSettings } from "@/lib/reservoir-boq/store";
import { AdminErrorState, AdminInfoBanner, AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { PrintDesignButton } from "@/components/admin/operations/reservoir-boq/PrintDesignButton";
import { ReservoirBoqForm, type ReservoirBoqFormValues } from "@/components/admin/operations/reservoir-boq/ReservoirBoqForm";
import { ReservoirBoqResult } from "@/components/admin/operations/reservoir-boq/ReservoirBoqResult";

export const metadata: Metadata = { title: "Reservoir BOQ" };

type Search = { type?: string; d?: string; h?: string; rings?: string; roof?: string; liner?: string; ref?: string };
type PageProps = { searchParams: Promise<Search> };

const header = (
  <AdminPageHeader
    title="Reservoir BOQ"
    description="Pick the size and whether it has a roof, then Calculate. The list shows what to buy for that reservoir; with a roof it also shows the truss design."
  />
);

function formValues(sp: Search): ReservoirBoqFormValues {
  return {
    sizeType: sp.type === "custom" ? "custom" : "standard",
    diameter: sp.d ?? "9",
    height: sp.h === "2" || sp.h === "4" || sp.h === "custom" ? sp.h : "3",
    customRings: sp.rings ?? "3",
    roof: sp.roof === "no" ? "no" : "yes",
    liner: sp.liner === "800" ? "800" : "550",
    reference: (sp.ref ?? "").slice(0, 80),
  };
}

export default async function ReservoirBoqPage(props: PageProps) {
  try {
    return await ReservoirBoqPageInner(props);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[reservoir-boq] page:", error instanceof Error ? error.message : error);
    return (
      <div className="admin-stack--page ops">
        {header}
        <AdminErrorState title="The reservoir BOQ could not be loaded." message="Refresh in a moment." />
      </div>
    );
  }
}

async function ReservoirBoqPageInner({ searchParams }: PageProps) {
  const sp = await searchParams;
  const values = formValues(sp);
  const { db } = await adminOpsDb();
  const asked = sp.d !== undefined;

  const diameterM = Number(values.diameter);
  const rings = values.height === "custom" ? Number(values.customRings) : Number(values.height);
  const selection: BoqSelection = { diameterM, rings, roof: values.roof === "yes", linerGsm: values.liner === "800" ? 800 : 550 };
  const validNumbers = Number.isFinite(diameterM) && Number.isInteger(rings) && diameterM >= 1 && diameterM <= 50 && rings >= 1 && rings <= 6;

  const load = asked && validNumbers ? await loadReservoirDesign(db, selection) : await loadReservoirSettings(db);

  if (load.state === "not_installed" || load.state === "empty") {
    return (
      <div className="admin-stack--page ops">
        {header}
        <AdminInfoBanner tone="info">
          The reservoir designs are not loaded yet. Run the two reservoir_designs migrations (see docs/development/reservoir-boq-tool.md). Nothing else is affected.
        </AdminInfoBanner>
      </div>
    );
  }
  if (load.state === "error") {
    return (
      <div className="admin-stack--page ops">
        {header}
        <AdminErrorState title="The reservoir designs could not be loaded." message="Refresh in a moment." />
      </div>
    );
  }

  const { settings } = load;
  const form = (
    <div className="rboq-noprint">
      <AdminPanel title="Reservoir">
        <ReservoirBoqForm values={values} ringHeightM={settings.ring_height_m} diameters={settings.diameters_m} rings={settings.rings} />
      </AdminPanel>
    </div>
  );

  if (!asked) {
    return (
      <div className="admin-stack--page ops rboq">
        {header}
        {form}
      </div>
    );
  }

  const inRange = validNumbers && settings.diameters_m.includes(designDiameter(diameterM)) && settings.rings.includes(rings);
  if (!inRange || !load.wall || (selection.roof && !load.roof)) {
    return (
      <div className="admin-stack--page ops rboq">
        {header}
        {form}
        <AdminInfoBanner tone="warning">
          There is no design for that size. Sizes run from {settings.diameters_m[0]} m to {settings.diameters_m[settings.diameters_m.length - 1]} m with {settings.rings[0]} to{" "}
          {settings.rings[settings.rings.length - 1]} rings. Ask André for anything outside that.
        </AdminInfoBanner>
      </div>
    );
  }

  return (
    <div className="admin-stack--page ops rboq">
      <div className="rboq-noprint">{header}</div>
      {form}
      <ReservoirBoqResult settings={settings} wall={load.wall} roof={load.roof} selection={selection} reference={values.reference} />
      <div className="rboq-actions rboq-noprint">
        <PrintDesignButton />
        <span className="rboq-actions__hint">Opens the print window: choose &quot;Save as PDF&quot; to keep a PDF.</span>
      </div>
    </div>
  );
}
