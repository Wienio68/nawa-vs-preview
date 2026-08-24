import { COPY } from "@/lib/nawa/copy.ts";
import { nawaAssets } from "@/lib/nawa/assets.ts";
import { useNawa } from "./use-nawa.ts";

function pickFrame(opts: {
  relicPhase: string;
  frameState: string;
  pulsing: boolean;
  lastEvent: string | null;
}) {
  const { relicPhase, frameState, pulsing, lastEvent } = opts;
  if (relicPhase === "opening-35") return nawaAssets.chamber35.url;
  if (relicPhase === "opening-75") return nawaAssets.chamber75.url;
  if (relicPhase === "visible") return nawaAssets.chamberVisible.url;
  if (relicPhase === "focus") return nawaAssets.chamberFocus.url;
  if (frameState === "integration") return nawaAssets.frameIntegration.url;
  if (pulsing || lastEvent === "frame:dormant:touch") return nawaAssets.frameTouch.url;
  return nawaAssets.frameRest.url || nawaAssets.frame.url;
}

export function LivingSkin() {
  const debug = useNawa((s) => s.debug);
  const frameState = useNawa((s) => s.frameState);
  const transferActive = useNawa((s) => s.transferActive);
  const lastEvent = useNawa((s) => s.lastEvent);
  const relicPhase = useNawa((s) => s.relicPhase);
  const pulsing = useNawa((s) => s.dormantPulseCorner);
  const frameUrl = pickFrame({
    relicPhase,
    frameState,
    pulsing: Boolean(pulsing),
    lastEvent,
  });
  const chamberOpen = relicPhase !== "closed";

  return (
    <div
      className="living-skin"
      aria-hidden="true"
      data-frm={frameState}
      data-transfer={transferActive ? "true" : "false"}
      data-event={lastEvent ?? ""}
      data-relic={relicPhase}
    >
      {frameUrl ? (
        <img src={frameUrl} alt="" className="living-skin-bitmap" data-relic={relicPhase} />
      ) : (
        <svg className="living-skin-svg" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="nawa-pearl" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e6e1d6" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#b7b3ab" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#9a8b68" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path
            className="skin-rim"
            d="M72 112 C 116 86, 170 80, 204 86 C 256 94, 300 108, 324 142 C 352 180, 358 240, 354 312 C 350 402, 356 488, 352 568 C 348 644, 326 700, 288 732 C 246 766, 196 776, 156 768 C 108 756, 72 722, 56 666 C 40 606, 44 516, 48 424 C 52 322, 46 220, 58 162 C 64 136, 68 122, 72 112 Z"
            fill="none"
            stroke="#e6e1d6"
            strokeOpacity="0.34"
            strokeWidth="1.4"
          />
        </svg>
      )}
      {!chamberOpen ? (
        <svg className="living-skin-energy" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
          <path className="skin-fiber fiber-tl" d="M18 22 C 48 58, 70 92, 102 126" fill="none" stroke="#b7b3ab" strokeWidth="1.15" strokeOpacity="0.28" />
          <path className="skin-fiber fiber-tr" d="M372 24 C 338 58, 316 96, 288 132" fill="none" stroke="#b7b3ab" strokeWidth="1.05" strokeOpacity="0.22" />
          <path className="skin-fiber fiber-bl" d="M16 828 C 48 776, 74 728, 112 686" fill="none" stroke="#b7b3ab" strokeWidth="1.35" strokeOpacity="0.3" />
          <path className="skin-fiber fiber-br" d="M374 828 C 338 784, 316 740, 284 704" fill="none" stroke="#b7b3ab" strokeWidth="0.9" strokeOpacity="0.18" />
        </svg>
      ) : null}
      {debug ? <span className="frame-slot-label slot-label">{COPY.frameSlot}</span> : null}
    </div>
  );
}
