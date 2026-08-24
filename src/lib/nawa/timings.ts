/** Binding timings from MASTER Żywa Rama v0.4.1 — do not collapse into one animation. */
export const TIMINGS = {
  chamber35: 200,
  chamber35Min: 180,
  chamber35Max: 220,
  chamber75: 300,
  chamber75Min: 280,
  chamber75Max: 320,
  chamberVisible: 220,
  chamberVisibleMin: 200,
  chamberVisibleMax: 240,
  focusIn: 450,
  focusInMin: 400,
  focusInMax: 500,
  focusOut: 400,
  focusOutMin: 360,
  focusOutMax: 440,
  dormantTouch: 100,
  dormantTouchMin: 80,
  dormantTouchMax: 120,
  lookAfterDiscover: 420,
  inspectAfterLook: 520,
  r03AfterFocus: 800,
  r04AfterR03: 1000,
  integrationDuration: 1400,
  radioFadeIn: 420,
  radioFadeOut: 280,
} as const;

export function durationForRelicPhase(
  phase: "closed" | "opening-35" | "opening-75" | "visible" | "focus",
  from: "closed" | "opening-35" | "opening-75" | "visible" | "focus",
): number {
  if (from === "closed" && phase === "opening-35") return TIMINGS.chamber35;
  if (from === "opening-35" && phase === "opening-75") return TIMINGS.chamber75;
  if (from === "opening-75" && phase === "visible") return TIMINGS.chamberVisible;
  if (from === "visible" && phase === "focus") return TIMINGS.focusIn;
  if (from === "focus" && phase === "visible") return TIMINGS.focusOut;
  if (phase === "closed") return TIMINGS.focusOut;
  return TIMINGS.chamber35;
}
