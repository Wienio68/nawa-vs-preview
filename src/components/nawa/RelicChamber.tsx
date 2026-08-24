import { TIMINGS } from "@/lib/nawa/timings.ts";
import { nawaAssets } from "@/lib/nawa/assets.ts";
import { useNawa } from "./use-nawa.ts";
import { RadioSlot } from "./RadioSlot.tsx";

const PHASE_MS = {
  closed: TIMINGS.focusOut,
  "opening-35": TIMINGS.chamber35,
  "opening-75": TIMINGS.chamber75,
  visible: TIMINGS.chamberVisible,
  focus: TIMINGS.focusIn,
} as const;

export function RelicChamber() {
  const phase = useNawa((s) => s.relicPhase);
  const mode = useNawa((s) => s.relicMode);
  const transferred = useNawa((s) => s.relicTransferred);
  const transferActive = useNawa((s) => s.transferActive);
  const debug = useNawa((s) => s.debug);
  const dispatch = useNawa((s) => s.dispatch);
  const duration = PHASE_MS[phase];

  const onTap = () => {
    if (phase === "visible") dispatch("relic:focus");
    else if (phase === "closed" && transferred && !transferActive) {
      dispatch("relic:chamber:opening:35");
    }
  };

  const bakedInFrame = Boolean(
    nawaAssets.chamber35.url && nawaAssets.chamber75.url && nawaAssets.chamberVisible.url,
  );
  const showRadio = !bakedInFrame && (phase !== "closed" || transferActive);

  return (
    <div
      className="relic-chamber hit-only"
      data-phase={phase}
      data-testid="relic-chamber"
      style={{ transitionDuration: `${duration}ms` }}
    >
      <button type="button" className="relic-hit" data-testid="relics-hit" aria-label="Relikty" onClick={onTap}>
        {debug ? <span className="corner-name">Relikty</span> : null}
        {debug ? (
          <span className="corner-state">{phase === "closed" ? "CLOSED" : phase.toUpperCase()}</span>
        ) : null}
      </button>
      {showRadio ? (
        <div className="chamber-inner" data-reveal={phase}>
          <RadioSlot
            mode={mode}
            compact={phase === "opening-35" || phase === "opening-75"}
            nested={phase === "visible" || phase === "focus"}
          />
        </div>
      ) : (
        <span className="chamber-seal" />
      )}
    </div>
  );
}
