import type { ActiveModule, CornerAvailability, CornerId } from "./types.ts";

export interface CornerSpec {
  id: CornerId;
  label: string;
  availability: CornerAvailability;
  module: ActiveModule | "none";
  position: "tl" | "tr" | "bl" | "br";
}

export const CORNERS: readonly CornerSpec[] = [
  { id: "memory", label: "PAMIĘĆ", availability: "dormant", module: "none", position: "tl" },
  { id: "map", label: "MAPA", availability: "active", module: "map", position: "tr" },
  { id: "relics", label: "RELIKTY", availability: "active", module: "relics", position: "bl" },
  { id: "records", label: "REKORDY", availability: "dormant", module: "none", position: "br" },
] as const;

export function cornerById(id: CornerId): CornerSpec {
  const found = CORNERS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown corner: ${id}`);
  return found;
}

export function isDormant(id: CornerId): boolean {
  return cornerById(id).availability === "dormant";
}

export function moduleForCorner(id: CornerId): ActiveModule | "none" {
  return cornerById(id).module;
}
