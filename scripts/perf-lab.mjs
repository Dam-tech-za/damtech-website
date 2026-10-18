#!/usr/bin/env node
/**
 * Repeatable lab performance probe (Playwright + Chrome DevTools Protocol).
 * Not Lighthouse: it records LCP, CLS, total blocking time (long tasks after
 * first paint, minus 50 ms each) and transfer sizes under fixed throttling.
 *
 *   node scripts/perf-lab.mjs <baseUrl> [runs] [route ...]
 *   BLOCK_THIRD_PARTY=1 … — same, with tag manager / pixel / analytics requests blocked
 *
 * Profiles:
 *   mobile  — 390×844, 4× CPU slowdown, 150 ms RTT, 1.6 Mbps down / 750 kbps up
 *   desktop — 1366×768, no CPU slowdown, 40 ms RTT, 10 Mbps down
 */
import { chromium } from "@playwright/test";

const [base = "http://127.0.0.1:3100", runsArg = "3", ...routeArgs] = process.argv.slice(2);
const runs = Number(runsArg);
const routes = routeArgs.length
  ? routeArgs
  : ["/", "/roof-waterproofing/", "/dam-liners/", "/steel-water-storage-tanks/"];

const PROFILES = {
  mobile: { viewport: { width: 390, height: 844 }, cpu: 4, latency: 150, down: 1.6e6 / 8, up: 750e3 / 8 },
  desktop: { viewport: { width: 1366, height: 768 }, cpu: 1, latency: 40, down: 10e6 / 8, up: 5e6 / 8 },
};

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const browser = await chromium.launch();
const results = [];

for (const [profileName, p] of Object.entries(PROFILES)) {
  for (const route of routes) {
    const samples = [];
    for (let i = 0; i < runs; i++) {
      const context = await browser.newContext({ viewport: p.viewport });
      const page = await context.newPage();
      if (process.env.BLOCK_THIRD_PARTY) await page.route(/googletagmanager|google-analytics|facebook|doubleclick|vercel-insights|speed-insights/, (r) => r.abort());
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: p.latency,
        downloadThroughput: p.down,
        uploadThroughput: p.up,
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: p.cpu });

      let bytes = 0;
      let jsBytes = 0;
      const types = new Map();
      cdp.on("Network.responseReceived", (e) => types.set(e.requestId, e.type));
      cdp.on("Network.loadingFinished", (e) => {
        bytes += e.encodedDataLength;
        if (types.get(e.requestId) === "Script") jsBytes += e.encodedDataLength;
      });

      await page.addInitScript(() => {
        window.__perf = { lcp: 0, cls: 0, tbt: 0, fcp: 0 };
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) window.__perf.lcp = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__perf.fcp = e.startTime;
        }).observe({ type: "paint", buffered: true });
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) {
            if (window.__perf.fcp && e.startTime > window.__perf.fcp) window.__perf.tbt += Math.max(0, e.duration - 50);
          }
        }).observe({ type: "longtask", buffered: true });
      });

      await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 120_000 });
      await page.waitForTimeout(5000);
      const m = await page.evaluate(() => window.__perf);
      samples.push({ ...m, bytes, jsBytes });
      await context.close();
    }
    const row = {
      profile: profileName,
      route,
      fcp: Math.round(median(samples.map((s) => s.fcp))),
      lcp: Math.round(median(samples.map((s) => s.lcp))),
      cls: Number(median(samples.map((s) => s.cls)).toFixed(3)),
      tbt: Math.round(median(samples.map((s) => s.tbt))),
      kb: Math.round(median(samples.map((s) => s.bytes)) / 1024),
      jsKb: Math.round(median(samples.map((s) => s.jsBytes)) / 1024),
    };
    results.push(row);
    console.log(JSON.stringify(row));
  }
}

await browser.close();
