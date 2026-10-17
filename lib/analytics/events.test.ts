import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyContactHref, contactEventName } from "./events.ts";

describe("contact click classification", () => {
  it("classifies phone, WhatsApp and email links", () => {
    assert.equal(classifyContactHref("tel:+27828531026"), "phone");
    assert.equal(classifyContactHref("https://wa.me/27828531026?text=Hi"), "whatsapp");
    assert.equal(classifyContactHref("https://api.whatsapp.com/send?phone=27"), "whatsapp");
    assert.equal(classifyContactHref("mailto:info@dam-tech.co.za"), "email");
  });

  it("ignores ordinary links", () => {
    assert.equal(classifyContactHref("/quote/"), null);
    assert.equal(classifyContactHref("https://www.dam-tech.co.za/"), null);
    assert.equal(classifyContactHref(null), null);
  });

  it("maps methods to event names", () => {
    assert.equal(contactEventName("phone"), "phone_click");
    assert.equal(contactEventName("whatsapp"), "whatsapp_click");
    assert.equal(contactEventName("email"), "email_click");
  });
});
