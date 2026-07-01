/** Admin/backend zone id → legacy client `options.target`. */
const BACKEND_TARGET_TO_LEGACY: Record<string, string> = {
  drawer: "toolbar",
  widgetLeft: "left",
  widgetRight: "right",
  controlButton: "control",
};

export function legacyTargetForBackendZone(
  target: string | null | undefined,
): string | undefined {
  if (!target) return undefined;
  return BACKEND_TARGET_TO_LEGACY[target];
}

/** Per-map options override so legacy `options.target: hidden` does not win. */
export function toolsOnMapsOptionsForTarget(
  target: string | null | undefined,
): Record<string, string> {
  const legacyTarget = legacyTargetForBackendZone(target);
  return legacyTarget ? { target: legacyTarget } : {};
}
