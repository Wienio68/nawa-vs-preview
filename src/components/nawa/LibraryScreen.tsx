import { COPY } from "@/lib/nawa/copy.ts";
import { nawaAssets } from "@/lib/nawa/assets.ts";
import { useNawa } from "./use-nawa.ts";

export function LibraryScreen() {
  const dispatch = useNawa((s) => s.dispatch);

  return (
    <section className="library-screen" data-testid="library" aria-label={COPY.libraryKicker}>
      <div className="library-veil" />
      <button
        type="button"
        className="library-cover"
        onClick={() => dispatch("frame:enter")}
        data-testid="library-enter"
      >
        <img
          src={nawaAssets.cover.url}
          alt=""
          className="library-cover-img"
          width={1024}
          height={1536}
        />
        <span className="library-cover-shade" />
        <span className="library-kicker">{COPY.libraryKicker}</span>
        <span className="library-title">{COPY.title}</span>
        <span className="library-work">{COPY.work}</span>
        <span className="library-cta">{COPY.libraryEnter}</span>
        <span className="library-hint">{COPY.libraryHint}</span>
      </button>
    </section>
  );
}
