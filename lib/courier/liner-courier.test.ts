import { test } from "node:test";
import assert from "node:assert/strict";
import { PVC_LINER_PRICE_ROWS } from "../shop/pvc-liner-prices.generated.ts";
import {
  catalogueRuleParcel,
  circularLinerArea,
  foldLinerParcel,
  linedWallHeightForRows,
  listedHeightForRows,
  rectangularLinerArea,
  sheetThicknessMm,
  volumetricWeightKg,
} from "./liner-pack.ts";
import {
  buildCourierQuoteBrief,
  buildCourierQuoteLine,
  buildWhatsAppSummary,
  checkJob,
  declaredValueFor,
  linerJobAsCourierOrder,
  LINER_COURIER_LINE_SOURCE,
  parcelsForQuantity,
  quoteLineCopyText,
  rateExVat,
  upsertCourierQuoteLine,
  whatsAppLink,
  type LinerCourierJob,
} from "./liner-quote.ts";
import { buildRatesPayload, parseRates } from "./payloads.ts";
import type { QuoteLineInput } from "../quotes/types.ts";

const area = (result: ReturnType<typeof circularLinerArea>) => {
  assert.ok(result.ok, result.ok ? "" : result.error);
  return result.area;
};
const fold = (a: ReturnType<typeof area>, gsm: number) =>
  foldLinerParcel({ flatLengthM: a.flatLengthM, flatWidthM: a.flatWidthM, areaM2: a.materialAreaM2, gsm });

test("tank rows: listed height and lined height after 50 mm overlaps", () => {
  assert.equal(listedHeightForRows(2), 1.524);
  assert.equal(listedHeightForRows(3), 2.286);
  assert.equal(linedWallHeightForRows(2), 1.474);
  assert.equal(linedWallHeightForRows(3), 2.186);
  assert.equal(linedWallHeightForRows(4), 2.898);
});

test("circular area reproduces every catalogue liner area to 0.1 m²", () => {
  for (const row of PVC_LINER_PRICE_ROWS) {
    const a = area(circularLinerArea({ diameterM: row.diameterM, wallHeightM: linedWallHeightForRows(row.rows) }));
    assert.ok(Math.abs(a.materialAreaM2 - row.linerAreaM2) <= 0.1, `${row.diameterM} m ${row.rows} rows: ${a.materialAreaM2} vs ${row.linerAreaM2}`);
  }
});

test("circular area: formula parts and waste applied once", () => {
  const a = area(circularLinerArea({ diameterM: 5, wallHeightM: 2, foldOverM: 0.3, wastePercent: 0 }));
  const expected = Math.PI * 6.25 + Math.PI * 5 * 2.3;
  assert.equal(a.materialAreaM2, Math.round(expected * 10) / 10);
  const withWaste = area(circularLinerArea({ diameterM: 5, wallHeightM: 2, foldOverM: 0.3, wastePercent: 5 }));
  assert.equal(withWaste.materialAreaM2, Math.round(expected * 1.05 * 10) / 10);
  assert.equal(withWaste.installationAreaM2, Math.round((Math.PI * 6.25 + Math.PI * 10) * 100) / 100);
  assert.equal(circularLinerArea({ diameterM: 0, wallHeightM: 2 }).ok, false);
  assert.equal(circularLinerArea({ diameterM: 5, wallHeightM: 2, wastePercent: -1 }).ok, false);
});

test("rectangular area: vertical-wall box liner", () => {
  // 4 x 3 x 1.5 m, 0.3 m fold-over, 5% overlap then 5% waste.
  const a = area(rectangularLinerArea({ lengthM: 4, widthM: 3, depthM: 1.5 }));
  const base = 12 + 2 * 4 * 1.5 + 2 * 3 * 1.5 + 14 * 0.3;
  assert.equal(a.installationAreaM2, 33);
  assert.equal(a.materialAreaM2, Math.round(base * 1.05 * 1.05 * 10) / 10);
  assert.equal(a.overlapPercentApplied, 5);
  assert.equal(a.wastePercentApplied, 5);
  assert.equal(a.flatLengthM, 4 + 2 * 1.8);
  assert.equal(a.flatWidthM, 3 + 2 * 1.8);
});

