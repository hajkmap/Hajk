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
  extra?: Record<string, unknown>,
): Record<string, string> {
  const legacyTarget = legacyTargetForBackendZone(target);
  const options: Record<string, string> = legacyTarget
    ? { target: legacyTarget }
    : {};

  const position = extra?.position;
  if (position === "left" || position === "right") {
    options.position = position;
  }

  return options;
}
