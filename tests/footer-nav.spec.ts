import { expect, test, type Page } from "@playwright/test";

const FOOTER_LINKS = [
  { label: "About", path: "/about-us-waterproofing-company/" },
  { label: "Projects", path: "/projects/" },
  { label: "Calculators", path: "/calculators/" },
  { label: "FAQ", path: "/faq/" },
  { label: "Blog", path: "/blog/" },
  { label: "Contact", path: "/contact/" },
  { label: "Privacy", path: "/privacy/" },
  { label: "Terms", path: "/terms/" },
  { label: "Returns", path: "/returns/" },
] as const;

const VIEWPORTS = [
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "360x800", width: 360, height: 800 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
] as const;

type Sample = {
  ms: number;
  pathname: string;
  scrollY: number;
  h1: string | null;
  centerTag: string | null;
};

async function waitForScrollStop(page: Page) {
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        let last = window.scrollY;
        let stable = 0;
        const tick = () => {
          if (window.scrollY === last) {
            stable += 1;
          } else {
            stable = 0;
            last = window.scrollY;
          }
          if (stable >= 3) {
            resolve(true);
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        window.setTimeout(() => resolve(true), 3000);
      }),
  );
}

async function measureFooterClick(
  page: Page,
  label: string,
  expectedPath: string,
): Promise<{
  ready: Awaited<ReturnType<typeof prepareFooterLink>>;
  samples: Sample[];
  navigationMs: number;
  errors: string[];
}> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(250);

  const ready = await prepareFooterLink(page, label);
  expect(ready.hitTarget, `elementFromPoint for ${label}`).toBeTruthy();

  const clickStart = await page.evaluate((linkLabel) => {
    const link = [...document.querySelectorAll("#site-footer a")].find(
      (a) => a.textContent?.trim() === linkLabel,
    ) as HTMLAnchorElement | undefined;
    if (!link) throw new Error(`Missing footer link: ${linkLabel}`);
    const started = Date.now();
    link.click();
    return started;
  }, label);

  const offsets = [0, 16, 50, 100, 250, 500, 1000, 2000];
  const samplesPromise = (async () => {
    const samples: Sample[] = [];
    for (const offset of offsets) {
      const elapsed = Date.now() - clickStart;
      if (elapsed < offset) {
        await page.waitForTimeout(offset - elapsed);
      }
      samples.push(await readSample(page));
    }
    return samples;
  })();

  const [samples] = await Promise.all([
    samplesPromise,
    page.waitForURL(`**${expectedPath}**`, { timeout: 15000 }),
  ]);

  const navigationMs = Date.now() - clickStart;
  expect(page.url()).toContain(expectedPath);

  return { ready, samples, navigationMs, errors };
}

async function prepareFooterLink(page: Page, label: string) {
  await page.evaluate((linkLabel) => {
    const link = [...document.querySelectorAll("#site-footer a")].find(
      (a) => a.textContent?.trim() === linkLabel,
    ) as HTMLAnchorElement | undefined;
    if (!link) throw new Error(`Missing footer link: ${linkLabel}`);
    link.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  }, label);

  await waitForScrollStop(page);

  return page.evaluate((linkLabel) => {
    const link = [...document.querySelectorAll("#site-footer a")].find(
      (a) => a.textContent?.trim() === linkLabel,
    ) as HTMLAnchorElement | undefined;
    if (!link) {
      return {
        scrollY: window.scrollY,
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        hitTarget: false,
        centerTag: null,
        stickyHidden: null,
      };
    }

    const rect = link.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    const sticky = document.querySelector('[aria-label="Quick contact"]');

    return {
      scrollY: window.scrollY,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      hitTarget: hit === link || !!link.contains(hit),
      centerTag: hit?.tagName?.toLowerCase() ?? null,
      stickyHidden:
        sticky instanceof HTMLElement
          ? sticky.getAttribute("aria-hidden") === "true" ||
            getComputedStyle(sticky).pointerEvents === "none"
          : null,
    };
  }, label);
}

async function readSample(page: Page): Promise<Sample> {
  return page.evaluate(() => {
    const center = document.elementFromPoint(
      window.innerWidth / 2,
      Math.min(window.innerHeight / 2, 120),
    );
    return {
      ms: performance.now(),
      pathname: location.pathname,
      scrollY: window.scrollY,
      h1: document.querySelector("h1")?.textContent?.trim() ?? null,
      centerTag: center?.tagName?.toLowerCase() ?? null,
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`footer About navigation ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    const result = await measureFooterClick(
      page,
      "About",
      "/about-us-waterproofing-company/",
    );

    expect(result.ready.hitTarget, `elementFromPoint for About @ ${viewport.name}`).toBeTruthy();
    expect(result.samples.at(-1)?.scrollY ?? 9999).toBeLessThan(50);
    expect(result.samples.at(-1)?.h1).toContain("About");
    expect(result.samples[5]?.scrollY ?? 9999).toBeLessThan(50);
  });
}

test("footer company links desktop 1440x900", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const link of FOOTER_LINKS) {
    const result = await measureFooterClick(page, link.label, link.path);
    expect(result.ready.hitTarget, `elementFromPoint for ${link.label}`).toBeTruthy();
    expect(result.samples.at(-1)?.scrollY ?? 9999).toBeLessThan(50);
    expect(result.samples[5]?.scrollY ?? 9999).toBeLessThan(50);
  }
});
