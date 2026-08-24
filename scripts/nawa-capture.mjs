import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "/workspace/screenshots";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

const shot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, type: "png" });
  console.log("shot", name);
};

const wait = (ms) => page.waitForTimeout(ms);

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await wait(500);
await page.evaluate(() => window.__NAWA?.setDebug(false));
await shot("00-library");

await page.click('[data-testid="library-enter"]');
await page.waitForSelector('[data-testid="living-frame"]');
await wait(500);
await page.evaluate(() => window.__NAWA?.setDebug(false));
await page.evaluate(() => window.__NAWA?.setDebug(true));
await wait(80);
await shot("14-debug-true");
await page.evaluate(() => window.__NAWA?.setDebug(false));
await wait(80);
await shot("14-debug-false");
await shot("01-history");
await shot("01b-relic-closed");

await page.click('[data-testid="memory-hit"]');
await wait(50);
await shot("02-dormant");
await wait(120);

await page.click('[data-testid="discover"]');
await page.waitForSelector('[data-testid="confirm"]', { timeout: 4000 });
await wait(200);
await shot("03-confirm");

await page.click('[data-testid="confirm"]');
await wait(200);
await shot("04-opening-35");
await wait(300);
await shot("05-opening-75");
await wait(240);
await shot("06-relic-visible");

await page.click('[data-testid="relics-hit"]');
await wait(480);
await shot("07-relic-focus");

await wait(2000);
await shot("08-relic-r04");

await page.click('[data-testid="system-back"]');
await wait(450);
await shot("09-integration");

await wait(1500);
await shot("10-history-newdata");

await page.click('[data-testid="map-hit"]');
await wait(320);
await shot("11-map-preview");

await page.click('[data-testid="map-hit"]');
await wait(400);
await shot("12-map-open");

const state = await page.evaluate(() => {
  const s = window.__NAWA.getState();
  return {
    site: s.site,
    frameState: s.frameState,
    activeModule: s.activeModule,
    neyraState: s.neyraState,
    contentState: s.contentState,
    relicPhase: s.relicPhase,
    relicMode: s.relicMode,
    mapPhase: s.mapPhase,
    lastEvent: s.lastEvent,
    lastViolation: s.lastViolation,
    audio: window.__NAWA.audioActive(),
    timers: window.__NAWA.timerCount(),
  };
});
console.log(JSON.stringify(state, null, 2));

await browser.close();
