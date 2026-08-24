import { COPY } from "@/lib/nawa/copy.ts";
import { useNawa } from "./use-nawa.ts";
import { RadioSlot } from "./RadioSlot.tsx";

export function Stage() {
  const frameState = useNawa((s) => s.frameState);
  const contentState = useNawa((s) => s.contentState);
  const relicDiscovered = useNawa((s) => s.relicDiscovered);
  const relicTransferred = useNawa((s) => s.relicTransferred);
  const awaitingConfirm = useNawa((s) => s.awaitingConfirm);
  const transferActive = useNawa((s) => s.transferActive);
  const relicPhase = useNawa((s) => s.relicPhase);
  const relicMode = useNawa((s) => s.relicMode);
  const mapHasNewData = useNawa((s) => s.mapHasNewData);
  const recovered = useNawa((s) => s.recoveredSector);
  const mapPhase = useNawa((s) => s.mapPhase);
  const analysisR03 = useNawa((s) => s.analysisR03);
  const analysisR04 = useNawa((s) => s.analysisR04);
  const dispatch = useNawa((s) => s.dispatch);
  const dim = frameState === "focus";
  const radioInChamber = relicPhase !== "closed" || transferActive;
  const showStoryRadio = relicDiscovered && !relicTransferred && !radioInChamber;
  const showConfirm = awaitingConfirm && !transferActive && relicPhase === "closed";

  return (
    <div className="stage" data-content={contentState} data-dim={dim ? "true" : "false"} data-testid="stage">
      <div className="stage-vignette" />
      {contentState === "integration" || frameState === "integration" ? (
        <article className="stage-copy narrative" data-testid="integration">
          <p className="kicker">{COPY.integrationKicker}</p>
          <p className="lead">{COPY.integrationBody}</p>
        </article>
      ) : contentState === "map" || mapPhase !== "closed" ? (
        <div className="map-field" data-phase={mapPhase} data-testid="map-field">
          <p className="kicker">{COPY.mapKicker}</p>
          <p className="map-caption">{recovered ? COPY.mapSector : COPY.mapEmpty}</p>
          {mapHasNewData ? <p className="map-new">{COPY.mapNewData}</p> : null}
          {mapPhase === "preview" ? <p className="hint">{COPY.mapPreviewHint}</p> : null}
        </div>
      ) : contentState === "relic" ? (
        <article className="stage-copy narrative" data-testid="relic-stage">
          <p className="kicker">{relicMode === "R04" ? COPY.relicR04 : relicMode === "R03" ? COPY.relicR03 : COPY.relicR01}</p>
          {analysisR03 ? <p className="lead">{COPY.relicAnomaly}</p> : null}
          {analysisR04 ? <p className="body">{COPY.relicR04}</p> : null}
        </article>
      ) : (
        <article className="stage-copy narrative" data-testid="history">
          <p className="kicker">{COPY.historyKicker}</p>
          <h1 className="lead">{COPY.historyLead}</h1>
          <p className="body">{COPY.historyBody}</p>
          {!relicDiscovered ? (
            <button
              type="button"
              className="discover-cta"
              data-testid="discover"
              onClick={() => dispatch("relic:discover")}
            >
              {COPY.historyDiscoverCta}
            </button>
          ) : null}
          {showStoryRadio ? (
            <div className="history-relic">
              <p className="body">{COPY.historyDiscover}</p>
              <RadioSlot
                mode="R01"
                interactive={!awaitingConfirm}
                onTap={() => dispatch("relic:discover")}
              />
            </div>
          ) : null}
          {showConfirm ? (
            <button
              type="button"
              className="confirm-cta"
              data-testid="confirm"
              onClick={() => dispatch("relic:confirm")}
            >
              <span>{COPY.confirmHint}</span>
              <span className="confirm-sub">{COPY.confirmLabel}</span>
            </button>
          ) : null}
        </article>
      )}
    </div>
  );
}
