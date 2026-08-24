import type { AudioCue } from "./types.ts";

type Handle = {
  id: string;
  cue: AudioCue;
  stop: () => void;
};

const handles = new Map<string, Handle>();
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let idSeq = 0;

function nextId(cue: AudioCue): string {
  idSeq += 1;
  return `${cue}-${idSeq}`;
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.7;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = ensureContext();
  if (c && c.state === "suspended") {
    void c.resume();
  }
}

export function setMuted(next: boolean): void {
  muted = next;
  if (master && ctx) {
    master.gain.setTargetAtTime(next ? 0 : 0.7, ctx.currentTime, 0.03);
  }
}

export function isMuted(): boolean {
  return muted;
}

export function audioActive(): string[] {
  return [...handles.keys()];
}

export function audioKill(): void {
  for (const handle of handles.values()) {
    try {
      handle.stop();
    } catch {
      /* already stopped */
    }
  }
  handles.clear();
}

function register(cue: AudioCue, stop: () => void): string {
  const id = nextId(cue);
  handles.set(id, { id, cue, stop });
  return id;
}

function makeNoiseBuffer(c: AudioContext, seconds = 1): AudioBuffer {
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function startLoop(
  c: AudioContext,
  dest: AudioNode,
  opts: { filterHz?: number; gain: number; playbackRate?: number },
): { stop: () => void } {
  const src = c.createBufferSource();
  src.buffer = makeNoiseBuffer(c, 1.4);
  src.loop = true;
  src.playbackRate.value = opts.playbackRate ?? 1;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = opts.filterHz ?? 420;
  filter.Q.value = 0.7;
  const g = c.createGain();
  g.gain.value = 0;
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start();
  g.gain.setTargetAtTime(opts.gain, c.currentTime, 0.08);
  let stopped = false;
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      try {
        g.gain.setTargetAtTime(0, c.currentTime, 0.02);
        src.stop(c.currentTime + 0.08);
      } catch {
        /* ignore */
      }
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    },
  };
}

function fireImpulse(c: AudioContext, dest: AudioNode): void {
  const src = c.createBufferSource();
  src.buffer = makeNoiseBuffer(c, 0.08);
  const g = c.createGain();
  g.gain.value = 0.18;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1800;
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start();
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    g.disconnect();
  };
}

export function applyAudioCue(cue: AudioCue): void {
  if (cue === "none") return;
  if (cue === "kill") {
    audioKill();
    return;
  }

  if (typeof window === "undefined") {
    if (cue === "radio-start" || cue === "radio-focus-in") {
      register(cue, () => {
        handles.delete(`${cue}-placeholder`);
      });
    }
    return;
  }

  const c = ensureContext();
  if (!c || !master) {
    const id = register(cue, () => undefined);
    if (cue !== "radio-start" && cue !== "radio-focus-in") {
      handles.delete(id);
    }
    return;
  }

  if (cue === "radio-start") {
    audioKill();
    const loop = startLoop(c, master, { filterHz: 280, gain: muted ? 0 : 0.045, playbackRate: 0.7 });
    const id = register(cue, loop.stop);
    const crackle = startLoop(c, master, { filterHz: 2200, gain: muted ? 0 : 0.02, playbackRate: 1.4 });
    handles.set(`${id}-crackle`, { id: `${id}-crackle`, cue: "crackle", stop: crackle.stop });
    return;
  }

  if (cue === "radio-focus-in") {
    const loop = startLoop(c, master, { filterHz: 360, gain: muted ? 0 : 0.08, playbackRate: 0.85 });
    register(cue, loop.stop);
    return;
  }

  if (cue === "radio-focus-out") {
    audioKill();
    return;
  }

  if (cue === "crackle" || cue === "impulse" || cue === "dormant") {
    fireImpulse(c, master);
  }
}

export function attachUnlockOnce(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onGesture = () => unlockAudio();
  window.addEventListener("pointerdown", onGesture);
  window.addEventListener("keydown", onGesture);
  const onVis = () => {
    if (document.visibilityState === "visible") unlockAudio();
  };
  document.addEventListener("visibilitychange", onVis);
  return () => {
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
    document.removeEventListener("visibilitychange", onVis);
  };
}
