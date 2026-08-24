import { CORNERS } from "@/lib/nawa/corners.ts";
import { useNawa } from "./use-nawa.ts";
import { CornerOrgan } from "./CornerOrgan.tsx";
import { DebugOverlay } from "./DebugOverlay.tsx";
import { LivingSkin } from "./LivingSkin.tsx";
import { NeyraLayer } from "./NeyraLayer.tsx";
import { RelicChamber } from "./RelicChamber.tsx";
import { Stage } from "./Stage.tsx";
import { SystemUI } from "./SystemUI.tsx";
import { TransferGhost } from "./TransferGhost.tsx";

export function LivingFrame() {
  const frameState = useNawa((s) => s.frameState);
  const activeModule = useNawa((s) => s.activeModule);
  const relicPhase = useNawa((s) => s.relicPhase);
  const mapPhase = useNawa((s) => s.mapPhase);
  const transferActive = useNawa((s) => s.transferActive);
  const neyraState = useNawa((s) => s.neyraState);
  const lastEvent = useNawa((s) => s.lastEvent);
  const debug = useNawa((s) => s.debug);

  const othersQuiet = frameState === "focus";

  return (
    <div
      className="living-frame"
      data-testid="living-frame"
      data-frm={frameState}
      data-mod={activeModule}
      data-nr={neyraState}
      data-event={lastEvent ?? ""}
      data-relic={relicPhase}
      data-map={mapPhase}
      data-transfer={transferActive ? "true" : "false"}
      data-debug={debug ? "true" : "false"}
    >
      <Stage />
      <NeyraLayer />
      <TransferGhost />
      <LivingSkin />

      <div className="organs" data-quiet={othersQuiet ? "true" : "false"}>
        {CORNERS.filter((c) => c.id !== "relics").map((spec) => (
          <CornerOrgan key={spec.id} spec={spec} />
        ))}
        <RelicChamber />
      </div>

      <SystemUI />
      <DebugOverlay />
    </div>
  );
}
