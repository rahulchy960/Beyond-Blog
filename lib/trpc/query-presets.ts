export const queryStaleTimes = {
  publicDiscovery: 5 * 60_000,
  publicInteractions: 15_000,
  adminLists: 45_000,
  adminEditor: 60_000,
  analytics: 30_000,
  mediaLibrary: 60_000,
} as const;

export const queryGcTimes = {
  default: 15 * 60_000,
  search: 8 * 60_000,
  interactions: 5 * 60_000,
} as const;

