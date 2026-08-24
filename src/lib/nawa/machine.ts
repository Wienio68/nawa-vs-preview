import { COPY } from "./copy.ts";
import {
  INVARIANT,
  logViolations,
  mapOrganOpen,
  relicsOrganOpen,
  wouldOpenSecondCorner,
} from "./invariants.ts";
import { TIMINGS } from "./timings.ts";
import type {
  NawaEvent,
  NawaEventName,
  NawaState,
  PreConfirmSnapshot,
  ReduceEffect,
  ReduceResult,
  StageSnapshot,
} from "./types.ts";

const NONE_EFFECT: ReduceEffect = {
  audio: "none",
  motion: null,
  durationMs: 0,
  haptic: "none",
  followUp: null,
};

export function createInitialState(): NawaState {
  return {
    site: "library",
    frameState: "idle",
    activeModule: "none",
    neyraState: "idle",
    contentState: "story",
    worldSkin: "neutral",
    relicPhase: "closed",
    relicMode: "R01",
    relicDiscovered: false,
    relicTransferred: false,
    awaitingConfirm: false,
    transferActive: false,
    mapPhase: "closed",
    mapHasNewData: false,
    recoveredSector: false,
    analysisR03: false,
    analysisR04: false,
    analysisReady: false,
    dormantPulseCorner: null,
    dormantPulseUntil: 0,
    dormantMessageShown: false,
    lastEvent: null,
    lastIgnored: false,
    lastViolation: null,
    violationLog: [],
    preConfirm: null,
    stageStack: [],
    muted: false,
    debug: true,
    captionsOn: false,
    neyraLine: null,
    storyBeat: 0,
  };
}

export function snapshotStage(state: NawaState): StageSnapshot {
  return {
    frameState: state.frameState,
    activeModule: state.activeModule,
    contentState: state.contentState,
    relicPhase: state.relicPhase,
    mapPhase: state.mapPhase,
    neyraState: state.neyraState,
  };
}

export function snapshotPreConfirm(state: NawaState): PreConfirmSnapshot {
  return {
    frameState: state.frameState,
    activeModule: state.activeModule,
    neyraState: state.neyraState,
    contentState: state.contentState,
    relicPhase: state.relicPhase,
    relicMode: state.relicMode,
    awaitingConfirm: state.awaitingConfirm,
    transferActive: state.transferActive,
    site: state.site,
  };
}

function restorePreConfirm(state: NawaState): NawaState {
  const snap = state.preConfirm;
  if (!snap) {
    return {
      ...state,
      transferActive: false,
      neyraState: "inspect",
      awaitingConfirm: true,
      relicPhase: "closed",
      frameState: "history",
      activeModule: "none",
    };
  }
  return {
    ...state,
    frameState: snap.frameState,
    activeModule: snap.activeModule,
    neyraState: snap.neyraState === "transfer" ? "inspect" : snap.neyraState,
    contentState: snap.contentState,
    relicPhase: "closed",
    relicMode: snap.relicMode,
    awaitingConfirm: true,
    transferActive: false,
    site: snap.site,
  };
}

function pushStage(state: NawaState): NawaState {
  const top = state.stageStack[state.stageStack.length - 1];
  const next = snapshotStage(state);
  if (
    top &&
    top.frameState === next.frameState &&
    top.activeModule === next.activeModule &&
    top.relicPhase === next.relicPhase &&
    top.mapPhase === next.mapPhase
  ) {
    return state;
  }
  return { ...state, stageStack: [...state.stageStack, next] };
}

function applyRestore(state: NawaState, snap: StageSnapshot): NawaState {
  return {
    ...state,
    frameState: snap.frameState,
    activeModule: snap.activeModule,
    contentState: snap.contentState,
    relicPhase: snap.relicPhase,
    mapPhase: snap.mapPhase,
    neyraState: snap.neyraState === "transfer" ? "idle" : snap.neyraState,
  };
}

function popStage(state: NawaState): { state: NawaState; restored: StageSnapshot | null } {
  if (state.stageStack.length === 0) {
    return { state, restored: null };
  }
  const stack = state.stageStack.slice(0, -1);
  const restored = state.stageStack[state.stageStack.length - 1] ?? null;
  return { state: { ...state, stageStack: stack }, restored };
}

