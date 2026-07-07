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
): Record<string, string | number> {
  const legacyTarget = legacyTargetForBackendZone(target);
  const options: Record<string, string | number> = legacyTarget
    ? { target: legacyTarget }
    : {};

  const position = extra?.position;
  if (position === "left" || position === "right") {
    options.position = position;
  }

  const width = extra?.width;
  if (typeof width === "number" && !Number.isNaN(width)) {
    options.width = width;
  } else if (typeof width === "string" && width.trim() !== "") {
    const parsed = Number(width);
    if (!Number.isNaN(parsed)) {
      options.width = parsed;
    }
  }

  const height = extra?.height;
  if (typeof height === "number" && !Number.isNaN(height)) {
    options.height = height;
  } else if (typeof height === "string" && height.trim() !== "") {
    const parsed = Number(height);
    if (!Number.isNaN(parsed)) {
      options.height = parsed;
    }
  }

  return options;
}
