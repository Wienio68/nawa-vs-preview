import { useContext } from "react";
import { useStore } from "zustand";
import type { NawaStore } from "@/lib/nawa/store.ts";
import { NawaStoreContext } from "./nawa-context.ts";

export function useNawa<T>(selector: (state: NawaStore) => T): T {
  const store = useContext(NawaStoreContext);
  if (!store) {
    throw new Error("useNawa must be used within NawaProvider");
  }
  return useStore(store, selector);
}

export function useNawaStore() {
  const store = useContext(NawaStoreContext);
  if (!store) {
    throw new Error("useNawa must be used within NawaProvider");
  }
  return store;
}
