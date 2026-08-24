import { createStore, type StoreApi } from "zustand/vanilla";
import { applyAudioCue, audioActive, audioKill, setMuted } from "./audio.ts";
import { createInitialState, reduce } from "./machine.ts";
import type { NawaDebugApi, NawaEvent, NawaEventName, NawaState } from "./types.ts";

export interface NawaStore extends NawaState {
  timerCount: number;
  dispatch: (event: NawaEvent | NawaEventName) => void;
  reset: () => void;
  setMutedFlag: (muted: boolean) => void;
  setDebug: (debug: boolean) => void;
  setCaptions: (on: boolean) => void;
  audioActive: () => string[];
  audioKill: () => void;
  getTimerCount: () => number;
  advance: (ms: number) => void;
  flush: () => void;
}

type Timer = { id: number; due: number; fn: () => void; epoch: number };

export interface RuntimeClock {
  now: () => number;
  setTimeout: (fn: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
}

export interface CreateStoreOptions {
  clock?: RuntimeClock;
  autoAudio?: boolean;
}

function browserClock(): RuntimeClock {
  return {
    now: () => Date.now(),
    setTimeout: (fn, ms) => window.setTimeout(fn, ms) as unknown as number,
    clearTimeout: (id) => window.clearTimeout(id),
  };
}

function virtualClock(): { clock: RuntimeClock; advance: (ms: number) => void; flush: () => void; count: () => number } {
  let time = 0;
  let seq = 1;
  const timers = new Map<number, Timer>();
  const clock: RuntimeClock = {
    now: () => time,
    setTimeout: (fn, ms) => {
      const id = seq++;
      timers.set(id, { id, due: time + ms, fn, epoch: 0 });
      return id;
    },
    clearTimeout: (id) => {
      timers.delete(id);
    },
  };
  const fireDue = () => {
    let fired = true;
    while (fired) {
      fired = false;
      const due = [...timers.values()].filter((t) => t.due <= time).sort((a, b) => a.due - b.due);
      for (const t of due) {
        if (!timers.has(t.id)) continue;
        timers.delete(t.id);
        t.fn();
        fired = true;
      }
    }
  };
  return {
    clock,
    advance: (ms) => {
      time += ms;
      fireDue();
    },
    flush: () => fireDue(),
    count: () => timers.size,
  };
}

export function createNawaStore(options: CreateStoreOptions = {}): StoreApi<NawaStore> {
  const virtual = options.clock ? null : virtualClock();
  const clock = options.clock ?? virtual?.clock ?? browserClock();
  const autoAudio = options.autoAudio ?? true;
  let epoch = 0;
  const pending = new Set<number>();

  const store = createStore<NawaStore>((set, get) => {
    const clearTimers = () => {
      epoch += 1;
      for (const id of pending) clock.clearTimeout(id);
      pending.clear();
      set({ timerCount: 0 });
    };

    const schedule = (fn: () => void, delayMs: number) => {
      const captured = epoch;
      const id = clock.setTimeout(() => {
        pending.delete(id);
        set({ timerCount: pending.size });
        if (captured !== epoch) return;
        fn();
      }, delayMs);
      pending.add(id);
      set({ timerCount: pending.size });
    };

    const dispatch = (event: NawaEvent | NawaEventName) => {
      const current = get();
      const result = reduce(current, event);
      const type = typeof event === "string" ? event : event.type;

      if (
        type === "system:back" ||
        type === "system:back:level" ||
        type === "relic:transfer:cancel" ||
        type === "relic:focus:close"
      ) {
        clearTimers();
        if (autoAudio) audioKill();
      }

      if (autoAudio && result.effect.audio !== "none") {
        applyAudioCue(result.effect.audio);
      }

      set({
        ...result.state,
        timerCount: pending.size,
      });

      if (result.applied && result.effect.followUp) {
        const follow = result.effect.followUp;
        schedule(() => {
          get().dispatch(follow.event);
        }, follow.delayMs);
      }
    };

    const initial = createInitialState();

    return {
      ...initial,
      timerCount: 0,
      dispatch,
      reset: () => {
        clearTimers();
        if (autoAudio) audioKill();
        set({ ...createInitialState(), timerCount: 0, debug: get().debug, muted: get().muted });
      },
      setMutedFlag: (muted) => {
        set({ muted });
        setMuted(muted);
        if (muted && autoAudio) audioKill();
      },
      setDebug: (debug) => set({ debug }),
      setCaptions: (captionsOn) => set({ captionsOn }),
      audioActive: () => audioActive(),
      audioKill: () => {
        audioKill();
      },
      getTimerCount: () => pending.size,
      advance: (ms) => {
        virtual?.advance(ms);
        set({ timerCount: pending.size });
      },
      flush: () => {
        virtual?.flush();
        set({ timerCount: pending.size });
      },
    };
  });

  return store;
}

export function installDebugApi(store: StoreApi<NawaStore>): NawaDebugApi {
  const api: NawaDebugApi = {
    getState: () => store.getState(),
    dispatch: (event) => store.getState().dispatch(event),
    lastEvent: () => store.getState().lastEvent,
    lastViolation: () => store.getState().lastViolation,
    violationLog: () => store.getState().violationLog,
    audioActive: () => audioActive(),
    audioKill: () => audioKill(),
    timerCount: () => store.getState().getTimerCount(),
    reset: () => store.getState().reset(),
    setMuted: (muted) => store.getState().setMutedFlag(muted),
    setDebug: (debug) => store.getState().setDebug(debug),
  };
  if (typeof window !== "undefined") {
    (window as unknown as { __NAWA?: NawaDebugApi }).__NAWA = api;
  }
  return api;
}

export function createBrowserStore(): StoreApi<NawaStore> {
  if (typeof window === "undefined") {
    return createNawaStore({ autoAudio: false });
  }
  return createNawaStore({
    clock: browserClock(),
    autoAudio: true,
  });
}
