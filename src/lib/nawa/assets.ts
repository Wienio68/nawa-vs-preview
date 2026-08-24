/**
 * Approved-asset registry from NAWA_ASSET_PACK v2.
 * Neyra pack is reference-only — one identity still, not 4 runtime states.
 * Map pack is excluded in v2.
 */
export type AssetStatus = "approved" | "required" | "slot" | "missing" | "reference";

export const nawaAssets = {
  cover: {
    id: "nawa.cover.6000",
    url: "/assets/nawa/cover/cover_6000_v1.webp",
    status: "approved" as const,
    slot: "COVER",
    binds: "library",
  },
  frameRest: {
    id: "frame.living.rest",
    url: "/assets/nawa/frame/FRAME_REST.png",
    status: "approved" as const,
    slot: "ŻYWA RAMA · REST",
    binds: "frameState:history|idle",
  },
  frameTouch: {
    id: "frame.living.touch",
    url: "/assets/nawa/frame/FRAME_TOUCH_PEAK.jpg",
    status: "approved" as const,
    slot: "ŻYWA RAMA · TOUCH",
    binds: "lastEvent:frame:dormant:touch",
  },
  frameTouch25: {
    id: "frame.living.touch.25",
    url: "/assets/nawa/frame/FRAME_TOUCH_25.jpg",
    status: "approved" as const,
    slot: "ŻYWA RAMA · TOUCH 25",
  },
  frameTouch50: {
    id: "frame.living.touch.50",
    url: "/assets/nawa/frame/FRAME_TOUCH_50.jpg",
    status: "approved" as const,
    slot: "ŻYWA RAMA · TOUCH 50",
  },
  frameTouch75: {
    id: "frame.living.touch.75",
    url: "/assets/nawa/frame/FRAME_TOUCH_75.jpg",
    status: "approved" as const,
    slot: "ŻYWA RAMA · TOUCH 75",
  },
  frameIntegration: {
    id: "frame.living.integration",
    url: "/assets/nawa/frame/FRAME_TOUCH_PEAK.jpg",
    status: "approved" as const,
    slot: "ŻYWA RAMA · INTEGRATION",
    binds: "frameState:integration · FALLBACK touch-peak",
  },
  chamberClosed: {
    id: "chamber.closed",
    url: "/assets/nawa/frame/RELIC_CLOSED.png",
    status: "approved" as const,
    slot: "KOMORA · CLOSED",
    binds: "relicPhase:closed",
  },
  chamber35: {
    id: "chamber.opening-35",
    url: "/assets/nawa/frame/RELIC_OPEN_35.jpg",
    status: "approved" as const,
    slot: "KOMORA · 35%",
    binds: "relicPhase:opening-35",
  },
  chamber75: {
    id: "chamber.opening-75",
    url: "/assets/nawa/frame/RELIC_OPEN_75.jpg",
    status: "approved" as const,
    slot: "KOMORA · 75%",
    binds: "relicPhase:opening-75",
  },
  chamberVisible: {
    id: "chamber.visible",
    url: "/assets/nawa/frame/RELIC_VISIBLE.jpg",
    status: "approved" as const,
    slot: "KOMORA · VISIBLE",
    binds: "relicPhase:visible",
  },
  chamberFocus: {
    id: "chamber.focus",
    url: "/assets/nawa/frame/RELIC_FOCUS.jpg",
    status: "approved" as const,
    slot: "KOMORA · FOCUS",
    binds: "relicPhase:focus",
  },
  radioR01: {
    id: "relic.radio.sierow.r01",
    url: "/assets/nawa/radio/RADIO_R01_RUNTIME.webp",
    status: "approved" as const,
    slot: "RADYJKO · R01",
    binds: "relicMode:R01 · history only",
  },
  radioR03: {
    id: "relic.radio.sierow.r03",
    url: "/assets/nawa/radio/RADIO_R03.jpg",
    status: "approved" as const,
    slot: "RADYJKO · R03",
    binds: "relicMode:R03",
  },
  radioR04: {
    id: "relic.radio.sierow.r04",
    url: "/assets/nawa/radio/RADIO_R04.jpg",
    status: "approved" as const,
    slot: "RADYJKO · R04",
    binds: "relicMode:R04",
  },
  neyraIdle: {
    id: "neyra.idle",
    url: "/assets/nawa/neyra/NEYRA_FRONT_RUNTIME.webp",
    status: "reference" as const,
    slot: "NEYRA · IDENTITY",
    binds: "neyraState:* · single still, not 4 clips",
  },
  neyraLook: {
    id: "neyra.look",
    url: "/assets/nawa/neyra/NEYRA_FRONT_RUNTIME.webp",
    status: "reference" as const,
    slot: "NEYRA · LOOK",
    binds: "same identity still + motion",
  },
  neyraInspect: {
    id: "neyra.inspect",
    url: "/assets/nawa/neyra/NEYRA_FRONT_RUNTIME.webp",
    status: "reference" as const,
    slot: "NEYRA · INSPECT",
    binds: "same identity still + motion",
  },
  neyraTransfer: {
    id: "neyra.transfer",
    url: "/assets/nawa/neyra/NEYRA_FRONT_RUNTIME.webp",
    status: "reference" as const,
    slot: "NEYRA · TRANSFER",
    binds: "same identity still + motion",
  },
  mapPreview: {
    id: "map.preview",
    url: "",
    status: "missing" as const,
    slot: "MAPA · PREVIEW",
    binds: "v2 pack excluded map",
  },
  mapOpen: {
    id: "map.open",
    url: "",
    status: "missing" as const,
    slot: "MAPA · OPEN",
    binds: "v2 pack excluded map",
  },
  core: {
    id: "core.integration",
    url: "",
    status: "missing" as const,
    slot: "RDZEŃ · SLOT",
    binds: "not in v2 packs",
  },
  neyra: {
    id: "neyra.ref.presence",
    url: "/assets/nawa/neyra/NEYRA_FRONT_RUNTIME.webp",
    status: "reference" as const,
    slot: "NEYRA · SLOT",
  },
  radio: {
    id: "relic.radio.sierow",
    url: "/assets/nawa/radio/RADIO_R01_RUNTIME.webp",
    status: "approved" as const,
    slot: "RADYJKO SIEROWA · SLOT",
  },
  frame: {
    id: "frame.living.v1",
    url: "/assets/nawa/frame/FRAME_REST.png",
    status: "approved" as const,
    slot: "ŻYWA RAMA · SLOT",
  },
} as const;

export function missingAssets(): string[] {
  return Object.values(nawaAssets)
    .filter((a) => !a.url)
    .map((a) => a.id);
}
