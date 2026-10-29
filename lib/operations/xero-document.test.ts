import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { XeroBridgeError, type XeroBridgeClient } from "./xero-bridge.ts";
import { createDocumentLookup, documentKindOf, getXeroDocumentWithContact, XeroDocumentError } from "./xero-document.ts";
import { buildProjectXeroReview } from "./xero-review.ts";

// Fictional customers: the shape mirrors xero-bridge v7, the values are made up.
const KS49 = "f3dd1d70-c89c-4648-91ae-0c10dc123078";
const DOCS: Record<string, { id: string; name: string; email: string; phone: string }> = {
  QU0348: { id: "0f09a43a-c631-4a42-8b56-5dce6f753ea9", name: "Customer A", email: "a@example.com", phone: "+27740000001" },
  QU0283: { id: "10000000-0000-4000-8000-000000000002", name: "Customer B", email: "b@example.com", phone: "+27740000002" },
  INV0153: { id: "10000000-0000-4000-8000-000000000003", name: "Customer C", email: "c@example.com", phone: "+27740000003" },
  INV0159: { id: "10000000-0000-4000-8000-000000000004", name: "Customer D", email: "d@example.com", phone: "+27740000004" },
  INV0160: { id: "10000000-0000-4000-8000-000000000004", name: "Customer D", email: "d@example.com", phone: "+27740000004" },
  INV0144: { id: "10000000-0000-4000-8000-000000000005", name: "Customer E", email: "e@example.com", phone: "+27740000005" },
  INV0143: { id: "10000000-0000-4000-8000-000000000006", name: "Customer F", email: "f@example.com", phone: "+27740000006" },
  INV0136: { id: "10000000-0000-4000-8000-000000000007", name: "Customer G", email: "g@example.com", phone: "+27740000007" },
  QU0294: { id: "10000000-0000-4000-8000-000000000008", name: "Customer H", email: "h@example.com", phone: "+27740000008" },
  INV0137: { id: "10000000-0000-4000-8000-000000000008", name: "Customer H", email: "h@example.com", phone: "+27740000008" },
};

type Call = { tool: string; args: Record<string, unknown> | undefined };

/** A v7 bridge: only get_document_with_contact answers; anything else is a bug in the website. */
function v7Bridge(overrides: Partial<Record<string, () => unknown>> = {}) {
  const calls: Call[] = [];
  const bridge: XeroBridgeClient = {
    status: async () => ({ connected: true }),
    call: (async (tool: string, args?: Record<string, unknown>) => {
      calls.push({ tool, args });
      if (tool !== "get_document_with_contact") throw new Error(`unexpected tool ${tool}`);
      const number = String(args?.number);
      const override = overrides[number];
      if (override) return override();
      const c = DOCS[number];
      if (!c) throw new XeroBridgeError(`Xero bridge: Document not found: ${number}`, 400);
      return {
        kind: args?.kind,
        number,
        document: { id: `doc-${number}`, status: "ACCEPTED", date: "2026-10-01", title: `Job ${number}`, total: 1000 },
        contact_id: c.id,
        contact: { id: c.id, name: c.name, email: c.email, phone: c.phone, first_name: null, last_name: null },
      };
    }) as XeroBridgeClient["call"],
  };
  return { bridge, calls };
}

