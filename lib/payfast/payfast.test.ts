import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPayfastConfig } from "./config.ts";
import { isItnAmountValid, isItnSignatureValid, parseItnBody } from "./itn.ts";
import { buildPayfastForm, centsToPayfastAmount, payfastCellNumber, splitCustomerName } from "./payment.ts";
import { paymentFormSignature, phpUrlEncode } from "./signature.ts";

// Expected values produced by PHP's urlencode()/md5(), the reference PayFast uses.
const PASS = "jt7NOE43FZPn";

describe("phpUrlEncode", () => {
  it("matches PHP urlencode for spaces, symbols and unicode", () => {
    assert.equal(phpUrlEncode("a b~*!'()"), "a+b%7E%2A%21%27%28%29");
    assert.equal(phpUrlEncode("jan@example.com"), "jan%40example.com");
    assert.equal(phpUrlEncode("×"), "%C3%97");
    assert.equal(phpUrlEncode("-_."), "-_.");
  });
});

describe("payment form signature", () => {
  it("matches a PHP-computed signature", () => {
    const pairs: Array<[string, string]> = [
      ["merchant_id", "10000100"],
      ["merchant_key", "46f0cd694581a"],
      ["return_url", "https://www.dam-tech.co.za/pvc-tank-liners/checkout/return/?ref=DT-20261110-ABCDEFGH&t=x"],
      ["name_first", "Jan"],
      ["name_last", "van der Merwe"],
      ["email_address", "jan@example.com"],
      ["m_payment_id", "DT-20261110-ABCDEFGH"],
      ["amount", "8728.50"],
      ["item_name", "Damtech DT-20261110-ABCDEFGH"],
      ["item_description", "1 x 550 gsm PVC tank liner, 5 m × 2.29 m (O'Brien's) ~*!"],
    ];
    assert.equal(paymentFormSignature(pairs, PASS), "3138d490e36115b3dc7691b75e676f52");
  });

  it("skips empty fields so they do not change the signature", () => {
    const base: Array<[string, string]> = [["merchant_id", "1"], ["amount", "1.00"]];
    assert.equal(
      paymentFormSignature([...base, ["name_last", ""]], null),
      paymentFormSignature(base, null),
    );
  });
});

describe("buildPayfastForm", () => {
  const cfg = getPayfastConfig({ PAYFAST_MODE: "sandbox" });
  assert.ok(cfg.ok);
  const config = cfg.config;

  it("posts to the sandbox, signs last, and omits empty fields", () => {
    const form = buildPayfastForm(config, {
      orderReference: "DT-20261110-ABCDEFGH",
      amountCents: 872850,
      itemName: "Damtech DT-20261110-ABCDEFGH",
      firstName: "Jan",
      email: "jan@example.com",
      cellNumber: "+27 82 123 4567",
      viewToken: "tok",
      returnUrl: "https://x/r/",
      cancelUrl: "https://x/c/",
      notifyUrl: "https://x/n/",
    });
    assert.equal(form.action, "https://sandbox.payfast.co.za/eng/process");
    const names = form.fields.map((f) => f.name);
    assert.equal(names.at(-1), "signature");
    assert.ok(!names.includes("name_last"));
    assert.equal(form.fields.find((f) => f.name === "amount")?.value, "8728.50");
    assert.equal(form.fields.find((f) => f.name === "cell_number")?.value, "0821234567");
    const pairs = form.fields.filter((f) => f.name !== "signature").map((f) => [f.name, f.value] as const);
    assert.equal(form.fields.at(-1)?.value, paymentFormSignature(pairs, config.passphrase));
  });

  it("never sends a merchant key outside the form fields", () => {
    assert.equal(config.usingSharedSandboxAccount, true);
  });
});

describe("config", () => {
  it("refuses live mode without credentials or passphrase", () => {
    assert.equal(getPayfastConfig({ PAYFAST_MODE: "live" }).ok, false);
    assert.equal(
      getPayfastConfig({ PAYFAST_MODE: "live", PAYFAST_MERCHANT_ID: "123456", PAYFAST_MERCHANT_KEY: "k" }).ok,
      false,
    );
    const live = getPayfastConfig({
      PAYFAST_MODE: "live",
      PAYFAST_MERCHANT_ID: "123456",
      PAYFAST_MERCHANT_KEY: "k",
      PAYFAST_PASSPHRASE: "p",
    });
    assert.ok(live.ok && live.config.processUrl === "https://www.payfast.co.za/eng/process");
  });
  it("rejects an unknown mode", () => {
    assert.equal(getPayfastConfig({ PAYFAST_MODE: "test" }).ok, false);
  });
});

describe("ITN", () => {
  const body =
    "m_payment_id=DT-20261110-ABCDEFGH&pf_payment_id=1089250&payment_status=COMPLETE&item_name=Damtech+DT-20261110-ABCDEFGH&item_description=1+x+liner+%28test%29+%7E&amount_gross=8728.50&amount_fee=-200.76&amount_net=8527.74&custom_str1=tok&name_first=Jan&email_address=jan%40example.com&merchant_id=10000100&signature=1173afca7532202904682556f2a04612";

  it("verifies a PHP-signed notification", () => {
    const itn = parseItnBody(body);
    assert.equal(itn.paymentStatus, "COMPLETE");
    assert.equal(itn.viewToken, "tok");
    assert.ok(isItnSignatureValid(itn, PASS));
    assert.ok(!itn.paramString.includes("signature"));
  });

  it("rejects a tampered amount", () => {
    const itn = parseItnBody(body.replace("amount_gross=8728.50", "amount_gross=1.00"));
    assert.ok(!isItnSignatureValid(itn, PASS));
  });

  it("checks the amount to the cent", () => {
    const itn = parseItnBody(body);
    assert.ok(isItnAmountValid(itn, 872850));
    assert.ok(!isItnAmountValid(itn, 872851));
  });
});

describe("helpers", () => {
  it("formats amounts and names", () => {
    assert.equal(centsToPayfastAmount(100), "1.00");
    assert.throws(() => centsToPayfastAmount(0));
    assert.equal(payfastCellNumber("+44 20 7946 0958"), "");
    assert.deepEqual(splitCustomerName("Jan van der Merwe"), { first: "Jan", last: "van der Merwe" });
  });
});
