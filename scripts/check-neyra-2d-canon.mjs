import assert from "node:assert/strict";
import fs from "node:fs";

const layer = fs.readFileSync("src/components/nawa/NeyraLayer.tsx", "utf8");
const frame = fs.readFileSync("src/components/nawa/LivingFrame.tsx", "utf8");
const app = fs.readFileSync("src/components/nawa/NawaApp.tsx", "utf8");
const asset = fs.readFileSync("src/lib/nawa/assets.ts", "utf8");
const docs = fs.readFileSync("docs/NEYRA_NAWA_2D_CANON_V1.md", "utf8");

assert.match(frame, /<NeyraLayer \/>/, "Neyra must remain within NAWA's LivingFrame");
assert.match(app, /LivingFrame/, "Neyra must remain in the NAWA app");
assert.match(layer, /NEYRA_CANON_FRONT_1000014081\.mp4/);
assert.match(layer, /NEYRA_CANON_TURN_1000014021\.mp4/);
assert.match(layer, /prefers-reduced-motion/);
assert.match(layer, /onError/);
assert.match(layer, /nawaAssets\.neyraIdle/, "Static fallback must remain");
assert.match(layer, /playsInline/);
assert.match(layer, /muted/);
assert.match(docs, /Nie dodawać do.*czytnika/);
assert.match(docs, /218dd905965f5d1fb88894eef637cfe25774e21ac463c272c3d0b7917c5b1c57/);
assert.match(docs, /1676e98c4b4cfcfd06afe159e64b97e7244d15b72b20210d8135615fda18087e/);
assert.match(asset, /NEYRA_FRONT_RUNTIME\.webp/);
for (const filename of ["NEYRA_CANON_FRONT_1000014081.mp4", "NEYRA_CANON_TURN_1000014021.mp4"]) {
  const target = "public/assets/nawa/neyra/" + filename;
  assert.equal(fs.existsSync(target), false, "Binary media must not be slipped into the unapproved code-only branch: " + target);
}
console.log("NAWA identity scope, approved references, fallback and video-slot QA: PASS");
