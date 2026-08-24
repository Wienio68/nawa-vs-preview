import { COPY } from "@/lib/nawa/copy.ts";
import { useNawa, useNawaStore } from "./use-nawa.ts";

export function SystemUI() {
  const dispatch = useNawa((s) => s.dispatch);
  const muted = useNawa((s) => s.muted);
  const captionsOn = useNawa((s) => s.captionsOn);
  const setMutedFlag = useNawa((s) => s.setMutedFlag);
  const setCaptions = useNawa((s) => s.setCaptions);
  const neyraLine = useNawa((s) => s.neyraLine);
  const store = useNawaStore();

  const goLibrary = () => {
    let guard = 0;
    while (store.getState().site === "nawa" && guard < 8) {
      store.getState().dispatch("system:back");
      guard += 1;
    }
  };

  return (
    <div className="system-ui" data-testid="system-ui">
      <button
        type="button"
        className="sys-btn sys-primary"
        data-testid="system-back"
        onClick={() => dispatch("system:back")}
        aria-label={COPY.back}
      >
        {COPY.back}
      </button>
      <button type="button" className="sys-btn" data-testid="system-library" onClick={goLibrary} aria-label={COPY.library}>
        {COPY.library}
      </button>
      <button
        type="button"
        className="sys-btn"
        data-testid="system-mute"
        aria-pressed={muted}
        onClick={() => setMutedFlag(!muted)}
      >
        {COPY.mute}
        <span className="sys-flag">{muted ? "off" : "on"}</span>
      </button>
      <button
        type="button"
        className="sys-btn"
        data-testid="system-captions"
        aria-pressed={captionsOn}
        onClick={() => setCaptions(!captionsOn)}
      >
        {COPY.captions}
      </button>
      <details className="sys-a11y">
        <summary className="sys-btn">{COPY.a11y}</summary>
        <p>{COPY.a11yPlaceholder}</p>
      </details>
      {captionsOn ? (
        <div className="caption-bar" data-testid="captions">
          {neyraLine ?? COPY.captionsPlaceholder}
        </div>
      ) : null}
    </div>
  );
}
