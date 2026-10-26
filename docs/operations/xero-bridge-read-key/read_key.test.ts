// Node test for the read-only key (node --experimental-strip-types --test).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { accessFor, createApp } from "./app.ts";

const calls: string[] = [];
const fakeXero = {
  status: async () => ({ connected: true }),
  get: async (path: string) => { calls.push(`GET ${path}`); return { Quotes: [], Invoices: [], Contacts: [] }; },
  post: async (path: string) => { calls.push(`POST ${path}`); return {}; },
  put: async (path: string) => { calls.push(`PUT ${path}`); return {}; },
  keepalive: async () => true,
};
const ctx = { xero: fakeXero, replyTo: "info@example.test" } as never;
const app = createApp({ basePath: "/xero-bridge", apiKey: "FULL-KEY", adminKey: "ADMIN", writeMode: "full", readApiKey: "READ-KEY" }, ctx);
const req = (path: string, key: string | null, init: RequestInit = {}) =>
  app.fetch(new Request(`http://x/xero-bridge${path}`, { ...init, headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), "Content-Type": "application/json" } }));

describe("read-only bridge key", () => {
  it("classifies keys", () => {
    assert.equal(accessFor("Bearer FULL-KEY", { apiKey: "FULL-KEY", readApiKey: "READ-KEY" }), "full");
    assert.equal(accessFor("Bearer READ-KEY", { apiKey: "FULL-KEY", readApiKey: "READ-KEY" }), "read");
    assert.equal(accessFor("Bearer nope", { apiKey: "FULL-KEY", readApiKey: "READ-KEY" }), null);
    assert.equal(accessFor("Bearer SAME", { apiKey: "SAME", readApiKey: "SAME" }), "full");
    assert.equal(accessFor("Bearer READ-KEY", { apiKey: "FULL-KEY" }), null);
  });

  it("lets the read key run read tools", async () => {
    const r = await req("/api/get_quotes", "READ-KEY", { method: "POST", body: JSON.stringify({ status: "ACCEPTED" }) });
    assert.equal(r.status, 200);
  });

  it("refuses every write tool for the read key, before calling Xero", async () => {
    calls.length = 0;
    for (const tool of ["send_invoice", "create_payment", "void_invoice", "create_quote", "create_contact", "send_quote"]) {
      const r = await req(`/api/${tool}`, "READ-KEY", { method: "POST", body: "{}" });
      assert.equal(r.status, 403, tool);
    }
    assert.deepEqual(calls.filter((c) => !c.startsWith("GET")), []);
  });

  it("still lets the main key reach write tools", async () => {
    const r = await req("/api/create_contact", "FULL-KEY", { method: "POST", body: "{}" });
    assert.notEqual(r.status, 403);
    assert.notEqual(r.status, 401);
  });

  it("lists only read tools and reports read mode for the read key", async () => {
    const tools = (await (await req("/api/tools", "READ-KEY")).json()) as { mode: string }[];
    assert.ok(tools.length > 10);
    assert.ok(tools.every((t) => t.mode === "read"));
    const status = (await (await req("/api/status", "READ-KEY")).json()) as { write_mode: string };
    assert.equal(status.write_mode, "read");
  });

  it("keeps keepalive on the main key only", async () => {
    assert.equal((await req("/keepalive", "READ-KEY", { method: "POST" })).status, 401);
    assert.equal((await req("/keepalive", "FULL-KEY", { method: "POST" })).status, 200);
  });

  it("offers only read tools over MCP to the read key", async () => {
    const r = await app.fetch(new Request("http://x/xero-bridge/mcp", {
      method: "POST",
      headers: { Authorization: "Bearer READ-KEY", "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    }));
    const body = await r.json() as { result: { tools: { name: string }[] } };
    const names = body.result.tools.map((t) => t.name);
    assert.ok(names.includes("get_quotes"));
    assert.ok(!names.includes("send_invoice"));
    assert.ok(!names.includes("create_payment"));
  });

  it("rejects missing keys", async () => {
    assert.equal((await req("/api/get_quotes", null, { method: "POST", body: "{}" })).status, 401);
  });
});
