import { useEffect, useRef, type ReactNode } from "react";
import type { StoreApi } from "zustand/vanilla";
import { attachUnlockOnce } from "@/lib/nawa/audio.ts";
import {
  createBrowserStore,
  createNawaStore,
  installDebugApi,
  type NawaStore,
} from "@/lib/nawa/store.ts";
import { NawaStoreContext } from "./nawa-context.ts";

export function NawaProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreApi<NawaStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current =
      typeof window === "undefined" ? createNawaStore({ autoAudio: false }) : createBrowserStore();
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    const api = installDebugApi(store);
    const params = new URLSearchParams(window.location.search);
    const wantDebug = params.get("debug") === "1" || params.get("debug") === "true";
    store.getState().setDebug(wantDebug);
    const detach = attachUnlockOnce();
    return () => {
      detach();
      api.audioKill();
    };
  }, []);

  return <NawaStoreContext.Provider value={storeRef.current}>{children}</NawaStoreContext.Provider>;
}
