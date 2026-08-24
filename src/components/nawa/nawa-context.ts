import { createContext } from "react";
import type { StoreApi } from "zustand/vanilla";
import type { NawaStore } from "@/lib/nawa/store.ts";

export const NawaStoreContext = createContext<StoreApi<NawaStore> | null>(null);
