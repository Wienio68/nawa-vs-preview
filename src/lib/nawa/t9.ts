import { isDormant } from "./corners.ts";
import { checkInvariants } from "./invariants.ts";
import { createNawaStore, type NawaStore } from "./store.ts";
import type { CornerId, NawaEvent } from "./types.ts";
import type { StoreApi } from "zustand/vanilla";

export interface T9Result {
  pass: boolean;
  taps: number;
  twoModules: boolean;
  dormantChangedModule: boolean;
  emptyModal: boolean;
  intermediateTwoCorners: boolean;
  invariantHits: string[];
  notes: string[];
}

function tapCorner(store: StoreApi<NawaStore>, corner: CornerId, now: number) {
  const s = store.getState();
  if (isDormant(corner)) {
    store.getState().dispatch({ type: "frame:dormant:touch", corner, now });
    return;
  }
  if (corner === "map") {
    if (s.mapPhase === "preview") store.getState().dispatch("map:open");
    else store.getState().dispatch("map:preview");
    return;
  }
  if (corner === "relics") {
    if (s.relicPhase === "visible") store.getState().dispatch("relic:focus");
    else if (s.relicPhase === "closed" && s.relicTransferred) {
      store.getState().dispatch("relic:chamber:opening:35");
    }
  }
}

export function runT9(
  store: StoreApi<NawaStore> = createNawaStore({ autoAudio: false }),
): T9Result {
  store.getState().reset();
  store.getState().dispatch("frame:enter");

  const notes: string[] = [];
  let twoModules = false;
  let dormantChangedModule = false;
  let emptyModal = false;
  let intermediateTwoCorners = false;
  const invariantHits: string[] = [];

  const sequence: CornerId[] = [];
  for (let i = 0; i < 12; i += 1) {
    sequence.push("memory", "map", "records", "relics");
  }

  let now = 1_000;
  for (const corner of sequence) {
    const before = store.getState().activeModule;
    tapCorner(store, corner, now);
    now += 8;
    store.getState().flush();
    const after = store.getState();

    if (isDormant(corner) && after.activeModule !== before) {
      dormantChangedModule = true;
      notes.push(`DORMANT ${corner} changed activeModule ${before} → ${after.activeModule}`);
    }

    const relicsOpen = after.relicPhase !== "closed";
    const mapOpen = after.mapPhase !== "closed";
    if (relicsOpen && mapOpen) {
      intermediateTwoCorners = true;
      twoModules = true;
      notes.push("Two organs open simultaneously");
    }
    if (after.frameState === "focus" && after.activeModule === "none") {
      emptyModal = true;
      notes.push("Focus with no module (empty modal)");
    }
    const inv = checkInvariants(after);
    invariantHits.push(...inv);
  }

  const taps = sequence.length;
  const pass =
    !twoModules &&
    !dormantChangedModule &&
    !emptyModal &&
    !intermediateTwoCorners &&
    invariantHits.length === 0;

  return {
    pass,
    taps,
    twoModules,
    dormantChangedModule,
    emptyModal,
    intermediateTwoCorners,
    invariantHits,
    notes,
  };
}

export function dormantEvent(corner: CornerId, now = Date.now()): NawaEvent {
  return { type: "frame:dormant:touch", corner, now };
}
