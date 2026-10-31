import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RFQ_NOTIFICATION_CC, parseEmailList } from "./config.ts";

describe("RFQ alert CC list", () => {
  it("copies Arno by default", () => {
    assert.deepEqual(parseEmailList(DEFAULT_RFQ_NOTIFICATION_CC.join(",")), ["arno@dam-tech.co.za"]);
  });
  it("splits, trims, lowercases and de-duplicates", () => {
    assert.deepEqual(parseEmailList(" Arno@dam-tech.co.za; x@y.co.za ,arno@dam-tech.co.za,"), [
      "arno@dam-tech.co.za",
      "x@y.co.za",
    ]);
  });
  it("drops the main recipient and junk", () => {
    assert.deepEqual(parseEmailList("info@dam-tech.co.za, nope", ["INFO@dam-tech.co.za"]), []);
  });
});
