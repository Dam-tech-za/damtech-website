import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CATALOGUE_PRODUCTS,
  CATALOGUE_SKUS,
  formatZarExactAmount,
  formatZarWholeAmount,
  invoiceRequestPath,
  orderPath,
} from "../catalogue/index.ts";
import {
  CATALOGUE_ANALYTICS_EVENTS,
  CATALOGUE_PAYMENT_ANALYTICS_EVENTS,
} from "../catalogue/analytics.ts";
import { MERCHANT_CENTER_RELEASE_GATE } from "../catalogue/merchant.ts";
import { breakdownVatInclusive, vatFromInclusiveCents } from "./money.ts";
import { generateOrderReference, isOrderReferenceFormat } from "./reference.ts";
import {
  parsePublicOrderFormData,
  isValidOrderPhone,
} from "./schema.ts";
import {
  resolveOrderableProduct,
  resolveOrderSelectionFromParams,
} from "./pricing.ts";
import { publicOrderSuccess } from "./result.ts";
import {
  buildCustomerOrderEmail,
  buildInternalOrderEmail,
  customerOrderEmailSubject,
  internalOrderEmailSubject,
  ORDER_PENDING_INVOICE_NOTICE,
} from "./email/templates.ts";
import { getMerchantOrderReadiness } from "./merchant-readiness.ts";
import {
  COLLECTION_FULFILMENT,
  isCollectionLocationConfigured,
} from "./collection.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function validFields(overrides: Record<string, string> = {}) {
  return {
    sku: "DMT-WT-10000",
    quantity: "1",
    customerType: "individual",
    customerName: "Test Customer",
    email: "customer@example.com",
    phone: "0821234567",
    billingLine1: "12 Example Road",
    suburb: "Paarl",
    city: "Paarl",
    province: "Western Cape",
    postalCode: "7646",
    confirmSupplyOnly: "true",
    confirmExclusions: "true",
    confirmPolicies: "true",
    fulfilmentMethod: "collection_customer_arranged",
    submissionId: "11111111-1111-4111-8111-111111111111",
    formStartedAt: String(Date.now() - 5000),
    website: "",
    ...overrides,
  };
}

function formFrom(fields: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  return form;
}

describe("1 valid order submission parse", () => {
  it("accepts a complete allowlisted order and snapshots catalogue price", () => {
    const parsed = parsePublicOrderFormData(formFrom(validFields()));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const snapshot = resolveOrderableProduct(parsed.data.sku, parsed.data.quantity);
    assert.ok(snapshot);
    assert.equal(snapshot.sku, "DMT-WT-10000");
    assert.equal(snapshot.unitPriceInclVatZar, 12999);
    assert.equal(snapshot.totalInclVatZar, 12999);
    assert.equal(snapshot.transportExcluded, true);
    assert.equal(COLLECTION_FULFILMENT.method, parsed.data.fulfilmentMethod);
  });
});

describe("2 invalid SKU rejection", () => {
  it("rejects unknown SKUs without listing the catalogue", () => {
    const parsed = parsePublicOrderFormData(
      formFrom(validFields({ sku: "FAKE-SKU" })),
    );
    assert.equal(parsed.ok, false);
    if (parsed.ok) return;
    assert.match(parsed.error, /not available to order online/i);
    assert.doesNotMatch(parsed.error, /DMT-WT-10000|price|12999/);
  });
});

describe("3 manipulated client price ignored", () => {
  it("uses catalogue price even if the form posts a fake total", () => {
    const parsed = parsePublicOrderFormData(
      formFrom(
        validFields({
          price: "1",
          unitPrice: "1",
          total: "1",
          productName: "Cheap tank",
        }),
      ),
    );
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const snapshot = resolveOrderableProduct(parsed.data.sku, parsed.data.quantity);
    assert.equal(snapshot?.unitPriceInclVatZar, 12999);
    assert.equal(snapshot?.totalInclVatZar, 12999);
    assert.equal(snapshot?.productName, "10 000L Corrugated Steel Water Tank");
  });
});

