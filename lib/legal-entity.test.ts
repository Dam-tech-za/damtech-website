import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  formatRegisteredAddressOneLine,
  hasPublishedRegistrationNumber,
  LEGAL_ENTITY,
} from "./legal-entity.ts";

describe("legal entity facts", () => {
  it("publishes the confirmed legal name and Betty's Bay physical address", () => {
    assert.equal(
      LEGAL_ENTITY.legalName,
      "Damtech Structural Solutions (Pty) Ltd",
    );
    assert.equal(LEGAL_ENTITY.tradingName, "Damtech");
    assert.match(formatRegisteredAddressOneLine(), /2484 Anglers Rd/);
    assert.match(formatRegisteredAddressOneLine(), /Betty's Bay/);
    assert.match(formatRegisteredAddressOneLine(), /7141/);
  });

  it("does not invent a CIPC registration number", () => {
    assert.equal(LEGAL_ENTITY.registrationNumber, null);
    assert.equal(hasPublishedRegistrationNumber(), false);
  });

  it("stays aligned with the Betty's Bay head-office record", () => {
    const site = readFileSync(join(process.cwd(), "lib/site.ts"), "utf8");
    assert.match(site, /2484 Anglers Rd/);
    assert.match(site, /\+27 82 853 1026/);
    assert.match(site, /info@dam-tech\.co\.za/);
  });
});

describe("privacy policy covers POPIA", () => {
  it("names POPIA, retention and data-subject rights", () => {
    const page = readFileSync(join(process.cwd(), "app/privacy/page.tsx"), "utf8");
    assert.match(page, /Protection of Personal Information Act/);
    assert.match(page, /POPIA/);
    assert.match(page, /five years/i);
    assert.match(page, /Information Regulator/);
    assert.match(page, /access/i);
    assert.match(page, /correct/i);
    assert.match(page, /LegalSupplierDetails/);
  });
});

describe("order and terms show the supplier", () => {
  it("renders supplier details on terms, the order form and the footer", () => {
    const terms = readFileSync(join(process.cwd(), "app/terms/page.tsx"), "utf8");
    const order = readFileSync(
      join(process.cwd(), "components/order/OrderForm.tsx"),
      "utf8",
    );
    const footer = readFileSync(join(process.cwd(), "components/Footer.tsx"), "utf8");
    assert.match(terms, /LegalSupplierDetails/);
    assert.match(order, /LegalSupplierDetails/);
    assert.match(footer, /LEGAL_ENTITY\.legalName/);
    assert.match(footer, /formatRegisteredAddressOneLine/);
  });
});