function tagged(state: NawaState, type: NawaEventName, ignored: boolean): NawaState {
  return {
    ...state,
    lastEvent: type,
    lastIgnored: ignored,
    dormantPulseCorner: ignored ? state.dormantPulseCorner : state.dormantPulseCorner,
  };
}

function applied(
  state: NawaState,
  type: NawaEventName,
  effect: Partial<ReduceEffect> = {},
): ReduceResult {
  const next = logViolations(tagged(state, type, false));
  return {
    state: next,
    effect: { ...NONE_EFFECT, ...effect },
    applied: true,
  };
}

function ignored(state: NawaState, type: NawaEventName, violation?: string): ReduceResult {
  const next = violation
    ? logViolations(tagged(state, type, true), violation)
    : tagged(state, type, true);
  return { state: next, effect: { ...NONE_EFFECT }, applied: false };
}

export function normalizeEvent(event: NawaEvent | NawaEventName): NawaEvent {
  if (typeof event === "string") return { type: event };
  return event;
}

function cancelTransfer(state: NawaState, type: NawaEventName): ReduceResult {
  const restored = restorePreConfirm(state);
  return applied(
    {
      ...restored,
      transferActive: false,
      relicPhase: "closed",
      awaitingConfirm: true,
      neyraState: restored.neyraState === "idle" ? "inspect" : restored.neyraState,
      neyraLine: COPY.neyraInspect,
    },
    type,
    { audio: "kill", motion: "transfer-cancel", durationMs: 160 },
  );
}

function analysisFollowUp(state: NawaState): ReduceEffect["followUp"] {
  if (!state.analysisR03) {
    return { event: "relic:analyze:r03", delayMs: TIMINGS.r03AfterFocus };
  }
  if (!state.analysisR04) {
    return { event: "relic:analyze:r04", delayMs: TIMINGS.r04AfterR03 };
  }
  return null;
}