describe("4 invalid quantity rejection", () => {
  it("rejects quantity 0 and 100", () => {
    const zero = parsePublicOrderFormData(formFrom(validFields({ quantity: "0" })));
    const tooMany = parsePublicOrderFormData(
      formFrom(validFields({ quantity: "100" })),
    );
    assert.equal(zero.ok, false);
    assert.equal(tooMany.ok, false);
    if (!zero.ok) assert.match(zero.error, /quantity/i);
  });
});

describe("5 missing consent rejection", () => {
  it("rejects when any confirmation is missing", () => {
    const parsed = parsePublicOrderFormData(
      formFrom({
        ...validFields(),
        confirmSupplyOnly: "",
        confirmExclusions: "true",
        confirmPolicies: "true",
      }),
    );
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.match(parsed.error, /supply-only/i);
  });
});

describe("6 duplicate idempotency token", () => {
  it("keeps a stable UUID submission id for replay", () => {
    const parsed = parsePublicOrderFormData(formFrom(validFields()));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.submissionId, "11111111-1111-4111-8111-111111111111");
  });
});

describe("7 customer email rendering", () => {
  it("renders the required customer confirmation without banking details", () => {
    const snapshot = resolveOrderableProduct("DMT-WT-10000", 2);
    assert.ok(snapshot);
    const parsed = parsePublicOrderFormData(
      formFrom(validFields({ quantity: "2" })),
    );
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const email = buildCustomerOrderEmail({
      orderReference: "DT-20260813-ABCD2345",
      placedAtIso: "2026-08-13T09:00:00.000Z",
      data: parsed.data,
      snapshot,
    });
    assert.equal(
      email.subject,
      customerOrderEmailSubject("DT-20260813-ABCD2345"),
    );
    assert.match(email.text, new RegExp(ORDER_PENDING_INVOICE_NOTICE));
    assert.match(email.html, /Pending invoice/);
    assert.match(email.text, /Transport excluded/);
    assert.match(email.text, /Installation excluded/);
    assert.doesNotMatch(email.text, /account number|branch code|FNB|Standard Bank/i);
    assert.doesNotMatch(email.html, /<script/i);
  });
});

