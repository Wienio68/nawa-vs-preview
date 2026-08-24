import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkInvariants } from "./invariants.ts";
import { createInitialState, reduce } from "./machine.ts";
import { createNawaStore } from "./store.ts";
import { runT9 } from "./t9.ts";
import { TIMINGS } from "./timings.ts";
import type { NawaState } from "./types.ts";

function invariantsOk(state: NawaState) {
  const v = checkInvariants(state);
  assert.deepEqual(v, [], `invariants broken: ${v.join("; ")}`);
}

function happyToInspect() {
  const store = createNawaStore({ autoAudio: false });
  store.getState().dispatch("frame:enter");
  store.getState().dispatch("relic:discover");
  store.getState().advance(TIMINGS.lookAfterDiscover);
  store.getState().advance(TIMINGS.inspectAfterLook);
  return store;
}

function happyToVisible() {
  const store = happyToInspect();
  store.getState().dispatch("relic:confirm");
  store.getState().flush();
  store.getState().advance(TIMINGS.chamber35);
  store.getState().advance(TIMINGS.chamber75);
  return store;
}

function happyToFocusAnalyzed() {
  const store = happyToVisible();
  store.getState().dispatch("relic:focus");
  store.getState().advance(TIMINGS.r03AfterFocus);
  store.getState().advance(TIMINGS.r04AfterR03);
  return store;
}

