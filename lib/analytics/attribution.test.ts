import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFirstTouch,
  describeLeadSource,
  parseLeadAttribution,
  sanitisePath,
  sanitiseReferrer,
} from "./attribution.ts";

describe("lead attribution", () => {
  it("captures landing page, external referrer and campaign tags", () => {
    const record = buildFirstTouch(
      "https://www.dam-tech.co.za/waterproofing/?utm_source=google&utm_medium=cpc&gclid=abc123&email=x@y.z",
      "https://www.google.com/search?q=waterproofing+pretoria",
      "https://www.dam-tech.co.za",
      new Date("2026-10-17T10:00:00Z"),
    );
    assert.deepEqual(record, {
      landing_page: "/waterproofing/",
      captured_at: "2026-10-17T10:00:00.000Z",
      referrer: "https://www.google.com/search",
      utm_source: "google",
      utm_medium: "cpc",
      gclid: "abc123",
    });
  });

  it("ignores internal referrers", () => {
    const record = buildFirstTouch(
      "https://www.dam-tech.co.za/quote/",
      "https://www.dam-tech.co.za/dam-liners/",
      "https://www.dam-tech.co.za",
    );
    assert.equal(record.referrer, undefined);
  });

  it("parses only allowed keys and strips unsafe values", () => {
    const parsed = parseLeadAttribution(
      JSON.stringify({
        landing_page: "/hdpe-dam-lining/?email=someone@example.com",
        form_page: "https://evil.example/",
        referrer: "javascript:alert(1)",
        utm_source: "<script>google</script>",
        password: "nope",
        captured_at: "not a date",
      }),
    );
    assert.deepEqual(parsed, {
      landing_page: "/hdpe-dam-lining/",
      utm_source: "scriptgoogle/script",
    });
  });

  it("returns undefined for empty, invalid or oversized input", () => {
    assert.equal(parseLeadAttribution(""), undefined);
    assert.equal(parseLeadAttribution("{not json"), undefined);
    assert.equal(parseLeadAttribution("[1,2]"), undefined);
    assert.equal(parseLeadAttribution(JSON.stringify({ x: "y" })), undefined);
    assert.equal(parseLeadAttribution("x".repeat(5000)), undefined);
    assert.equal(parseLeadAttribution(null), undefined);
  });

  it("sanitises paths and referrers", () => {
    assert.equal(sanitisePath("//evil.example/path"), "");
    assert.equal(sanitisePath("/contact/#form"), "/contact/");
    assert.equal(sanitiseReferrer("ftp://example.com/x"), "");
    assert.equal(sanitiseReferrer("https://www.bing.com/search?q=dam"), "https://www.bing.com/search");
  });
});

describe("describeLeadSource", () => {
  it("returns nothing for missing or malformed input", () => {
    assert.deepEqual(describeLeadSource(undefined), []);
    assert.deepEqual(describeLeadSource("x"), []);
    assert.deepEqual(describeLeadSource([]), []);
  });

  it("describes a residential regional enquiry from a Google Ads click", () => {
    const rows = describeLeadSource({
      landing_page: "/waterproofing-overstrand/",
      form_page: "/quote/",
      referrer: "https://www.google.com/search",
      utm_source: "google",
      utm_medium: "cpc",
      gclid: "abc",
    });
    assert.deepEqual(rows, [
      { label: "First page visited", value: "/waterproofing-overstrand/" },
      { label: "Region hint", value: "Overstrand, Western Cape (residential page)" },
      { label: "Form submitted from", value: "/quote/" },
      { label: "Came from", value: "https://www.google.com/search" },
      { label: "Campaign", value: "google · cpc" },
      { label: "Ad click", value: "Google Ads" },
    ]);
  });

  it("marks direct traffic and skips a form page equal to the landing page", () => {
    assert.deepEqual(describeLeadSource({ landing_page: "/quote/", form_page: "/quote/" }), [
      { label: "First page visited", value: "/quote/" },
      { label: "Came from", value: "Direct / unknown" },
    ]);
  });
});