describe("8 internal email rendering", () => {
  it("includes customer details and an authenticated admin link", () => {
    const snapshot = resolveOrderableProduct("DMT-WT-10000", 1);
    assert.ok(snapshot);
    const parsed = parsePublicOrderFormData(formFrom(validFields()));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const email = buildInternalOrderEmail({
      orderReference: "DT-20260813-ABCD2345",
      placedAtIso: "2026-08-13T09:00:00.000Z",
      data: parsed.data,
      snapshot,
      adminUrl: "https://www.dam-tech.co.za/admin/orders/abc/",
      termsAcceptedAt: "2026-08-13T09:00:00.000Z",
      privacyAcceptedAt: "2026-08-13T09:00:00.000Z",
      exclusionsAcceptedAt: "2026-08-13T09:00:00.000Z",
    });
    assert.equal(
      email.subject,
      internalOrderEmailSubject("DT-20260813-ABCD2345", snapshot.productName),
    );
    assert.match(email.text, /customer@example.com/);
    assert.match(email.text, /\/admin\/orders\/abc\//);
    assert.doesNotMatch(email.text, /\/order\/success/);
  });
});

describe("9 Resend failure after successful persistence", () => {
  it("still returns a customer success payload with the order reference", () => {
    const result = publicOrderSuccess({
      orderReference: "DT-20260813-ABCD2345",
      viewToken: "token",
      email: "customer@example.com",
      productName: "10 000L Corrugated Steel Water Tank",
      quantity: 1,
      totalInclVatZar: 12999,
      confirmationEmailStatus: "failed",
      internalEmailStatus: "failed",
    });
    assert.equal(result.success, true);
    assert.equal(result.orderReference, "DT-20260813-ABCD2345");
    assert.equal(result.confirmationEmailStatus, "failed");
    assert.equal("error" in result, false);
  });
});

describe("10 order-reference uniqueness", () => {
  it("generates DT-YYYYMMDD-CODE references that do not collide in a sample", () => {
    const refs = new Set(Array.from({ length: 200 }, () => generateOrderReference()));
    assert.equal(refs.size, 200);
    for (const ref of refs) {
      assert.equal(isOrderReferenceFormat(ref), true);
    }
  });
});

describe("11 VAT calculation", () => {
  it("splits VAT-inclusive totals in integer cents", () => {
    const breakdown = breakdownVatInclusive(12999, 1, 15);
    assert.equal(breakdown.totalInclVatCents, 1299900);
    assert.equal(breakdown.vatAmountCents, vatFromInclusiveCents(1299900, 15));
    assert.equal(
      breakdown.exVatCents + breakdown.vatAmountCents,
      breakdown.totalInclVatCents,
    );
    const two = breakdownVatInclusive(12999, 2, 15);
    assert.equal(two.totalInclVatZar, 25998);
    assert.equal(formatZarWholeAmount(12999), "R12\u00a0999");
    assert.doesNotMatch(formatZarWholeAmount(12999), /incl\. VAT/i);
    assert.equal(
      formatZarExactAmount(breakdown.vatAmountZar),
      "R1\u00a0695.52",
    );
    assert.doesNotMatch(formatZarExactAmount(breakdown.vatAmountZar), /incl\. VAT/i);
  });
});

describe("checkout summary copy", () => {
  it("labels included VAT without calling it a VAT-inclusive amount", () => {
    const summary = readFileSync(
      join(root, "components/order/OrderSummary.tsx"),
      "utf8",
    );
    assert.match(summary, /Included VAT/);
    assert.doesNotMatch(summary, /VAT component/);
    assert.doesNotMatch(summary, /incl\. VAT/);
    const scroll = readFileSync(join(root, "components/ScrollToTop.tsx"), "utf8");
    assert.match(scroll, /pathname\.startsWith\("\/order"\)/);
  });
});

describe("12 product-price snapshot", () => {
  it("reads every allowlisted SKU from the catalogue, not a second price list", () => {
    const expected: Record<string, number> = {
      "DMT-WT-10000": 12999,
      "DMT-WT-20000": 15999,
      "DMT-WT-50000": 24999,
      "DMT-WT-100000": 40999,
      "DMT-FP-10000": 13999,
      "DMT-FP-15000": 17999,
      "DMT-LT-1500": 4999,
    };
    for (const sku of CATALOGUE_SKUS) {
      const snapshot = resolveOrderableProduct(sku, 1);
      assert.equal(snapshot?.unitPriceInclVatZar, expected[sku]);
      assert.equal(
        snapshot?.unitPriceInclVatZar,
        CATALOGUE_PRODUCTS.find((product) => product.sku === sku)?.priceInclVatZar,
      );
    }
  });
});

describe("13 noindex metadata", () => {
  it("marks order pages noindex, keeps them crawlable in robots.txt, and omits them from the sitemap", () => {
    const orderPage = readFileSync(join(root, "app/order/page.tsx"), "utf8");
    const successPage = readFileSync(
      join(root, "app/order/success/page.tsx"),
      "utf8",
    );
    assert.match(orderPage, /index:\s*false/);
    assert.match(orderPage, /follow:\s*false/);
    assert.match(successPage, /index:\s*false/);
    const site = readFileSync(join(root, "lib/site.ts"), "utf8");
    const disallowBlock = site.slice(
      site.indexOf("ROBOTS_DISALLOW_PATHS"),
      site.indexOf("INDEXABLE_STATIC_PATHS"),
    );
    assert.doesNotMatch(disallowBlock, /"\/order\/"/);
    assert.match(
      readFileSync(join(root, "lib/sitemap.ts"), "utf8"),
      /normalised\.startsWith\("\/order"\)/,
    );
    assert.doesNotMatch(
      readFileSync(join(root, "app/robots.ts"), "utf8"),
      /["']\/order\//,
    );
  });
});

describe("14 RFQ transport link prefill", () => {
  it("builds the existing quote path with SKU and quantity", () => {
    assert.equal(
      invoiceRequestPath("DMT-WT-10000", 2),
      "/quote/?sku=DMT-WT-10000&qty=2",
    );
    const form = readFileSync(
      join(root, "components/order/OrderForm.tsx"),
      "utf8",
    );
    assert.match(form, /Need DamTech to arrange transport/);
    assert.match(form, /Request a transport quote/);
    assert.match(form, /invoiceRequestPath/);
    assert.doesNotMatch(form, /A public collection address is not published yet/);
  });
});

describe("15 Order button on all orderable products", () => {
  it("exposes a crawlable /order/?sku=&qty=1 link for every catalogue SKU", () => {
    const buybox = readFileSync(
      join(root, "components/catalogue/AddToRfqControl.tsx"),
      "utf8",
    );
    assert.match(buybox, /Order this kit/);
    assert.match(buybox, /Request a custom quote/);
    assert.match(buybox, /beginCheckout/);
    for (const product of CATALOGUE_PRODUCTS) {
      assert.equal(orderPath(product.sku, 1), `/order/?sku=${product.sku}&qty=1`);
    }
  });
});

describe("16 no purchase event before payment", () => {
  it("does not fire purchase or payment_complete from the order UI", () => {
    const buybox = readFileSync(
      join(root, "components/catalogue/AddToRfqControl.tsx"),
      "utf8",
    );
    const form = readFileSync(
      join(root, "components/order/OrderForm.tsx"),
      "utf8",
    );
    assert.match(buybox, /beginCheckout/);
    assert.doesNotMatch(buybox, /purchase|payment_complete/);
    assert.doesNotMatch(form, /purchase|payment_complete/);
    assert.equal(CATALOGUE_ANALYTICS_EVENTS.beginCheckout, "begin_checkout");
    assert.equal(CATALOGUE_ANALYTICS_EVENTS.orderSubmitted, "order_submitted");
    assert.equal(CATALOGUE_PAYMENT_ANALYTICS_EVENTS.purchase, "purchase");
  });
});

describe("17 anonymous users cannot read orders", () => {
  it("revokes anon access and has no public insert/select policies", () => {
    const sql = readFileSync(
      join(root, "supabase/migrations/20260813093808_catalogue_orders.sql"),
      "utf8",
    );
    assert.match(sql, /revoke all on table public.catalogue_orders from anon/i);
    assert.match(sql, /enable row level security/i);
    assert.doesNotMatch(sql, /for select to anon/i);
    assert.doesNotMatch(sql, /for insert to anon/i);
    assert.match(sql, /unique index if not exists catalogue_orders_reference_uidx/i);
    assert.match(sql, /unique index if not exists catalogue_orders_idempotency_uidx/i);
  });
});

describe("18 invalid order URLs reveal no catalogue internals", () => {
  it("returns null for unknown SKUs and ignores price query params", () => {
    assert.equal(
      resolveOrderSelectionFromParams({ sku: "NOT-A-SKU", qty: "1", price: "1" }),
      null,
    );
    const priced = resolveOrderSelectionFromParams({
      sku: "DMT-WT-10000",
      qty: "1",
      price: "1",
      name: "Fake",
    });
    assert.equal(priced?.unitPriceInclVatZar, 12999);
    const page = readFileSync(join(root, "app/order/page.tsx"), "utf8");
    assert.match(page, /Kit not found/);
    assert.doesNotMatch(page, /CATALOGUE_SKUS/);
  });
});

describe("merchant readiness remains closed", () => {
  it("does not enable the feed or a collection address", () => {
    assert.equal(MERCHANT_CENTER_RELEASE_GATE.feedEnabled, false);
    assert.equal(isCollectionLocationConfigured(), false);
    assert.equal(getMerchantOrderReadiness().ready, false);
    assert.ok(
      getMerchantOrderReadiness().blockers.some(
        (item) => item.id === "collection-location",
      ),
    );
  });
});

describe("phone validation", () => {
  it("accepts SA and international formatting", () => {
    assert.equal(isValidOrderPhone("082 123 4567"), true);
    assert.equal(isValidOrderPhone("+27 82 123 4567"), true);
    assert.equal(isValidOrderPhone("+12025551234"), true);
    assert.equal(isValidOrderPhone("abc"), false);
  });
});
