import { useEffect } from "react";
import { useNawa } from "./use-nawa.ts";
import { LibraryScreen } from "./LibraryScreen.tsx";
import { LivingFrame } from "./LivingFrame.tsx";

export function NawaApp() {
  const site = useNawa((s) => s.site);
  const lastEvent = useNawa((s) => s.lastEvent);
  const debug = useNawa((s) => s.debug);

  useEffect(() => {
    if (lastEvent === "frame:dormant:touch" || lastEvent === "relic:confirm") {
      navigator.vibrate?.(12);
    }
  }, [lastEvent]);

  return (
    <div className="nawa-root" data-testid="nawa-root" data-site={site} data-debug={debug ? "true" : "false"}>
      <div className="portrait-shell">
        <div className="grain" aria-hidden="true" />
        {site === "library" ? <LibraryScreen /> : <LivingFrame />}
      </div>
    </div>
  );
}
