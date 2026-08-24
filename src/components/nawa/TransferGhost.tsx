import { nawaAssets } from "@/lib/nawa/assets.ts";
import { useNawa } from "./use-nawa.ts";
import { RadioSlot } from "./RadioSlot.tsx";

/** Presentation-only carry path. Hidden when the chamber still already contains the radio. */
export function TransferGhost() {
  const transferActive = useNawa((s) => s.transferActive);
  const relicPhase = useNawa((s) => s.relicPhase);
  if (nawaAssets.chamber35.url) return null;
  if (!transferActive || relicPhase !== "opening-35") return null;

  return (
    <div className="transfer-ghost" data-testid="transfer-ghost" aria-hidden="true">
      <RadioSlot mode="R01" compact testId="transfer-radio" />
    </div>
  );
}