test("rectangular area: sloped earth dam matches the RFQ dam geometry", () => {
  // Same as calculateRectangularDam: 20 x 12 top, 2.5 deep, 1.5:1 slopes, 1.2 m anchor run-out.
  const a = area(rectangularLinerArea({ lengthM: 20, widthM: 12, depthM: 2.5, sideSlopeZH: 1.5, foldOverM: 0, anchorRunoutM: 1.2, overlapPercent: 5, wastePercent: 5 }));
  const lb = 20 - 7.5;
  const wb = 12 - 7.5;
  const s = Math.sqrt(2.5 ** 2 + 3.75 ** 2);
  const floor = lb * wb;
  const walls = (20 + lb) * s + (12 + wb) * s;
  assert.equal(a.installationAreaM2, Math.round((floor + walls) * 100) / 100);
  const material = Math.round((floor + walls + 64 * 1.2) * 1.05 * 1.05 * 100) / 100;
  assert.equal(a.materialAreaM2, Math.round(material * 10) / 10);
  assert.equal(rectangularLinerArea({ lengthM: 4, widthM: 3, depthM: 2, sideSlopeZH: 1 }).ok, false);
});

test("fabric thickness from gsm", () => {
  assert.equal(sheetThicknessMm(550), 0.423);
  assert.equal(sheetThicknessMm(800), 0.615);
});

test("fold: tiny liner stays a small parcel", () => {
  const a = area(rectangularLinerArea({ lengthM: 1, widthM: 0.6, depthM: 0.4, foldOverM: 0.1 }));
  const parcel = fold(a, 550);
  assert.ok(parcel.lengthCm <= 40 && parcel.heightCm >= 2, JSON.stringify(parcel));
  assert.ok(parcel.weightKg > 0 && parcel.weightKg < 3);
  assert.ok(parcel.fitsMaxEdge);
  assert.match(parcel.note, /folded into/);
});

test("fold: catalogue 5 m x 3-row 550 gsm fits inside the 100 x 40 x 40 rule", () => {
  const a = area(circularLinerArea({ diameterM: 5, wallHeightM: linedWallHeightForRows(3) }));
  assert.equal(a.materialAreaM2, 61.6);
  const parcel = fold(a, 550);
  const rule = catalogueRuleParcel(a.materialAreaM2, 550);
  assert.equal(parcel.weightKg, 33.9);
  assert.equal(rule.weightKg, 33.9);
  assert.ok(parcel.lengthCm * parcel.widthCm * parcel.heightCm <= rule.lengthCm * rule.widthCm * rule.heightCm);
  // Solid fabric volume x2 must fit in the bundle (no impossible compression).
  const solidLitres = (61.6 * 0.423) / 1000 * 1000 * 2;
  assert.ok((parcel.lengthCm * parcel.widthCm * parcel.heightCm) / 1000 >= solidLitres);
});

test("fold: huge 17 m x 3-row 800 gsm is close to the rule of thumb volume", () => {
  const a = area(circularLinerArea({ diameterM: 17, wallHeightM: linedWallHeightForRows(3) }));
  const parcel = fold(a, 800);
  const rule = catalogueRuleParcel(a.materialAreaM2, 800);
  assert.equal(parcel.weightKg, 302.2);
  assert.ok(parcel.fitsMaxEdge && parcel.lengthCm <= 100);
  const ratio = (parcel.lengthCm * parcel.widthCm * parcel.heightCm) / (rule.lengthCm * rule.widthCm * rule.heightCm);
  assert.ok(ratio > 0.7 && ratio < 1.4, `volume ratio ${ratio}`);
  // Heavy PVC: the courier charges on actual weight, not volume.
  assert.ok(parcel.weightKg > parcel.volumetricWeightKg);
});

test("fold: a rectangular dam liner", () => {
  const a = area(rectangularLinerArea({ lengthM: 20, widthM: 12, depthM: 2.5, sideSlopeZH: 1.5, anchorRunoutM: 1.2 }));
  const parcel = fold(a, 800);
  assert.ok(parcel.fitsMaxEdge);
  assert.ok(parcel.layers === parcel.panelsAlongLength * parcel.panelsAlongWidth);
  assert.ok(parcel.lengthCm >= parcel.widthCm && parcel.widthCm >= parcel.heightCm);
});

test("fold: a smaller max edge gives a smaller longest side, or says it cannot", () => {
  const a = area(circularLinerArea({ diameterM: 17, wallHeightM: linedWallHeightForRows(3) }));
  const tight = foldLinerParcel({ flatLengthM: a.flatLengthM, flatWidthM: a.flatWidthM, areaM2: a.materialAreaM2, gsm: 800 }, { maxEdgeCm: 60 });
  assert.equal(tight.fitsMaxEdge, false);
  assert.match(tight.note, /over 60 cm/);
  assert.equal(volumetricWeightKg({ lengthCm: 100, widthCm: 50, heightCm: 50 }), 50);
});

