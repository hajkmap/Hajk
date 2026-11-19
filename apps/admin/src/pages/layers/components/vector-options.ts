const VECTOR_OPTION_KEYS = [
  "dataFormat",
  "content",
  "sldUrl",
  "sldText",
  "sldStyle",
  "icon",
  "symbolXOffset",
  "symbolYOffset",
  "pointSize",
  "lineWidth",
  "lineStyle",
  "fillColor",
  "lineColor",
  "filterable",
  "filterAttribute",
  "filterComparer",
  "filterValue",
] as const;

/** Vector fields live on `DisplayLayer.options`. The save payload must copy them explicitly. */
export function vectorOptionsFromForm(
  options: unknown,
): Record<string, unknown> {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return {};
  }
  const source = options as Record<string, unknown>;
  const picked: Record<string, unknown> = {};
  for (const key of VECTOR_OPTION_KEYS) {
    if (key in source) picked[key] = source[key];
  }
  return picked;
}
