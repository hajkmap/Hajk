/** Placements a tool can have on a map, as the client reads `options.target`. */
const TOOL_TARGETS = new Set(["toolbar", "left", "right", "control"]);

/** The map's own options for a tool: its placement, window position and size. */
export function toolsOnMapsOptions(
  extra?: Record<string, unknown>
): Record<string, string | number> {
  const options: Record<string, string | number> = {};

  const target = extra?.target;
  if (typeof target === "string" && TOOL_TARGETS.has(target)) {
    options.target = target;
  }

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

/** True when the map's options place the tool somewhere. */
export function isToolPlaced(options: unknown): boolean {
  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    return false;
  }
  const target = (options as Record<string, unknown>).target;
  return typeof target === "string" && TOOL_TARGETS.has(target);
}
