import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();

describe("favicon files and head tags", () => {
  it("publishes the supplied PNG sizes plus derived ico and apple-touch-icon", () => {
    assert.equal(existsSync(join(root, "public/favicon-32.png")), true);
    assert.equal(existsSync(join(root, "public/favicon-192.png")), true);
    assert.equal(existsSync(join(root, "public/favicon-512.png")), true);
    assert.equal(existsSync(join(root, "public/favicon.ico")), true);
    assert.equal(existsSync(join(root, "public/apple-touch-icon.png")), true);
    assert.equal(existsSync(join(root, "public/favicon.svg")), false);
  });

  it("declares the PNG, ICO and apple-touch head links", () => {
    const seo = readFileSync(join(root, "lib/seo.ts"), "utf8");
    const iconsBlock = seo.slice(seo.indexOf("icons:"), seo.indexOf("},", seo.indexOf("apple:")));
    assert.match(iconsBlock, /url: "\/favicon-32\.png"/);
    assert.match(iconsBlock, /url: "\/favicon\.ico"/);
    assert.match(iconsBlock, /sizes: "48x48"/);
    assert.match(iconsBlock, /url: "\/favicon-192\.png"/);
    assert.match(iconsBlock, /url: "\/favicon-512\.png"/);
    assert.match(iconsBlock, /url: "\/apple-touch-icon\.png"/);
    assert.doesNotMatch(iconsBlock, /favicon\.svg/);
    assert.doesNotMatch(iconsBlock, /image\/svg\+xml/);
    assert.doesNotMatch(iconsBlock, /shortcut:/);
  });
});
