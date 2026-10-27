import { useEffect, useState } from "react";
import { COPY } from "@/lib/nawa/copy.ts";
import { nawaAssets } from "@/lib/nawa/assets.ts";
import { useNawa } from "./use-nawa.ts";

/**
 * Neyra lives only in NAWA's Living Frame, never in a generic book reader.
 *
 * The two real canon clips were approved by the owner on 2026-10-27.
 * They must be installed byte-for-byte at the paths below; if absent,
 * retain the existing reference still instead of drawing a new face.
 *
 * This is intentionally a video-backed 2D motion proof, NOT a layered rig:
 * independent eyes, mouth and 12 sensor overlays need approved transparent
 * masks before they can be attached without corrupting Neyra's identity.
 */
const CANON_CLIPS = {
  front: "/assets/nawa/neyra/NEYRA_CANON_FRONT_1000014081.mp4",
  turn: "/assets/nawa/neyra/NEYRA_CANON_TURN_1000014021.mp4",
} as const;

export function NeyraLayer() {
  const neyraState = useNawa((s) => s.neyraState);
  const line = useNawa((s) => s.neyraLine);
  const debug = useNawa((s) => s.debug);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Switching NAWA state does not change Neyra's face; it only selects
  // one of two clips showing the *same* approved Neyra.
  const clip = neyraState === "look-at-event" || neyraState === "transfer"
    ? CANON_CLIPS.turn
    : CANON_CLIPS.front;

  useEffect(() => {
    setVideoReady(false);
    setVideoFailed(false);
  }, [clip]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const image = nawaAssets.neyraIdle.url || nawaAssets.neyra.url;
  const playingCanon = videoReady && !videoFailed && !reduceMotion;
  const showStill = !playingCanon;

  return (
    <div
      className="neyra-layer"
      data-state={neyraState}
      data-testid="neyra-layer"
      data-identity-mode={playingCanon ? "approved-motion" : "reference-still"}
      aria-hidden="true"
    >
      <div className="neyra-presence">
        {image ? (
          <>
            {showStill ? <img src={image} alt="" className="neyra-ref" /> : null}
            {!reduceMotion && !videoFailed ? (
              <video
                key={clip}
                className="neyra-ref neyra-canon-clip"
                src={clip}
                autoPlay
                playsInline
                muted
                loop
                preload="metadata"
                style={playingCanon ? undefined : { display: "none" }}
                onCanPlay={() => setVideoReady(true)}
                onError={() => {
                  setVideoReady(false);
                  setVideoFailed(true);
                }}
              />
            ) : null}
          </>
        ) : (
          <div className="neyra-slot-figure">
            <span className="neyra-mist" />
            {debug ? <span className="neyra-slot-label slot-label">{COPY.neyraSlot}</span> : null}
          </div>
        )}
      </div>
      {line ? <p className="neyra-line" data-testid="neyra-line">{line}</p> : null}
    </div>
  );
}