const job: LinerCourierJob = {
  reference: "Q-2026-0101",
  customerName: "A Farmer",
  companyName: "",
  phone: "082 000 0000",
  email: "farmer@example.com",
  street: "5 Farm Road",
  suburb: "Kleinmond",
  city: "Kleinmond",
  province: "Western Cape",
  postalCode: "7195",
  description: "550 gsm PVC liner 5 m x 2.19 m",
  declaredValue: 45_000,
  notes: "Gate code 1234",
};

test("ad-hoc job: checks, order shape and rates payload with capped declared value", () => {
  assert.deepEqual(checkJob(job), { ok: true });
  assert.equal(checkJob({ ...job, postalCode: "71" }).ok, false);
  assert.equal(checkJob({ ...job, province: "Atlantis" }).ok, false);
  assert.match((checkJob({ ...job, street: " " }) as { error: string }).error, /street/);
  assert.deepEqual(declaredValueFor(45_000), { value: 30_000, capped: true });
  assert.deepEqual(declaredValueFor(-5), { value: 0, capped: false });

  const order = linerJobAsCourierOrder(job);
  assert.equal(order.customer_type, "individual");
  const parcels = parcelsForQuantity({ lengthCm: 40, widthCm: 40, heightCm: 40, weightKg: 33.9 }, 2);
  assert.equal(parcels.length, 2);
  const payload = buildRatesPayload(
    { address: { type: "business", street_address: "1 Depot", local_area: "Betty's Bay", city: "Betty's Bay", zone: "Western Cape", country: "ZA", code: "7141" } },
    order,
    parcels,
  );
  assert.equal(payload.declared_value, 30_000);
  assert.equal(payload.parcels.length, 2);
  assert.equal(payload.parcels[1].submitted_weight_kg, 33.9);
  assert.equal(payload.delivery_address.code, "7195");
  assert.equal(payload.delivery_address.type, "residential");
  assert.equal(linerJobAsCourierOrder({ ...job, companyName: "Farm Co" }).customer_type, "business");
});

test("rates: ex-VAT figure is the courier's when stated, else derived", () => {
  const [stated] = parseRates({ rates: [{ rate: 1150, rate_excluding_vat: 1000, service_level: { code: "ECO", name: "Economy" } }] });
  assert.equal(stated.rateExVat, 1000);
  assert.deepEqual(rateExVat(stated), { exVat: 1000, stated: true });
  const [plain] = parseRates({ rates: [{ rate: 1150, service_level: { code: "ECO", name: "Economy" } }] });
  assert.equal("rateExVat" in plain, false);
  assert.deepEqual(rateExVat(plain), { exVat: 1000, stated: false });
});