export function reduce(state: NawaState, event: NawaEvent | NawaEventName): ReduceResult {
  const ev = normalizeEvent(event);
  const type = ev.type;
  const now = ev.now ?? 0;

  switch (type) {
    case "frame:enter": {
      if (state.site === "nawa" && state.frameState !== "idle") {
        return ignored(state, type);
      }
      return applied(
        {
          ...state,
          site: "nawa",
          frameState: "history",
          contentState: "story",
          activeModule: "none",
          neyraState: "idle",
          neyraLine: null,
        },
        type,
        { motion: "enter-nawa", durationMs: 480 },
      );
    }

    case "relic:discover": {
      if (state.site !== "nawa" || state.relicDiscovered || state.transferActive) {
        return ignored(state, type);
      }
      return applied(
        {
          ...state,
          relicDiscovered: true,
          storyBeat: Math.max(state.storyBeat, 1),
          neyraLine: COPY.historyDiscover,
        },
        type,
        {
          motion: "discover",
          durationMs: 280,
          haptic: "light",
          followUp: { event: "neyra:look:relic", delayMs: TIMINGS.lookAfterDiscover },
        },
      );
    }

    case "neyra:look:relic": {
      if (!state.relicDiscovered || state.transferActive || state.relicTransferred) {
        return ignored(state, type);
      }
      return applied(
        {
          ...state,
          neyraState: "look-at-event",
          neyraLine: COPY.neyraLook,
        },
        type,
        {
          motion: "neyra-look",
          durationMs: 360,
          followUp: { event: "neyra:inspect", delayMs: TIMINGS.inspectAfterLook },
        },
      );
    }

    case "neyra:inspect": {
      if (!state.relicDiscovered || state.transferActive || state.relicTransferred) {
        return ignored(state, type);
      }
      return applied(
        {
          ...state,
          neyraState: "inspect",
          awaitingConfirm: true,
          preConfirm: snapshotPreConfirm({
            ...state,
            neyraState: "inspect",
            awaitingConfirm: true,
          }),
          neyraLine: COPY.neyraInspect,
        },
        type,
        { motion: "neyra-inspect", durationMs: 320 },
      );
    }

    case "relic:confirm": {
      if (!state.awaitingConfirm || state.transferActive || state.relicTransferred) {
        return ignored(state, type);
      }
      if (state.frameState === "focus") {
        return ignored(state, type, INVARIANT.noFocusDuringTransfer);
      }
      return applied(
        {
          ...state,
          awaitingConfirm: false,
          preConfirm: state.preConfirm ?? snapshotPreConfirm(state),
        },
        type,
        {
          motion: "confirm",
          durationMs: 140,
          haptic: "light",
          followUp: { event: "relic:transfer:start", delayMs: 0 },
        },
      );
    }

    case "relic:transfer:start": {
      if (state.relicTransferred && !state.awaitingConfirm) {
        return ignored(state, type);
      }
      if (state.transferActive) return ignored(state, type);
      if (state.frameState === "focus" || state.relicPhase === "focus") {
        const cancelled = cancelTransfer(state, "relic:transfer:cancel");
        return {
          ...cancelled,
          state: logViolations(cancelled.state, INVARIANT.transferFocusExclusive),
        };
      }
      return applied(
        {
          ...state,
          transferActive: true,
          awaitingConfirm: false,
          neyraState: "transfer",
          neyraLine: COPY.neyraTransfer,
          preConfirm: state.preConfirm ?? snapshotPreConfirm(state),
        },
        type,
        {
          motion: "transfer-start",
          durationMs: 180,
          followUp: { event: "neyra:transfer", delayMs: 0 },
        },
      );
    }

    case "neyra:transfer": {
      if (!state.transferActive) return ignored(state, type);
      return applied(
        {
          ...state,
          neyraState: "transfer",
          neyraLine: COPY.neyraTransfer,
        },
        type,
        {
          motion: "neyra-transfer",
          durationMs: 200,
          followUp: { event: "relic:chamber:opening:35", delayMs: 0 },
        },
      );
    }

    case "relic:transfer:cancel": {
      if (!state.transferActive && !state.awaitingConfirm && state.relicPhase === "closed") {
        return ignored(state, type);
      }
      return cancelTransfer(state, type);
    }

    case "relic:chamber:opening:35": {
      if (state.relicPhase !== "closed" && state.relicPhase !== "opening-35") {
        return ignored(state, type);
      }
      if (!state.transferActive && !state.relicTransferred) return ignored(state, type);
      if (wouldOpenSecondCorner(state, "relics")) {
        return ignored(state, type, INVARIANT.noTwoCorners);
      }
      if (state.frameState === "focus") {
        return ignored(state, type, INVARIANT.noFocusDuringTransfer);
      }
      const pushed =
        state.frameState === "history" || state.frameState === "idle"
          ? pushStage({ ...state, frameState: "history", activeModule: "none" })
          : state;
      return applied(
        {
          ...pushed,
          relicPhase: "opening-35",
          activeModule: "relics",
        },
        type,
        {
          motion: "chamber-35",
          durationMs: TIMINGS.chamber35,
          followUp: { event: "relic:chamber:opening:75", delayMs: TIMINGS.chamber35 },
        },
      );
    }

    case "relic:chamber:opening:75": {
      if (state.relicPhase !== "opening-35" && state.relicPhase !== "opening-75") {
        return ignored(state, type);
      }
      return applied(
        {
          ...state,
          relicPhase: "opening-75",
          activeModule: "relics",
        },
        type,
        {
          motion: "chamber-75",
          durationMs: TIMINGS.chamber75,
          followUp: { event: "relic:visible", delayMs: TIMINGS.chamber75 },
        },
      );
    }

    case "relic:visible": {
      if (state.relicPhase !== "opening-75" && state.relicPhase !== "visible") {
        return ignored(state, type);
      }
      return applied(
        {
          ...state,
          relicPhase: "visible",
          relicTransferred: true,
          transferActive: false,
          awaitingConfirm: false,
          neyraState: state.neyraState === "transfer" ? "idle" : state.neyraState,
          frameState: "preview",
          activeModule: "relics",
          contentState: "relic",
          neyraLine: null,
        },
        type,
        {
          audio: "radio-start",
          motion: "chamber-visible",
          durationMs: TIMINGS.chamberVisible,
        },
      );
    }

    case "relic:focus": {
      if (state.transferActive || state.neyraState === "transfer") {
        return ignored(state, type, INVARIANT.noFocusDuringTransfer);
      }
      if (state.relicPhase !== "visible") return ignored(state, type);
      if (wouldOpenSecondCorner({ ...state, relicPhase: "visible" }, "relics") && mapOrganOpen(state)) {
        return ignored(state, type, INVARIANT.noTwoCorners);
      }
      const pushed = pushStage(state);
      return applied(
        {
          ...pushed,
          relicPhase: "focus",
          frameState: "focus",
          activeModule: "relics",
          contentState: "relic",
        },
        type,
        {
          audio: "radio-focus-in",
          motion: "relic-focus",
          durationMs: TIMINGS.focusIn,
          followUp: analysisFollowUp(state),
        },
      );
    }

    case "relic:focus:close": {
      if (state.relicPhase !== "focus") return ignored(state, type);
      const next: NawaState = {
        ...state,
        relicPhase: "visible",
        frameState: "preview",
        activeModule: "relics",
        contentState: "relic",
      };
      const popped = popStage(next);
      const followUp =
        next.analysisReady || next.analysisR04
          ? { event: "integration:start" as const, delayMs: TIMINGS.focusOut }
          : null;
      return applied(popped.state, type, {
        audio: "kill",
        motion: "relic-focus-close",
        durationMs: TIMINGS.focusOut,
        followUp,
      });
    }

    case "relic:analyze:r03": {
      if (state.relicPhase !== "focus") return ignored(state, type);
      return applied(
        {
          ...state,
          relicMode: "R03",
          analysisR03: true,
        },
        type,
        {
          audio: "crackle",
          motion: "r03-anomaly",
          durationMs: 480,
          followUp: { event: "relic:analyze:r04", delayMs: TIMINGS.r04AfterR03 },
        },
      );
    }

    case "relic:analyze:r04": {
      if (state.relicPhase !== "focus") return ignored(state, type);
      return applied(
        {
          ...state,
          relicMode: "R04",
          analysisR03: true,
          analysisR04: true,
          analysisReady: true,
        },
        type,
        {
          audio: "radio-start",
          motion: "r04-receiver",
          durationMs: 520,
        },
      );
    }

    case "map:preview": {
      if (state.site !== "nawa") return ignored(state, type);
      if (state.transferActive || state.neyraState === "transfer") {
        return ignored(state, type, INVARIANT.transferBlocksFocus);
      }
      if (wouldOpenSecondCorner(state, "map")) {
        return ignored(state, type, INVARIANT.noTwoCorners);
      }
      if (state.mapPhase === "preview") {
        return applied(state, type, {
          followUp: { event: "map:open", delayMs: 0 },
          motion: "map-preview-again",
          durationMs: 80,
        });
      }
      if (state.mapPhase === "open") return ignored(state, type);
      const pushed = pushStage(state);
      return applied(
        {
          ...pushed,
          mapPhase: "preview",
          frameState: "preview",
          activeModule: "map",
          contentState: "map",
        },
        type,
        { motion: "map-preview", durationMs: 280 },
      );
    }

    case "map:open": {
      if (state.mapPhase !== "preview") return ignored(state, type);
      if (state.transferActive) {
        return ignored(state, type, INVARIANT.noFocusDuringTransfer);
      }
      const pushed = pushStage(state);
      return applied(
        {
          ...pushed,
          mapPhase: "open",
          frameState: "focus",
          activeModule: "map",
          contentState: "map",
        },
        type,
        { motion: "map-open", durationMs: 360 },
      );
    }

    case "frame:dormant:touch": {
      const corner = ev.corner;
      if (corner !== "memory" && corner !== "records") {
        return ignored(state, type);
      }
      const line = state.dormantMessageShown ? state.neyraLine : COPY.neyraDormant;
      return applied(
        {
          ...state,
          dormantPulseCorner: corner,
          dormantPulseUntil: now + TIMINGS.dormantTouch,
          dormantMessageShown: true,
          neyraLine: line,
        },
        type,
        {
          audio: "dormant",
          motion: "dormant-touch",
          durationMs: TIMINGS.dormantTouch,
          haptic: "light",
        },
      );
    }

    case "integration:start": {
      if (state.transferActive || state.neyraState === "transfer") {
        return ignored(state, type, INVARIANT.transferFocusExclusive);
      }
      if (!state.relicTransferred) return ignored(state, type);
      return applied(
        {
          ...state,
          frameState: "integration",
          contentState: "integration",
          activeModule: "none",
          mapPhase: "closed",
          relicPhase: "closed",
        },
        type,
        {
          motion: "integration",
          durationMs: TIMINGS.integrationDuration,
          followUp: { event: "integration:complete", delayMs: TIMINGS.integrationDuration },
        },
      );
    }

    case "integration:complete": {
      if (state.frameState !== "integration" && !state.analysisReady) {
        return ignored(state, type);
      }
      return applied(
        {
          ...state,
          frameState: "history",
          contentState: "story",
          activeModule: "none",
          mapHasNewData: true,
          recoveredSector: true,
          storyBeat: Math.max(state.storyBeat, 2),
          neyraLine: COPY.neyraNewData,
          stageStack: [],
        },
        type,
        { motion: "integration-done", durationMs: 400, audio: "impulse" },
      );
    }

    case "system:back":
    case "system:back:level": {
      if (state.transferActive || state.neyraState === "transfer") {
        if (state.frameState === "focus") {
          const cancelled = cancelTransfer(state, "relic:transfer:cancel");
          return {
            ...cancelled,
            state: logViolations(cancelled.state, INVARIANT.transferFocusExclusive),
            effect: { ...cancelled.effect, audio: "kill" },
          };
        }
        const cancelled = cancelTransfer(state, "relic:transfer:cancel");
        return {
          ...cancelled,
          effect: { ...cancelled.effect, audio: "kill" },
        };
      }

      if (state.frameState === "focus") {
        if (state.activeModule === "relics" || state.relicPhase === "focus") {
          return reduce(state, "relic:focus:close");
        }
        if (state.activeModule === "map" || state.mapPhase === "open") {
          const popped = popStage({
            ...state,
            mapPhase: "preview",
            frameState: "preview",
            activeModule: "map",
            contentState: "map",
          });
          return applied(popped.state, type, {
            audio: "kill",
            motion: "map-focus-close",
            durationMs: 280,
          });
        }
        return applied(
          { ...state, frameState: "preview" },
          type,
          { audio: "kill", motion: "focus-back", durationMs: 280 },
        );
      }

      if (state.frameState === "preview") {
        const popped = popStage(state);
        if (state.activeModule === "relics" || relicsOrganOpen(state)) {
          const restored = popped.restored
            ? applyRestore(popped.state, popped.restored)
            : popped.state;
          return applied(
            {
              ...restored,
              relicPhase: "closed",
              activeModule: "none",
              frameState: restored.frameState === "preview" ? "history" : restored.frameState,
              contentState: restored.contentState,
              mapPhase: "closed",
            },
            type,
            { audio: "kill", motion: "chamber-close", durationMs: TIMINGS.focusOut },
          );
        }
        if (state.activeModule === "map" || mapOrganOpen(state)) {
          const restored = popped.restored
            ? applyRestore(popped.state, popped.restored)
            : popped.state;
          return applied(
            {
              ...restored,
              mapPhase: "closed",
              activeModule: "none",
              frameState: restored.frameState === "focus" ? "history" : restored.frameState === "preview" ? "history" : restored.frameState,
              contentState: restored.contentState,
            },
            type,
            { audio: "kill", motion: "map-preview-close", durationMs: 240 },
          );
        }
        return applied(
          {
            ...popped.state,
            frameState: "history",
            activeModule: "none",
          },
          type,
          { audio: "kill", motion: "preview-back", durationMs: 240 },
        );
      }

      if (state.frameState === "integration") {
        return applied(
          {
            ...state,
            frameState: "history",
            contentState: "story",
            activeModule: "none",
          },
          type,
          { audio: "kill", motion: "integration-back", durationMs: 240 },
        );
      }

      if (state.site === "nawa") {
        return applied(
          {
            ...state,
            site: "library",
            frameState: "idle",
            activeModule: "none",
            neyraLine: null,
            stageStack: [],
          },
          type,
          { audio: "kill", motion: "to-library", durationMs: 360 },
        );
      }

      return ignored(state, type);
    }

    default:
      return ignored(state, type);
  }
}

export function reduceAll(state: NawaState, events: Array<NawaEvent | NawaEventName>): NawaState {
  return events.reduce((acc, event) => reduce(acc, event).state, state);
}
