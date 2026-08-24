import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080/";
const OUT = "/workspace/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector("[data-testid=library-enter]");
await page.screenshot({ path: `${OUT}/vs-library.png` });

await page.click("[data-testid=library-enter]");
await page.waitForSelector("[data-testid=living-frame]");
await page.waitForFunction(() => window.__NAWA);
await page.screenshot({ path: `${OUT}/vs-history.png` });
await page.screenshot({ path: `${OUT}/vs-relic-closed.png` });

await page.click("[data-testid=memory-hit]");
await page.waitForTimeout(50);
await page.screenshot({ path: `${OUT}/vs-dormant.png` });

await page.click("[data-testid=discover]");
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/vs-confirm.png` });
await page.click("[data-testid=confirm]");
await page.waitForSelector('[data-relic="opening-35"]');
await page.screenshot({ path: `${OUT}/vs-opening-35.png` });
await page.waitForSelector('[data-relic="opening-75"]');
await page.screenshot({ path: `${OUT}/vs-opening-75.png` });
await page.waitForSelector('[data-relic="visible"]');
await page.screenshot({ path: `${OUT}/vs-relic-visible.png` });

await page.evaluate(() => window.__NAWA.dispatch("relic:focus"));
await page.waitForTimeout(480);
await page.screenshot({ path: `${OUT}/vs-relic-focus.png` });

await page.evaluate(() => {
  window.__NAWA.dispatch("relic:analyze:r03");
  window.__NAWA.dispatch("relic:analyze:r04");
  window.__NAWA.dispatch("relic:focus:close");
});
await page.waitForTimeout(450);
await page.screenshot({ path: `${OUT}/vs-integration.png` });
await page.waitForTimeout(1500);
await page.evaluate(() => window.__NAWA.dispatch("map:preview"));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/vs-map-preview.png` });
await page.evaluate(() => window.__NAWA.dispatch("map:open"));
await page.waitForTimeout(380);
await page.screenshot({ path: `${OUT}/vs-map-open.png` });

const t2 = await page.evaluate(() => {
  window.__NAWA.dispatch("system:back");
  const s = window.__NAWA.getState();
  return { frameState: s.frameState, mapPhase: s.mapPhase };
});
const t9 = await page.evaluate(() => {
  const before = window.__NAWA.getState().activeModule;
  for (let i = 0; i < 10; i++) {
    window.__NAWA.dispatch({ type: "frame:dormant:touch", corner: "memory", now: Date.now() });
    window.__NAWA.dispatch({ type: "frame:dormant:touch", corner: "records", now: Date.now() });
  }
  const after = window.__NAWA.getState();
  return {
    before,
    after: after.activeModule,
    audio: window.__NAWA.audioActive(),
    violations: window.__NAWA.violationLog(),
  };
});

await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/vs-landscape.png` });
const landscape = await page.evaluate(() => {
  const shell = document.querySelector(".portrait-shell");
  const r = shell.getBoundingClientRect();
  return { w: r.width, h: r.height, overflowX: document.documentElement.scrollWidth > 844 + 2 };
});

await page.setViewportSize({ width: 390, height: 844 });
await page.click("[data-testid=system-back]");
await page.waitForTimeout(200);

console.log(
  JSON.stringify(
    {
      errors,
      t2,
      t9,
      landscape,
      audioAfterBack: await page.evaluate(() => window.__NAWA.audioActive()),
    },
    null,
    2,
  ),
);

await browser.close();
if (errors.length) process.exit(1);
