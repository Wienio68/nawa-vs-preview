import { COPY } from "@/lib/nawa/copy.ts";
import { nawaAssets } from "@/lib/nawa/assets.ts";
import { useNawa } from "./use-nawa.ts";

export function NeyraLayer() {
  const neyraState = useNawa((s) => s.neyraState);
  const line = useNawa((s) => s.neyraLine);
  const debug = useNawa((s) => s.debug);
  const src =
    (neyraState === "look-at-event"
      ? nawaAssets.neyraLook.url
      : neyraState === "inspect"
        ? nawaAssets.neyraInspect.url
        : neyraState === "transfer"
          ? nawaAssets.neyraTransfer.url
          : nawaAssets.neyraIdle.url) || nawaAssets.neyra.url;

  return (
    <div className="neyra-layer" data-state={neyraState} data-testid="neyra-layer" aria-hidden="true">
      <div className="neyra-presence">
        {src ? (
          <img src={src} alt="" className="neyra-ref" />
        ) : (
          <div className="neyra-slot-figure">
            <span className="neyra-mist" />
            {debug ? <span className="neyra-slot-label slot-label">{COPY.neyraSlot}</span> : null}
          </div>
        )}
      </div>
      {line ? (
        <p className="neyra-line" data-testid="neyra-line">
          {line}
        </p>
      ) : null}
    </div>
  );
}
