export type Site = "library" | "nawa";

export type FrameState = "idle" | "history" | "preview" | "focus" | "integration";

export type ActiveModule = "none" | "relics" | "map";

export type NeyraState = "idle" | "look-at-event" | "inspect" | "transfer";

export type ContentState = "story" | "relic" | "map" | "integration";

export type WorldSkin = "neutral";

export type RelicPhase =
  | "closed"
  | "opening-35"
  | "opening-75"
  | "visible"
  | "focus";

export type RelicMode = "R01" | "R03" | "R04";

export type MapPhase = "closed" | "preview" | "open";

export type CornerId = "memory" | "map" | "relics" | "records";

export type CornerAvailability = "dormant" | "active";

export type NawaEventName =
  | "frame:enter"
  | "relic:discover"
  | "relic:confirm"
  | "relic:transfer:start"
  | "relic:transfer:cancel"
  | "relic:chamber:opening:35"
  | "relic:chamber:opening:75"
  | "relic:visible"
  | "relic:focus"
  | "relic:focus:close"
  | "map:preview"
  | "map:open"
  | "neyra:look:relic"
  | "neyra:inspect"
  | "neyra:transfer"
  | "frame:dormant:touch"
  | "system:back"
  | "system:back:level"
  | "integration:start"
  | "integration:complete"
  | "relic:analyze:r03"
  | "relic:analyze:r04";

export interface NawaEvent {
  type: NawaEventName;
  corner?: CornerId;
  now?: number;
}

export interface StageSnapshot {
  frameState: FrameState;
  activeModule: ActiveModule;
  contentState: ContentState;
  relicPhase: RelicPhase;
  mapPhase: MapPhase;
  neyraState: NeyraState;
}

export interface PreConfirmSnapshot {
  frameState: FrameState;
  activeModule: ActiveModule;
  neyraState: NeyraState;
  contentState: ContentState;
  relicPhase: RelicPhase;
  relicMode: RelicMode;
  awaitingConfirm: boolean;
  transferActive: boolean;
  site: Site;
}

export interface NawaState {
  site: Site;
  frameState: FrameState;
  activeModule: ActiveModule;
  neyraState: NeyraState;
  contentState: ContentState;
  worldSkin: WorldSkin;
  relicPhase: RelicPhase;
  relicMode: RelicMode;
  relicDiscovered: boolean;
  relicTransferred: boolean;
  awaitingConfirm: boolean;
  transferActive: boolean;
  mapPhase: MapPhase;
  mapHasNewData: boolean;
  recoveredSector: boolean;
  analysisR03: boolean;
  analysisR04: boolean;
  analysisReady: boolean;
  dormantPulseCorner: CornerId | null;
  dormantPulseUntil: number;
  dormantMessageShown: boolean;
  lastEvent: NawaEventName | null;
  lastIgnored: boolean;
  lastViolation: string | null;
  violationLog: string[];
  preConfirm: PreConfirmSnapshot | null;
  stageStack: StageSnapshot[];
  muted: boolean;
  debug: boolean;
  captionsOn: boolean;
  neyraLine: string | null;
  storyBeat: number;
}

export type AudioCue =
  | "none"
  | "kill"
  | "radio-start"
  | "radio-focus-in"
  | "radio-focus-out"
  | "crackle"
  | "impulse"
  | "dormant";

export type HapticCue = "none" | "light";

export interface ReduceEffect {
  audio: AudioCue;
  motion: string | null;
  durationMs: number;
  haptic: HapticCue;
  followUp: { event: NawaEventName; delayMs: number } | null;
}

export interface ReduceResult {
  state: NawaState;
  effect: ReduceEffect;
  applied: boolean;
}

export interface NawaDebugApi {
  getState: () => NawaState;
  dispatch: (event: NawaEvent | NawaEventName) => void;
  lastEvent: () => NawaEventName | null;
  lastViolation: () => string | null;
  violationLog: () => string[];
  audioActive: () => string[];
  audioKill: () => void;
  timerCount: () => number;
  reset: () => void;
  setMuted: (muted: boolean) => void;
  setDebug: (debug: boolean) => void;
}