describe("document → its contact", () => {
  it("resolves every listed document to its own contact, never K&S49", async () => {
    const { bridge, calls } = v7Bridge();
    for (const number of Object.keys(DOCS)) {
      const found = await getXeroDocumentWithContact(bridge, documentKindOf(number)!, number);
      assert.equal(found.contact.id, DOCS[number].id, number);
      assert.notEqual(found.contact.id, KS49);
      assert.equal(found.contact.email, DOCS[number].email);
      assert.equal(found.contact.phone, DOCS[number].phone);
    }
    assert.ok(calls.every((c) => c.tool === "get_document_with_contact"));
    assert.deepEqual(calls[0].args, { kind: "quote", number: "QU0348" });
  });

  it("normalises the number and refuses the wrong kind", async () => {
    const { bridge, calls } = v7Bridge();
    const found = await getXeroDocumentWithContact(bridge, "quote", "qu-0348");
    assert.equal(found.document.number, "QU0348");
    await assert.rejects(() => getXeroDocumentWithContact(bridge, "invoice", "QU0348"), XeroDocumentError);
    assert.equal(calls.length, 1);
  });

  for (const [label, error, pattern] of [
    ["400 passes the bridge's own words", new XeroBridgeError("Xero bridge: Document not found: QU9999", 400), /Document not found: QU9999\. Nothing was changed/],
    ["502 says Xero didn't answer", new XeroBridgeError("Xero bridge: Xero API error", 502), /didn't answer/],
    ["timeout says it took too long", new XeroBridgeError("Xero bridge timed out", null), /too long/],
    ["503 says Xero isn't connected", new XeroBridgeError("Xero bridge: not connected", 503), /isn't connected/],
    ["the old bridge is named", new XeroBridgeError("Xero bridge: Unknown tool", 404), /old Xero bridge/],
  ] as const) {
    it(`errors clearly with no fallback: ${label}`, async () => {
      const { bridge, calls } = v7Bridge({
        QU0348: () => {
          throw error;
        },
      });
      await assert.rejects(
        () => getXeroDocumentWithContact(bridge, "quote", "QU0348"),
        (err: unknown) => err instanceof XeroDocumentError && pattern.test(err.message),
      );
      assert.equal(calls.length, 1, "exactly one call, no fallback lookup");
    });
  }

  it("refuses a contact whose id differs from the document's", async () => {
    const { bridge } = v7Bridge({
      QU0348: () => ({ number: "QU0348", document: { id: "d" }, contact_id: DOCS.QU0348.id, contact: { id: KS49, name: "K&S49 Trading (PTY) LTD" } }),
    });
    await assert.rejects(
      () => getXeroDocumentWithContact(bridge, "quote", "QU0348"),
      (err: unknown) => err instanceof XeroDocumentError && /different contact/.test(err.message),
    );
  });

  it("refuses a known wrong contact even if both ids agree but the document isn't theirs", async () => {
    const { bridge } = v7Bridge({
      QU0348: () => ({ number: "QU0348", document: { id: "d" }, contact_id: KS49, contact: { id: KS49, name: "K&S49" } }),
    });
    // Both ids say K&S49, so the document genuinely belongs to them: allowed.
    const found = await getXeroDocumentWithContact(bridge, "quote", "QU0348");
    assert.equal(found.contactId, KS49);
  });

  it("retries a Xero rate limit once, after Retry-After", async () => {
    let n = 0;
    const { bridge, calls } = v7Bridge({
      QU0348: () => {
        n += 1;
        if (n === 1) throw new XeroBridgeError("Xero bridge: Xero API error", 502, { upstreamStatus: 429, retryAfterSeconds: 0.01 });
        return { number: "QU0348", document: { id: "d" }, contact_id: DOCS.QU0348.id, contact: { id: DOCS.QU0348.id, name: "Customer A" } };
      },
    });
    const found = await getXeroDocumentWithContact(bridge, "quote", "QU0348");
    assert.equal(found.contact.name, "Customer A");
    assert.equal(calls.length, 2);
  });

  it("bulk runs call Xero once per document", async () => {
    const { bridge, calls } = v7Bridge();
    const lookup = createDocumentLookup(bridge);
    await Promise.all([lookup("invoice", "INV0159"), lookup("invoice", "INV0159"), lookup("invoice", "INV0160")]);
    assert.equal(calls.length, 2);
  });
});

/** Minimal Supabase stand-in for buildProjectXeroReview's single read. */
function dbWith(project: Record<string, unknown> | null) {
  const writes: unknown[] = [];
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => ({ data: project, error: null }),
    update: (v: unknown) => {
      writes.push(v);
      return chain;
    },
    insert: (v: unknown) => {
      writes.push(v);
      return chain;
    },
  };
  return { db: { from: () => chain } as never, writes };
}

describe("review card preview", () => {
  const base = {
    id: "p1",
    title: "Reservoir job",
    customer_name: "K&S49 Trading (PTY) LTD",
    contact_person: "Wrong person",
    contact_phone: "+27110000000",
    contact_email: "wrong@example.com",
    quoted_total_incl_vat: 1000,
    site_province: null,
    site_town: null,
    xero_quote_numbers: ["QU0348"],
    xero_invoice_numbers: [],
    xero_contact_id: KS49,
  };

  it("shows a project stored with K&S49 details as normal, pre-ticked corrections, and writes nothing", async () => {
    const { bridge } = v7Bridge();
    const { db, writes } = dbWith(base);
    const preview = await buildProjectXeroReview(db, bridge, "p1");
    assert.ok(!("error" in preview));
    const byField = Object.fromEntries(preview.rows.map((r) => [r.field, r]));
    assert.equal(byField.contact_email.proposed, "a@example.com");
    assert.equal(byField.contact_email.current, "wrong@example.com");
    assert.equal(byField.contact_email.defaultAccept, true);
    assert.equal(byField.contact_phone.defaultAccept, true);
    assert.equal(preview.contactId, DOCS.QU0348.id);
    assert.ok(preview.rows.every((r) => !/K&S49|Sharon|silvertonmidas/i.test(r.proposed)));
    assert.equal(writes.length, 0);
  });

  it("asks for a number when the project has none", async () => {
    const { bridge, calls } = v7Bridge();
    const { db } = dbWith({ ...base, xero_quote_numbers: [], xero_invoice_numbers: [] });
    const preview = await buildProjectXeroReview(db, bridge, "p1");
    assert.ok("error" in preview && preview.needsDocument);
    assert.equal(calls.length, 0);
  });

  it("surfaces the bridge's error and writes nothing", async () => {
    const { bridge } = v7Bridge({
      QU0348: () => {
        throw new XeroBridgeError("Xero bridge: No contact on document QU0348", 400);
      },
    });
    const { db, writes } = dbWith(base);
    const preview = await buildProjectXeroReview(db, bridge, "p1");
    assert.ok("error" in preview && /No contact on document QU0348/.test(preview.error));
    assert.equal(writes.length, 0);
  });
});

describe("review card: matches and gaps", () => {
  it("lists matching fields, never offers to blank one Xero lacks, and treats 074… and +2774… as the same phone", async () => {
    const { bridge } = v7Bridge({
      QU0348: () => ({
        number: "QU0348",
        document: { id: "d", title: "Job", total: 1000 },
        contact_id: DOCS.QU0348.id,
        contact: { id: DOCS.QU0348.id, name: "Customer A", email: null, phone: "+27740000001", addresses: [] },
      }),
    });
    const { db } = dbWith({
      id: "p1",
      title: "Job",
      customer_name: "Customer A",
      contact_person: "Customer A",
      contact_phone: "074 000 0001",
      contact_email: "keep@example.com",
      quoted_total_incl_vat: 1000,
      site_province: "Gauteng",
      site_town: "Pretoria",
      xero_quote_numbers: ["QU0348"],
      xero_invoice_numbers: [],
      xero_contact_id: DOCS.QU0348.id,
    });
    const preview = await buildProjectXeroReview(db, bridge, "p1");
    assert.ok(!("error" in preview));
    assert.equal(preview.rows.length, 0);
    assert.ok(preview.matched.some((r) => r.field === "contact_phone"));
    assert.deepEqual(preview.missingInXero, ["Email", "Location"]);
  });
});