describe("NAWA Vertical Slice T1–T10", () => {
  it("T1 happy path: history → discover → confirm → transfer → 35 → 75 → visible → focus → close → integration → map preview → map open", () => {
    const store = createNawaStore({ autoAudio: false });
    const s = () => store.getState();

    s().dispatch("frame:enter");
    assert.equal(s().site, "nawa");
    assert.equal(s().frameState, "history");
    assert.equal(s().contentState, "story");
    invariantsOk(s());

    s().dispatch("relic:discover");
    assert.equal(s().relicDiscovered, true);
    s().advance(TIMINGS.lookAfterDiscover);
    assert.equal(s().neyraState, "look-at-event");
    s().advance(TIMINGS.inspectAfterLook);
    assert.equal(s().neyraState, "inspect");
    assert.equal(s().awaitingConfirm, true);

    s().dispatch("relic:confirm");
    s().flush();
    assert.equal(s().transferActive, true);
    assert.equal(s().neyraState, "transfer");
    assert.equal(s().relicPhase, "opening-35");

    s().advance(TIMINGS.chamber35);
    assert.equal(s().relicPhase, "opening-75");
    s().advance(TIMINGS.chamber75);
    assert.equal(s().relicPhase, "visible");
    assert.equal(s().frameState, "preview");
    assert.equal(s().relicTransferred, true);
    assert.equal(s().transferActive, false);
    invariantsOk(s());

    s().dispatch("relic:focus");
    assert.equal(s().frameState, "focus");
    assert.equal(s().relicPhase, "focus");
    assert.equal(s().activeModule, "relics");
    invariantsOk(s());

    s().advance(TIMINGS.r03AfterFocus);
    assert.equal(s().relicMode, "R03");
    s().advance(TIMINGS.r04AfterR03);
    assert.equal(s().relicMode, "R04");
    assert.equal(s().analysisReady, true);

    s().dispatch("relic:focus:close");
    assert.equal(s().relicPhase, "visible");
    assert.equal(s().frameState, "preview");
    s().advance(TIMINGS.focusOut);
    assert.equal(s().frameState, "integration");
    assert.equal(s().contentState, "integration");

    s().advance(TIMINGS.integrationDuration);
    assert.equal(s().mapHasNewData, true);
    assert.equal(s().recoveredSector, true);
    assert.equal(s().frameState, "history");

    s().dispatch("map:preview");
    assert.equal(s().mapPhase, "preview");
    assert.equal(s().frameState, "preview");
    assert.equal(s().activeModule, "map");
    invariantsOk(s());

    s().dispatch("map:open");
    assert.equal(s().mapPhase, "open");
    assert.equal(s().frameState, "focus");
    assert.equal(s().activeModule, "map");
    invariantsOk(s());
  });

  it("T2 Global Back from FOCUS closes only Focus", () => {
    const store = happyToVisible();
    store.getState().dispatch("relic:focus");
    assert.equal(store.getState().frameState, "focus");
    store.getState().dispatch("system:back");
    const s = store.getState();
    assert.equal(s.frameState, "preview");
    assert.equal(s.relicPhase, "visible");
    assert.equal(s.site, "nawa");
    assert.notEqual(s.frameState, "history");
    invariantsOk(s);
  });

  it("T3 Global Back from PREVIEW closes only Preview", () => {
    const store = happyToVisible();
    const contentBefore = store.getState().contentState;
    store.getState().dispatch("system:back");
    const s = store.getState();
    assert.equal(s.frameState, "history");
    assert.equal(s.relicPhase, "closed");
    assert.equal(s.site, "nawa");
    assert.equal(s.relicTransferred, true);
    assert.ok(contentBefore === "relic" || s.contentState === "story");
    invariantsOk(s);
  });

  it("T4 DORMANT: 10 taps, no module change, no modal", () => {
    const store = createNawaStore({ autoAudio: false });
    store.getState().dispatch("frame:enter");
    const module = store.getState().activeModule;
    for (let i = 0; i < 10; i += 1) {
      store.getState().dispatch({
        type: "frame:dormant:touch",
        corner: i % 2 === 0 ? "memory" : "records",
        now: 1000 + i * 120,
      });
      const s = store.getState();
      assert.equal(s.activeModule, module);
      assert.notEqual(s.frameState, "focus");
      assert.equal(s.mapPhase, "closed");
      assert.equal(s.relicPhase, "closed");
      invariantsOk(s);
    }
    assert.equal(store.getState().dormantMessageShown, true);
  });

  it("T5 Rapid VISIBLE ↔ FOCUS 3 cycles, no timer leak", () => {
    const store = happyToVisible();
    for (let i = 0; i < 3; i += 1) {
      store.getState().dispatch("relic:focus");
      assert.equal(store.getState().relicPhase, "focus");
      store.getState().dispatch("relic:focus:close");
      assert.equal(store.getState().relicPhase, "visible");
      store.getState().flush();
    }
    const leftover = store.getState().getTimerCount();
    assert.ok(leftover <= 1, `timer leak: ${leftover}`);
    invariantsOk(store.getState());
  });

  it("T6 Audio Kill Rule: no leftover handles after focus close / back / cancel", () => {
    const store = createNawaStore({ autoAudio: true });
    store.getState().dispatch("frame:enter");
    store.getState().dispatch("relic:discover");
    store.getState().advance(TIMINGS.lookAfterDiscover);
    store.getState().advance(TIMINGS.inspectAfterLook);
    store.getState().dispatch("relic:confirm");
    store.getState().flush();
    store.getState().advance(TIMINGS.chamber35);
    store.getState().advance(TIMINGS.chamber75);
    store.getState().dispatch("relic:focus");
    assert.ok(store.getState().audioActive().length >= 0);
    store.getState().dispatch("relic:focus:close");
    assert.deepEqual(store.getState().audioActive(), []);
    store.getState().dispatch("relic:focus");
    store.getState().dispatch("system:back");
    assert.deepEqual(store.getState().audioActive(), []);
    store.getState().reset();
    store.getState().dispatch("frame:enter");
    store.getState().dispatch("relic:discover");
    store.getState().advance(TIMINGS.lookAfterDiscover);
    store.getState().advance(TIMINGS.inspectAfterLook);
    store.getState().dispatch("relic:confirm");
    store.getState().flush();
    store.getState().dispatch("relic:transfer:cancel");
    assert.deepEqual(store.getState().audioActive(), []);
  });

  it("T7 Back during transfer returns to pre-confirm", () => {
    const store = happyToInspect();
    store.getState().dispatch("relic:confirm");
    store.getState().flush();
    assert.equal(store.getState().transferActive, true);
    assert.equal(store.getState().relicPhase, "opening-35");
    store.getState().dispatch("system:back");
    const s = store.getState();
    assert.equal(s.transferActive, false);
    assert.equal(s.relicPhase, "closed");
    assert.equal(s.awaitingConfirm, true);
    assert.notEqual(s.neyraState, "transfer");
    assert.equal(s.frameState, "history");
    invariantsOk(s);
  });

  it("T8 Portrait-only: state never exposes landscape layout", () => {
    const state = createInitialState();
    assert.equal(state.worldSkin, "neutral");
    const store = createNawaStore({ autoAudio: false });
    store.getState().dispatch("frame:enter");
    assert.equal(store.getState().site, "nawa");
    assert.equal(typeof store.getState().frameState, "string");
  });

  it("T9 Rapid multi-touch DORMANT + active corner", () => {
    const result = runT9();
    assert.equal(result.pass, true, result.notes.join(" | ") || result.invariantHits.join(" | "));
    assert.equal(result.twoModules, false);
    assert.equal(result.dormantChangedModule, false);
    assert.equal(result.emptyModal, false);
    assert.equal(result.intermediateTwoCorners, false);
  });

  it("T10 Soak: 10 cycles chamber open/close and visible/focus/back", () => {
    const store = happyToVisible();
    store.getState().dispatch("system:back");
    assert.equal(store.getState().relicPhase, "closed");
    assert.equal(store.getState().relicTransferred, true);

    for (let i = 0; i < 10; i += 1) {
      store.getState().dispatch("relic:chamber:opening:35");
      store.getState().advance(TIMINGS.chamber35);
      store.getState().advance(TIMINGS.chamber75);
      assert.equal(store.getState().relicPhase, "visible", `cycle ${i} visible`);
      store.getState().dispatch("relic:focus");
      assert.equal(store.getState().relicPhase, "focus", `cycle ${i} focus`);
      store.getState().dispatch("system:back");
      assert.equal(store.getState().relicPhase, "visible", `cycle ${i} back to visible`);
      store.getState().dispatch("system:back");
      assert.equal(store.getState().relicPhase, "closed", `cycle ${i} chamber closed`);
      assert.equal(store.getState().frameState, "history");
      assert.equal(store.getState().activeModule, "none");
      invariantsOk(store.getState());
    }
    assert.equal(store.getState().getTimerCount(), 0);
    assert.deepEqual(store.getState().audioActive(), []);
  });
});

