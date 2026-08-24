import { isDormant, type CornerSpec } from "@/lib/nawa/corners.ts";
import { COPY } from "@/lib/nawa/copy.ts";
import { useNawa } from "./use-nawa.ts";

export function CornerOrgan({ spec }: { spec: CornerSpec }) {
  const dispatch = useNawa((s) => s.dispatch);
  const pulse = useNawa((s) => s.dormantPulseCorner);
  const mapPhase = useNawa((s) => s.mapPhase);
  const mapHasNewData = useNawa((s) => s.mapHasNewData);
  const recovered = useNawa((s) => s.recoveredSector);
  const debug = useNawa((s) => s.debug);
  const dormant = isDormant(spec.id);
  const pulsing = pulse === spec.id;
  const mapOpen = spec.id === "map" && mapPhase !== "closed";

  const onTap = () => {
    if (dormant) {
      dispatch({ type: "frame:dormant:touch", corner: spec.id, now: Date.now() });
      return;
    }
    if (spec.id === "map") {
      if (mapPhase === "preview") dispatch("map:open");
      else if (mapPhase === "closed") dispatch("map:preview");
    }
  };

  const stateLabel = dormant
    ? COPY.dormantHint
    : spec.id === "map"
      ? mapPhase === "open"
        ? "OPEN"
        : mapPhase === "preview"
          ? "PREVIEW"
          : mapHasNewData
            ? COPY.mapNewData
            : "ACTIVE"
      : "ACTIVE";

  return (
    <button
      type="button"
      className={`corner-organ pos-${spec.position} hit-only`}
      data-id={spec.id}
      data-dormant={dormant ? "true" : "false"}
      data-pulse={pulsing ? "true" : "false"}
      data-phase={spec.id === "map" ? mapPhase : "closed"}
      data-new={spec.id === "map" && mapHasNewData ? "true" : "false"}
      data-testid={`${spec.id}-hit`}
      aria-label={`${spec.label}${dormant ? `, ${COPY.dormantHint}` : ""}`}
      onClick={onTap}
    >
      <span className="corner-name">{debug ? spec.label : ""}</span>
      {debug ? <span className="corner-state">{stateLabel}</span> : null}
      {spec.id === "map" && recovered ? <span className="corner-mark" /> : null}
      {mapOpen ? (
        <div className="map-organ-body">
          <div className="map-space" data-testid="map-space">
            <span className="map-arc map-arc-a" />
            <span className="map-arc map-arc-b" />
            <span className="map-depth" />
            {recovered ? <span className="map-sector" data-testid="map-sector" /> : null}
            {recovered ? <span className="map-echo" /> : null}
          </div>
          <p className="map-caption">{recovered ? COPY.mapSector : COPY.mapEmpty}</p>
        </div>
      ) : null}
    </button>
  );
}
