import { COPY } from "@/lib/nawa/copy.ts";
import { nawaAssets } from "@/lib/nawa/assets.ts";
import type { RelicMode } from "@/lib/nawa/types.ts";
import { useNawa } from "./use-nawa.ts";

function RadioGlyph({ mode }: { mode: RelicMode }) {
  return (
    <svg className="radio-glyph" viewBox="0 0 88 56" aria-hidden="true">
      <rect x="10" y="14" width="68" height="36" rx="5" fill="#12100e" stroke="#6a655c" strokeWidth="1.2" />
      <rect x="12.5" y="16.5" width="63" height="31" rx="3.5" fill="#1a1714" />
      <circle cx="14" cy="18" r="1.1" fill="#3a372f" />
      <circle cx="74" cy="18" r="1.1" fill="#3a372f" />
      <circle cx="14" cy="46" r="1.1" fill="#3a372f" />
      <circle cx="74" cy="46" r="1.1" fill="#3a372f" />
      <rect x="6" y="28" width="6" height="8" rx="1" fill="#2a2622" stroke="#5c574e" strokeWidth="0.7" />
      <circle cx="8.2" cy="32" r="1.4" fill="#0c0b0a" stroke="#9a8b68" strokeWidth="0.5" />
      <line x1="44" y1="6" x2="44" y2="14" stroke="#8a857c" strokeWidth="1.1" />
      <circle cx="44" cy="5.5" r="1.4" fill="#8a857c" />
      <circle cx="28" cy="32" r="10" fill="#0b0a09" stroke="#4a463e" strokeWidth="0.8" />
      <circle cx="28" cy="32" r="7.2" fill="none" stroke="#3d3a34" strokeWidth="0.5" />
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        const x1 = 28 + Math.cos(a) * 6.2;
        const y1 = 32 + Math.sin(a) * 6.2;
        const x2 = 28 + Math.cos(a) * 8.4;
        const y2 = 32 + Math.sin(a) * 8.4;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5c574e" strokeWidth="0.5" />;
      })}
      <line
        className="radio-needle"
        x1="28"
        y1="32"
        x2="28"
        y2="24.2"
        stroke={mode === "R01" ? "#6a655c" : "#9a8b68"}
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <rect x="42" y="20" width="26" height="10" rx="1" fill="#0d0c0a" stroke="#3f3c36" strokeWidth="0.6" />
      <path className="radio-scale" d="M45 27 H65" stroke="#4e4a42" strokeWidth="0.5" />
      <circle cx="48" cy="40" r="3.4" fill="#2a2621" stroke="#6a655c" strokeWidth="0.7" />
      <circle cx="60" cy="40" r="3.4" fill="#2a2621" stroke="#6a655c" strokeWidth="0.7" />
      <circle cx="48" cy="40" r="1.1" fill="#9a8b68" opacity={mode === "R01" ? 0.25 : 0.7} />
      <rect className="radio-subsurface" x="13" y="17" width="62" height="30" rx="3" fill="#9a8b68" />
    </svg>
  );
}

export function RadioSlot({
  mode,
  interactive,
  onTap,
  compact,
  nested,
  testId,
}: {
  mode: RelicMode;
  interactive?: boolean;
  onTap?: () => void;
  compact?: boolean;
  nested?: boolean;
  testId?: string;
}) {
  const debug = useNawa((s) => s.debug);
  const src =
    (mode === "R04" ? nawaAssets.radioR04.url : mode === "R03" ? nawaAssets.radioR03.url : nawaAssets.radioR01.url) ||
    nawaAssets.radio.url;
  const label =
    mode === "R04" ? COPY.relicR04 : mode === "R03" ? COPY.relicR03 : COPY.relicR01;
  const cls = ["radio-slot", compact ? "compact" : "", nested ? "nested" : ""].filter(Boolean).join(" ");
  const id = testId ?? "radio-slot";

  const inner = (
    <>
      {src ? <img src={src} alt="" className="radio-ref" /> : <RadioGlyph mode={mode} />}
      {debug ? <span className="radio-slot-label slot-label">{COPY.relicSlot}</span> : null}
      {debug ? <span className="radio-mode">{label}</span> : null}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={cls}
        data-mode={mode}
        data-testid={id}
        onClick={onTap}
        aria-label={label}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={cls} data-mode={mode} data-testid={id}>
      {inner}
    </div>
  );
}