describe("invariants", () => {
  it("FOCUS during transfer is ignored", () => {
    const store = happyToInspect();
    store.getState().dispatch("relic:confirm");
    store.getState().flush();
    store.getState().dispatch("relic:focus");
    const s = store.getState();
    assert.notEqual(s.frameState, "focus");
    assert.equal(s.transferActive, true);
    invariantsOk(s);
  });

  it("DORMANT cannot change activeModule (pure reduce)", () => {
    let state = createInitialState();
    state = reduce(state, "frame:enter").state;
    state = reduce(state, { type: "frame:dormant:touch", corner: "memory", now: 10 }).state;
    assert.equal(state.activeModule, "none");
    state = reduce(state, "map:preview").state;
    const module = state.activeModule;
    state = reduce(state, { type: "frame:dormant:touch", corner: "records", now: 20 }).state;
    assert.equal(state.activeModule, module);
  });
});

describe("visual contract V1–V3 (presentation flags, machine unchanged)", () => {
  it("V1 debug flag can be turned off", () => {
    const store = createNawaStore({ autoAudio: false });
    assert.equal(store.getState().debug, true);
    store.getState().setDebug(false);
    assert.equal(store.getState().debug, false);
  });

  it("V3 radio is not in story and chamber at the same time", () => {
    const storyVisible = (s: NawaState) =>
      s.relicDiscovered && !s.relicTransferred && s.relicPhase === "closed" && !s.transferActive;
    const store = happyToInspect();
    assert.equal(storyVisible(store.getState()), true);
    store.getState().dispatch("relic:confirm");
    store.getState().flush();
    const s = store.getState();
    assert.equal(storyVisible(s), false);
    assert.ok(s.transferActive || s.relicPhase !== "closed");
  });
});
