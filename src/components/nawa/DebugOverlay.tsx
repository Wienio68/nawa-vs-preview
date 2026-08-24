import { useNawa } from "./use-nawa.ts";

export function DebugOverlay() {
  const debug = useNawa((s) => s.debug);
  const frameState = useNawa((s) => s.frameState);
  const activeModule = useNawa((s) => s.activeModule);
  const neyraState = useNawa((s) => s.neyraState);
  const lastEvent = useNawa((s) => s.lastEvent);
  const relicPhase = useNawa((s) => s.relicPhase);
  const mapPhase = useNawa((s) => s.mapPhase);
  const setDebug = useNawa((s) => s.setDebug);

  if (!debug) return null;

  return (
    <div className="debug-overlay" data-testid="debug-overlay" data-debug="true">
      <span>DEBUG true</span>
      <span>FRM {frameState}</span>
      <span>MOD {activeModule}</span>
      <span>NR {neyraState}</span>
      <span>{lastEvent ?? "—"}</span>
      <span>RLC {relicPhase}</span>
      <span>MAP {mapPhase}</span>
      <button type="button" className="debug-hide" onClick={() => setDebug(false)}>
        DEBUG false
      </button>
    </div>
  );
}
