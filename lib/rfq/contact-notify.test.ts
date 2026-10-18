/**
 * Regression guard: every public form action that saves an RFQ must send the
 * info@ notification and customer auto-reply (the /contact/ form once saved
 * RFQs silently — e.g. RFQ numbers missing from the info@ inbox).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const actions = ["app/actions/submit-lead.ts", "app/actions/submit-simple-quote.ts"];

describe("public RFQ notifications", () => {
  for (const file of actions) {
    it(`${file} notifies after saving an RFQ`, () => {
      const src = fs.readFileSync(file, "utf8");
      assert.match(src, /createRfqFromPublicSubmission\(/);
      assert.match(src, /await notifyNewPublicRfq\(/);
    });
  }

  it("the multi-asset wizard action sends both emails", () => {
    const src = fs.readFileSync("app/actions/submit-public-rfq.ts", "utf8");
    assert.match(src, /sendRfqAdminNotification\(/);
    assert.match(src, /sendRfqCustomerConfirmation\(/);
  });
});
