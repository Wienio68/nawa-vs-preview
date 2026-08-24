import type { NawaState } from "./types.ts";

export const INVARIANT = {
  oneFocusModule: "INV1: only one activeModule may be in FOCUS",
  transferBlocksFocus: "INV2: neyraState=transfer blocks FOCUS",
  transferFocusExclusive: "INV3: transfer and focus are mutually exclusive",
  dormantNoModule: "INV4: DORMANT must not change activeModule",
  backKeepsContent: "INV5: Global Back from FOCUS/PREVIEW must not reset contentState",
  backRestoresStage: "INV6: Back restores the previous Stage",
  noFocusDuringTransfer: "INV7: FOCUS cannot open during transfer",
  noTwoCorners: "INV8: no intermediate state with two active corners",
} as const;

export function relicsOrganOpen(state: NawaState): boolean {
  return state.relicPhase !== "closed";
}

export function mapOrganOpen(state: NawaState): boolean {
  return state.mapPhase !== "closed";
}

export function checkInvariants(state: NawaState): string[] {
  const violations: string[] = [];

  if (state.frameState === "focus") {
    if (state.activeModule === "none") {
      violations.push(INVARIANT.oneFocusModule);
    }
  }

  if (state.neyraState === "transfer" && state.frameState === "focus") {
    violations.push(INVARIANT.transferFocusExclusive);
  }

  if (state.neyraState === "transfer" && state.relicPhase === "focus") {
    violations.push(INVARIANT.transferBlocksFocus);
    violations.push(INVARIANT.noFocusDuringTransfer);
  }

  if (state.transferActive && state.frameState === "focus") {
    violations.push(INVARIANT.transferFocusExclusive);
    violations.push(INVARIANT.noFocusDuringTransfer);
  }

  if (relicsOrganOpen(state) && mapOrganOpen(state)) {
    violations.push(INVARIANT.noTwoCorners);
  }

  if (state.activeModule === "relics" && state.mapPhase !== "closed") {
    violations.push(INVARIANT.oneFocusModule);
  }
  if (state.activeModule === "map" && state.relicPhase !== "closed") {
    violations.push(INVARIANT.oneFocusModule);
  }

  return violations;
}

export function logViolations(state: NawaState, extra?: string): NawaState {
  const found = checkInvariants(state);
  if (extra) found.push(extra);
  if (found.length === 0) {
    return { ...state, lastViolation: null };
  }
  return {
    ...state,
    lastViolation: found[0] ?? null,
    violationLog: [...state.violationLog, ...found],
  };
}

export function wouldOpenSecondCorner(
  state: NawaState,
  module: "relics" | "map",
): boolean {
  if (module === "relics") {
    return mapOrganOpen(state) || state.activeModule === "map";
  }
  return relicsOrganOpen(state) || state.activeModule === "relics";
}
