import type { PublishedParameter } from "../types";

/** Available controls/inputs in the Hajk UI. */
export type ParameterUiKind =
  | "CHOICE"
  | "MULTISELECT"
  | "SLIDER"
  | "PASSWORD"
  | "NUMBER"
  | "COLOR"
  | "BOOLEAN"
  | "TEXTAREA"
  | "DATE"
  | "TIME"
  | "DATETIME"
  | "FILE"
  | "PATH"
  | "TEXT"
  | "DISPLAY_ONLY";

/**
 * Normalizes FME type string (v3 SCREAMING_SNAKE or v4 lowercase) to SCREAMING_SNAKE.
 */
export function normalizeRawType(type: unknown): string {
  return String(type ?? "")
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

/**
 * Maps an FME parameter type (normalized to SCREAMING_SNAKE) to the UI control the plugin renders it with.
 * Unlisted types fall back to TEXT.
 */
const KIND_BY_TYPE: Record<string, ParameterUiKind> = {
  CHOICE: "CHOICE",
  LOOKUP_CHOICE: "CHOICE",
  DROPDOWN: "CHOICE",
  RADIO: "CHOICE",
  LISTBOX: "MULTISELECT",
  LOOKUP_LISTBOX: "MULTISELECT",
  TREE: "MULTISELECT",
  MULTI: "MULTISELECT",
  RANGE_SLIDER: "SLIDER",
  RANGE: "SLIDER",
  NUMBER: "NUMBER",
  INTEGER: "NUMBER",
  FLOAT: "NUMBER",
  COLOR: "COLOR",
  BOOLEAN: "BOOLEAN",
  CHECKBOX: "BOOLEAN",
  YESNO: "BOOLEAN",
  TEXTAREA: "TEXTAREA",
  DATE: "DATE",
  TIME: "TIME",
  DATETIME: "DATETIME",
  PASSWORD: "PASSWORD",
  MESSAGE: "DISPLAY_ONLY",
  GROUP: "DISPLAY_ONLY",
  FILE: "FILE",
  FILENAME: "FILE",
  SOURCE_DATASET: "FILE",
  FILE_OR_URL: "FILE",
  REPROJECTION_FILE: "FILE",
  DESTINATION_DATASET: "PATH",
  DIRECTORY: "PATH",
  DIRNAME: "PATH",
  URL: "PATH",
  LINK: "PATH",
};

/** Value types that should be rendered as numbers. */
const NUMERIC_VALUE_TYPES = new Set(["NUMBER", "INTEGER", "FLOAT"]);
/** Value types that should be rendered as booleans. */
const BOOLEAN_VALUE_TYPES = new Set(["BOOLEAN", "BOOL"]);

/**
 * Classifies a raw FME type into a UI kind.
 * `valueType` (only v4) refines otherwise generic TEXT parameters into NUMERIC or BOOLEAN controls.
 */
export function resolveParameterUiKind(
  rawType: unknown,
  valueType?: unknown
): ParameterUiKind {
  // If the type is mapped to a UI type, return it immediately.
  if (KIND_BY_TYPE[normalizeRawType(rawType)]) {
    return KIND_BY_TYPE[normalizeRawType(rawType)];
  }

  // The SOURCE_DATASET and SOURCE_FILE types are mapped to FILE.
  // TODO: Investigate if we need to support other source types...
  if (/^SOURCE_(DATASET|FILE)/.test(normalizeRawType(rawType))) {
    return "FILE";
  }

  // If valueType is provided, refine generic TEXT parameters into NUMERIC or BOOLEAN controls.
  if (NUMERIC_VALUE_TYPES.has(normalizeRawType(valueType))) {
    return "NUMBER";
  }
  if (BOOLEAN_VALUE_TYPES.has(normalizeRawType(valueType))) {
    return "BOOLEAN";
  }

  return "TEXT";
}

/**
 * Resolves the UI kind for a full parameter record, including v4 UI hints.
 */
export function resolvePublishedParameterUiKind(
  parameter: Pick<PublishedParameter, "type" | "valueType"> &
    Record<string, unknown>
): ParameterUiKind {
  const resolvedUiKind = resolveParameterUiKind(
    parameter.type,
    parameter.valueType
  );
  if (
    resolvedUiKind === "DATETIME" &&
    normalizeRawType(parameter.format) === "DATE"
  ) {
    return "DATE";
  }
  if (parameter.showInlineEditor === true && resolvedUiKind === "TEXT") {
    return "TEXTAREA";
  }
  return resolvedUiKind;
}

/**
 * Returns the UI kind for a parameter.
 * Caches the result on the parameter object for subsequent calls.
 * Returns the cached value if available, otherwise resolves the UI kind and caches the result.
 */
export function getParameterUiKind(
  parameter: PublishedParameter
): ParameterUiKind {
  if (parameter.uiKind) {
    return parameter.uiKind;
  }
  const uiKind = resolvePublishedParameterUiKind(parameter);
  parameter.uiKind = uiKind;
  return uiKind;
}

/**
 * A Display-Only parameter is one that is not editable by the user.
 * It is used to display information to the user, such as the FME message type.
 */
export function isDisplayOnlyParameter(parameter: PublishedParameter): boolean {
  return getParameterUiKind(parameter) === "DISPLAY_ONLY";
}

/**
 * Checks if a value is empty.
 * An empty value is considered to be null, an empty array, a number that is NaN, or a string that is empty.
 */
function valueIsEmpty(value: unknown): boolean {
  if (value == null) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === "boolean") {
    return false;
  }
  if (typeof value === "number") {
    return Number.isNaN(value);
  }
  return String(value).length === 0;
}

/**
 * Checks if a parameter has a default value.
 * A default value is considered to be non-empty.
 */
export function parameterHasDefaultValue(
  parameter: PublishedParameter
): boolean {
  return !valueIsEmpty(parameter.defaultValue);
}

/**
 * Checks if a parameter is satisfied.
 * A parameter is considered satisfied if it has a user value or a default value, or if it is a Display-Only parameter.
 */
export function parameterIsSatisfied(parameter: PublishedParameter): boolean {
  if (isDisplayOnlyParameter(parameter)) {
    return true;
  }
  return !valueIsEmpty(parameter.value) || parameterHasDefaultValue(parameter);
}
