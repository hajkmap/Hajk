import type { FieldValues } from "react-hook-form";

export type LayerCategory = "display" | "search" | "editing";

/** Top-level form keys that belong to the search-layer settings UI. */
const SEARCH_FORM_KEYS = [
  "name",
  "serviceId",
  "internalName",
  "description",
  "metadata",
  "options",
  "roleId",
  "searchSettings",
] as const;

/** Top-level form keys that belong to the editing-layer settings UI. */
const EDITING_FORM_KEYS = [
  "name",
  "serviceId",
  "internalName",
  "description",
  "metadata",
  "options",
  "roleId",
  "searchSettings",
] as const;

const NUMERIC_FORM_KEYS = new Set([
  "opacity",
  "minZoom",
  "maxZoom",
  "zIndex",
  "customRatio",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isEmptyValue(value: unknown): boolean {
  if (value === "" || value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (isPlainObject(value)) {
    return Object.keys(value).every((key) => isEmptyValue(value[key]));
  }
  return false;
}

function normalizeLeaf(path: string, value: unknown): unknown {
  const key = path.split(".").pop() ?? path;
  if (NUMERIC_FORM_KEYS.has(key)) {
    if (value === "" || value === null || value === undefined) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? value : n;
  }
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return "";
  return value;
}

function valuesEqual(current: unknown, baseline: unknown, path = ""): boolean {
  if (current === undefined && isEmptyValue(baseline)) return true;
  if (baseline === undefined && isEmptyValue(current)) return true;

  const a = normalizeLeaf(path, current);
  const b = normalizeLeaf(path, baseline);

  if (a === b) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    return Object.keys(b).every((key) =>
      valuesEqual(a[key], b[key], path ? `${path}.${key}` : key),
    );
  }

  if (
    (typeof a === "number" || typeof a === "string") &&
    (typeof b === "number" || typeof b === "string")
  ) {
    return String(a) === String(b);
  }

  return false;
}

function getComparableKeys(
  category: LayerCategory,
  baseline: FieldValues,
): string[] {
  if (category === "search") return [...SEARCH_FORM_KEYS];
  if (category === "editing") return [...EDITING_FORM_KEYS];
  return Object.keys(baseline);
}

/** True when current form values differ from the saved baseline (reverting a field clears dirty). */
export function isLayerSettingsChanged(
  category: LayerCategory,
  current: FieldValues,
  baseline: FieldValues,
  options?: { selectedLayersDirty?: boolean },
): boolean {
  if (options?.selectedLayersDirty) return true;

  const keys = getComparableKeys(category, baseline);
  return keys.some((key) => !valuesEqual(current[key], baseline[key], key));
}

export const LAYER_CATEGORIES: LayerCategory[] = [
  "display",
  "search",
  "editing",
];

const CATEGORY_ROUTE: Record<LayerCategory, string> = {
  display: "/display-layers",
  search: "/search-layers",
  editing: "/editing-layers",
};

export const LAYER_CATEGORY_I18N_KEYS: Record<LayerCategory, string> = {
  display: "common.display-layers",
  search: "common.search-layers",
  editing: "common.editing-layers",
};

export function getLayerCategoryRoute(category: LayerCategory): string {
  return CATEGORY_ROUTE[category];
}

export function getLayerSettingsPath(
  category: LayerCategory,
  layerId: string,
  fromService?: string,
): string {
  const base = `${getLayerCategoryRoute(category)}/${layerId}`;
  return fromService ? `${base}?fromService=${fromService}` : base;
}

export function normalizeLayerCategory(
  kind: string | undefined | null,
): LayerCategory {
  if (kind === "search" || kind === "editing") return kind;
  return "display";
}

export type LayerSettingsTab =
  | "general"
  | "display"
  | "metadata"
  | "infoclick"
  | "editing"
  | "layers"
  | "maps";

export interface LayerSettingsVisibility {
  tabs: LayerSettingsTab[];
  showSearchSettingsPanel: boolean;
  showDisplayFieldsPanel: boolean;
  showDisplayRequestOptions: boolean;
  showInfoClickSettingsPanel: boolean;
  showEditingSettingsPanel: boolean;
}

const CATEGORY_FROM_PATH_SEGMENT: Record<string, LayerCategory> = {
  "display-layers": "display",
  "search-layers": "search",
  "editing-layers": "editing",
};

export function getLayerCategoryFromPathname(
  pathname: string,
): LayerCategory | undefined {
  const segment = pathname.split("/").find(Boolean);
  return segment ? CATEGORY_FROM_PATH_SEGMENT[segment] : undefined;
}

export function getLayerSettingsVisibility(
  category: LayerCategory,
): LayerSettingsVisibility {
  switch (category) {
    case "display":
      return {
        tabs: ["general", "display", "metadata", "infoclick", "layers", "maps"],
        showSearchSettingsPanel: false,
        showDisplayFieldsPanel: false,
        showDisplayRequestOptions: true,
        showInfoClickSettingsPanel: true,
        showEditingSettingsPanel: false,
      };
    case "search":
      return {
        tabs: ["general", "infoclick", "layers", "maps"],
        showSearchSettingsPanel: true,
        showDisplayFieldsPanel: true,
        showDisplayRequestOptions: false,
        showInfoClickSettingsPanel: false,
        showEditingSettingsPanel: false,
      };
    case "editing":
      return {
        tabs: ["general", "editing", "layers", "maps"],
        showSearchSettingsPanel: false,
        showDisplayFieldsPanel: false,
        showDisplayRequestOptions: false,
        showInfoClickSettingsPanel: false,
        showEditingSettingsPanel: true,
      };
  }
}