test("summary, brief and WhatsApp link", () => {
  const parcel = { lengthCm: 40, widthCm: 40, heightCm: 40, weightKg: 33.9 };
  const summary = buildWhatsAppSummary({ areaM2: 61.6, gsm: 550, parcel, quantity: 1, depotLabel: "Betty's Bay", city: "Kleinmond", rate: { serviceName: "Economy", rate: 1150 } });
  assert.match(summary, /550 gsm PVC liner \(61.6 m²\) · 40×40×40 cm, 33.9 kg · Betty's Bay → Kleinmond · The Courier Guy Economy: R1 150\.00 incl\. VAT/);
  const brief = buildCourierQuoteBrief({ areaM2: 61.6, gsm: 550, parcel, quantity: 2, depotLabel: "Betty's Bay", city: "Kleinmond", job, collection: "Betty's Bay depot" });
  assert.match(brief, /please quote, do not book yet/);
  assert.match(brief, /2 × \(40×40×40 cm, 33\.9 kg\)/);
  assert.match(brief, /capped at R30 000/);
  assert.match(brief, /Gate code 1234/);
  assert.equal(whatsAppLink("082 000 0000", "hi there"), "https://wa.me/27820000000?text=hi%20there");
});

test("quotation line: delivery type, cost ex VAT, markup or entered sell", () => {
  const input = { rate: { serviceName: "Economy", serviceCode: "ECO", rate: 1150 }, parcel: { lengthCm: 40, widthCm: 40, heightCm: 40, weightKg: 33.9 }, quantity: 1, depotLabel: "Pretoria", city: "Polokwane", markupPercent: 20 };
  const line = buildCourierQuoteLine(input, 3);
  assert.equal(line.lineType, "delivery");
  assert.equal(line.costUnitPrice, 1000);
  assert.equal(line.sellUnitPrice, 1200);
  assert.equal(line.metadata?.source, LINER_COURIER_LINE_SOURCE);
  assert.match(line.description, /^Courier delivery — The Courier Guy \(Economy\) · 40×40×40 cm, 33\.9 kg · Pretoria → Polokwane$/);
  assert.equal(buildCourierQuoteLine({ ...input, sellExVat: 1500 }, 0).sellUnitPrice, 1500);
  assert.match(quoteLineCopyText(line), /Sell R1 200\.00 excl\. VAT \(R1 380\.00 incl\. VAT\)/);
});

test("quotation line replaces the earlier courier line instead of adding a second", () => {
  const other: QuoteLineInput = { id: "a", sortOrder: 0, lineType: "material", description: "Liner", quantity: 1, unit: "each", sellUnitPrice: 9000, discountPercent: 0, taxCategory: "standard" };
  const input = { rate: { serviceName: "Economy", serviceCode: "ECO", rate: 1150 }, parcel: { lengthCm: 40, widthCm: 40, heightCm: 40, weightKg: 33.9 }, quantity: 1, depotLabel: "Pretoria", city: "Polokwane" };
  const first = upsertCourierQuoteLine([other], buildCourierQuoteLine(input, 0));
  assert.equal(first.length, 2);
  assert.equal(first[1].sortOrder, 1);
  const withId = [first[0], { ...first[1], id: "b" }];
  const second = upsertCourierQuoteLine(withId, buildCourierQuoteLine({ ...input, rate: { ...input.rate, rate: 2300 } }, 0));
  assert.equal(second.length, 2);
  assert.equal(second[1].id, "b");
  assert.equal(second[1].sortOrder, 1);
  assert.equal(second[1].costUnitPrice, 2000);
  assert.deepEqual(second[0], other);
});

test("board stages: on a quotation, formal quote asked, rated, draft", async () => {
  const { groupLinerQuotes, linerQuoteStage, matchesLinerQuoteSearch } = await import("./liner-board.ts");
  const base = { quote_id: null, chosen_amount: null, formal_quote_status: "none", courier_rates: null };
  assert.equal(linerQuoteStage(base), "draft");
  assert.equal(linerQuoteStage({ ...base, courier_rates: [{}] }), "rated");
  assert.equal(linerQuoteStage({ ...base, courier_rates: [{}], formal_quote_status: "brief_copied" }), "brief");
  assert.equal(linerQuoteStage({ ...base, quote_id: "q", chosen_amount: 1150, formal_quote_status: "portal_opened" }), "quoted");
  // A linked quote without a chosen rate is not yet on the quotation.
  assert.equal(linerQuoteStage({ ...base, quote_id: "q" }), "draft");
  const groups = groupLinerQuotes([base, { ...base, courier_rates: [{}] }]);
  assert.deepEqual(groups.map((g) => [g.id, g.rows.length]), [["quoted", 0], ["brief", 0], ["rated", 1], ["draft", 1]]);
  const row = { reference: "Q-2026-0101", customer_name: "A Farmer", delivery_address: { city: "Kleinmond", phone: "0820000000" } };
  assert.ok(matchesLinerQuoteSearch(row, "kleinmond"));
  assert.ok(matchesLinerQuoteSearch(row, "0101"));
  assert.ok(!matchesLinerQuoteSearch(row, "durban"));
});

test("saved rows give back the parcel, job and size line", async () => {
  const { savedJob, savedParcel, savedSizeLabel } = await import("./liner-board.ts");
  const row = {
    id: "1", created_at: "", updated_at: "", reference: "Q-1", customer_name: "A Farmer", shape: "circular" as const,
    inputs: { diameter: "5", rows: "3", colour: "blue" }, area_m2: 61.6, gsm: 550, quantity: 2, weight_kg: 33.9,
    parcel_length_cm: 40, parcel_width_cm: 40, parcel_height_cm: 40, parcel_source: "folded" as const, depot: "pretoria",
    delivery_address: { customerName: "A Farmer", phone: "082", street: "5 Farm Rd", suburb: "K", city: "Kleinmond", province: "Western Cape", postalCode: "7195" },
    declared_value: 5000, courier_rates: null, rated_at: null, chosen_service_name: null, chosen_amount: null,
    formal_quote_status: "none", rfq_id: null, quote_id: null, notes: "Gate 4",
  };
  assert.deepEqual(savedParcel(row), { lengthCm: 40, widthCm: 40, heightCm: 40, weightKg: 33.9 });
  const job = savedJob(row);
  assert.equal(job.description, "2 x 550 gsm PVC liner (blue), 61.6 m2 made up");
  assert.equal(job.postalCode, "7195");
  assert.equal(job.declaredValue, 5000);
  assert.deepEqual(checkJob(job), { ok: true });
  assert.equal(savedSizeLabel(row), "Round tank 5 m, 3 rows");
  assert.equal(savedSizeLabel({ shape: "circular", inputs: { diameter: "6", rows: "custom", wallHeight: "2.4" } }), "Round tank 6 m, 2.4 m wall");
  assert.equal(savedSizeLabel({ shape: "rectangular", inputs: { length: "4", width: "3", depth: "1.5" } }), "Rectangular 4 × 3 × 1.5 m");
});

test("formal quote: shipment payload marked as a quote, muted, collection a week out", async () => {
  const { buildQuoteShipmentPayload, courierQuoteCollectionDate, parseQuoteShipment } = await import("./payloads.ts");
  const sender = {
    address: { type: "business" as const, street_address: "1 Depot", local_area: "Betty's Bay", city: "Betty's Bay", zone: "Western Cape", country: "ZA" as const, code: "7141" },
    contact: { name: "Stores", mobile_number: "0100000000", email: "stores@example.com" },
  };
  const order = linerJobAsCourierOrder(job);
  const now = new Date("2026-11-11T10:00:00Z");
  const payload = buildQuoteShipmentPayload(sender, order, parcelsForQuantity({ lengthCm: 40, widthCm: 40, heightCm: 40, weightKg: 33.9 }, 1), "ECO", now);
  assert.equal(payload.status, "quote");
  assert.equal(payload.mute_notifications, true);
  assert.equal(payload.collection_min_date, "2026-11-18T08:00:00+02:00");
  assert.ok(!Number.isNaN(Date.parse(payload.collection_min_date)));
  assert.equal(payload.service_level_code, "ECO");
  assert.equal(payload.customer_reference, "Q-2026-0101");
  assert.equal(payload.declared_value, 30_000);
  assert.equal(payload.delivery_contact.mobile_number, "082 000 0000");
  assert.equal(courierQuoteCollectionDate(now, 0), "2026-11-11T08:00:00+02:00");

  assert.deepEqual(parseQuoteShipment({ id: 991, status: "quote", rate: 1150 }), { id: "991", trackingReference: null, status: "quote", rate: 1150, isQuote: true });
  const booked = parseQuoteShipment({ id: 992, status: "submitted", short_tracking_reference: "TCG9" });
  assert.equal(booked?.isQuote, false);
  assert.equal(booked?.trackingReference, "TCG9");
  assert.equal(parseQuoteShipment({}), null);
});

test("formal quote: client posts to /shipments and reports quote vs booked; cancel posts the waybill", async () => {
  const { createCourierQuote, cancelCourierShipment } = await import("./client.ts");
  const { getCourierConfig } = await import("./config.ts");
  const env = {
    COURIER_GUY_API_KEY: "k", COURIER_GUY_API_URL: "https://api.shiplogic.com",
    COURIER_SENDER_NAME: "Stores", COURIER_SENDER_PHONE: "0100000000", COURIER_SENDER_EMAIL: "s@example.com",
    COURIER_SENDER_STREET: "1 Road", COURIER_SENDER_SUBURB: "Town", COURIER_SENDER_CITY: "Pretoria",
    COURIER_SENDER_PROVINCE: "Gauteng", COURIER_SENDER_POSTAL_CODE: "0001",
  };
  const config = getCourierConfig(env);
  assert.ok(config.ok);
  const seen: { url: string; body: Record<string, unknown> }[] = [];
  const answer = (reply: unknown) =>
    (async (url: string, init: RequestInit) => {
      seen.push({ url, body: JSON.parse(String(init.body)) });
      return Response.json(reply);
    }) as unknown as typeof fetch;
  const parcel = { lengthCm: 40, widthCm: 40, heightCm: 40, weightKg: 33.9 };
  const quoted = await createCourierQuote(config.config, linerJobAsCourierOrder(job), [parcel], "ECO", answer({ id: 5, status: "quote", rate: 1150 }));
  assert.ok(quoted.ok && quoted.data.isQuote);
  assert.equal(seen[0].url, "https://api.shiplogic.com/shipments");
  assert.equal(seen[0].body.status, "quote");
  const booked = await createCourierQuote(config.config, linerJobAsCourierOrder(job), [parcel], "ECO", answer({ id: 6, status: "submitted", short_tracking_reference: "TCG9" }));
  assert.ok(booked.ok && !booked.data.isQuote && booked.data.trackingReference === "TCG9");
  const cancelled = await cancelCourierShipment(config.config, "TCG9", answer({}));
  assert.ok(cancelled.ok);
  assert.equal(seen[2].url, "https://api.shiplogic.com/shipments/cancel");
  assert.deepEqual(seen[2].body, { tracking_reference: "TCG9" });
});
