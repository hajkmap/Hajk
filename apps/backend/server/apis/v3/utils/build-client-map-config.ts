import type { Prisma } from "@prisma/client";

import prisma from "../../../common/prisma.ts";
import { DEFAULT_MAP_OPTIONS } from "../../../common/defaults.ts";
import {
  buildLayerSwitcherBaselayersForMap,
  buildLayerSwitcherGroupsForMap,
} from "./build-layer-switcher-groups-for-map.ts";
import { legacyTargetForBackendZone } from "./tool-placement.ts";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null && typeof value === "object" && !Array.isArray(value)
  );
}

/**
 * Deep-merges `override` onto `base`. Plain objects merge recursively; arrays and
 * scalars replace. `undefined` values in `override` are ignored so the
 * corresponding `base` (default) value is kept.
 */
function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const baseValue = result[key];
    if (isPlainObject(baseValue) && isPlainObject(value)) {
      result[key] = deepMerge(baseValue, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Parse a single number from a number or a numeric string. */
function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Parse a numeric array from an array or a comma-separated string
 * (e.g. `"576357, 6386049"` → `[576357, 6386049]`). Returns `undefined`
 * when there is no valid numeric content.
 */
function toNumberArray(value: unknown): number[] | undefined {
  const parse = (items: unknown[]): number[] =>
    items
      .map((item) => toNumber(item))
      .filter((n): n is number => n !== undefined);

  if (Array.isArray(value)) {
    const numbers = parse(value);
    return numbers.length > 0 ? numbers : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const numbers = parse(trimmed.split(","));
    return numbers.length > 0 ? numbers : undefined;
  }
  return undefined;
}

/**
 * Admin stores booleans as the strings `"true"`/`"false"`. Returns `undefined`
 * when the value is absent, so a default can fill in via deep-merge.
 */
function toBoolOrUndefined(value: unknown): boolean | undefined {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/** Parse a JSON array from an array or a JSON string (used for `introductionSteps`). */
function toJsonArray(value: unknown): unknown[] | undefined {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Translates the admin map `options` (flat key/value, mostly strings) into the
 * typed/nested shape the client expects (`center: [x,y]`, `zoom: number`,
 * `colors: {...}`, `defaultCookieNoticeMessage`, etc.). See `App_Data/map_1.json`
 * for the reference client format consumed by `mapFactory.js`.
 */
function translateMapOptionsToClient(
  options: Prisma.JsonObject,
  context: { name: string; locked: boolean; projectionCode?: string }
): Record<string, unknown> {
  return {
    target: "map",
    name: context.name,
    locked: context.locked,
    title: toStringOrUndefined(options.title),
    ...(context.projectionCode ? { projection: context.projectionCode } : {}),

    // View geometry
    center: toNumberArray(options.centerCoordinate),
    origin: toNumberArray(options.origin),
    extent: toNumberArray(options.extent),
    resolutions: toNumberArray(options.resolutions),
    extraPrintResolutions: toNumberArray(options.printResolutions),
    zoom: toNumber(options.startZoom),
    minZoom: toNumber(options.minZoom),
    maxZoom: toNumber(options.maxZoom),
    constrainOnlyCenter: toBoolOrUndefined(options.constrainOnlyCenter),
    constrainResolution: toBoolOrUndefined(options.constrainResolution),
    constrainResolutionMobile: toBoolOrUndefined(
      options.constrainResolutionMobile
    ),

    // Appearance
    colors: {
      primaryColor: toStringOrUndefined(options.primaryColor),
      secondaryColor: toStringOrUndefined(options.secondaryColor),
      preferredColorScheme: toStringOrUndefined(options.preferredColorScheme),
    },
    logo: toStringOrUndefined(options.logoLight),
    logoLight: toStringOrUndefined(options.logoLight),
    logoDark: toStringOrUndefined(options.logoDark),
    geoserverLegendOptions: toStringOrUndefined(options.legendOptions),
    crossOrigin: toStringOrUndefined(options.crossOrigin),

    // Controls
    mapselector: toBoolOrUndefined(options.mapselector),
    mapcleaner: toBoolOrUndefined(options.mapcleaner),
    mapresetter: toBoolOrUndefined(options.mapresetter),
    showThemeToggler: toBoolOrUndefined(options.showThemeToggler),
    showUserAvatar: toBoolOrUndefined(options.showUserAvatar),
    showRecentlyUsedPlugins: toBoolOrUndefined(options.showRecentlyUsedPlugins),
    enableDownloadLink: toBoolOrUndefined(options.enableDownloadLink),
    enableAppStateInHash: toBoolOrUndefined(options.enableAppStateInHash),
    confirmOnWindowClose: toBoolOrUndefined(options.confirmOnWindowClose),

    // Side panel / drawer
    drawerStatic: toBoolOrUndefined(options.drawerStatic),
    drawerVisible: toBoolOrUndefined(options.drawerVisible),
    drawerVisibleMobile: toBoolOrUndefined(options.drawerVisibleMobile),
    drawerPermanent: toBoolOrUndefined(options.drawerPermanent),
    activeDrawerOnStart: toStringOrUndefined(options.drawerContent),
    drawerTitle: toStringOrUndefined(options.drawerTitle),
    drawerButtonTitle: toStringOrUndefined(options.drawerButtonTitle),
    drawerButtonIcon: toStringOrUndefined(options.drawerButtonIcon),

    // Interactions
    altShiftDragRotate: toBoolOrUndefined(options.altShiftDragRotate),
    onFocusOnly: toBoolOrUndefined(options.onFocusOnly),
    doubleClickZoom: toBoolOrUndefined(options.doubleClickZoom),
    keyboard: toBoolOrUndefined(options.keyboard),
    mouseWheelZoom: toBoolOrUndefined(options.mouseWheelZoom),
    shiftDragZoom: toBoolOrUndefined(options.shiftDragZoom),
    dragPan: toBoolOrUndefined(options.dragPan),
    pinchRotate: toBoolOrUndefined(options.pinchRotate),
    pinchZoom: toBoolOrUndefined(options.pinchZoom),
    zoomDelta: toNumber(options.zoomLevelDelta),
    zoomDuration: toNumber(options.zoomAnimationDuration),

    // Cookies
    showCookieNotice: toBoolOrUndefined(options.showCookieNotice),
    showCookieNoticeButton: toBoolOrUndefined(options.showCookieNoticeButton),
    cookieUse3dPart: toBoolOrUndefined(options.cookieUse3dPart),
    defaultCookieNoticeMessage: toStringOrUndefined(options.cookieMessage),
    defaultCookieNoticeUrl: toStringOrUndefined(options.cookieLink),

    // Introduction guide
    introductionEnabled: toBoolOrUndefined(options.introductionEnabled),
    introductionShowControlButton: toBoolOrUndefined(
      options.introductionShowControlButton
    ),
    introductionSteps: toJsonArray(options.introductionSteps),
  };
}

function mergeJsonObjects(
  base: Prisma.JsonValue,
  override: Prisma.JsonValue
): Prisma.JsonObject {
  const baseObj =
    base && typeof base === "object" && !Array.isArray(base)
      ? (base as Prisma.JsonObject)
      : {};
  const overrideObj =
    override && typeof override === "object" && !Array.isArray(override)
      ? (override as Prisma.JsonObject)
      : {};
  return { ...baseObj, ...overrideObj };
}

export async function buildClientProjectionsForMap(mapName: string) {
  const map = await prisma.map.findFirst({
    where: { name: mapName },
    include: { projections: true },
  });

  if (!map) {
    return [];
  }

  return map.projections.map((projection) => ({
    code: projection.code,
    definition: projection.definition,
    extent: projection.extent.map((value) => Number(value)),
    units: projection.units,
  }));
}

export async function buildClientMapForMap(mapName: string) {
  const map = await prisma.map.findFirst({
    where: { name: mapName },
    include: { projection: true },
  });

  if (!map) {
    return null;
  }

  const options =
    map.options && typeof map.options === "object" && !Array.isArray(map.options)
      ? (map.options as Prisma.JsonObject)
      : {};

  const projectionCode =
    map.projection?.code ??
    (typeof options.projection === "string" ? options.projection : undefined);

  const translated = translateMapOptionsToClient(options, {
    name: map.name,
    locked: map.locked,
    projectionCode,
  });

  // Deep-merge defaults first, DB/translated values on top, so the client always
  // receives a complete map config even when stored `options` is sparse.
  return deepMerge(DEFAULT_MAP_OPTIONS, translated);
}

export async function buildClientToolsForMap(mapName: string) {
  const [toolsOnMap, groups, baselayers, themes] = await Promise.all([
    prisma.toolsOnMaps.findMany({
      where: { mapName },
      include: { tool: true },
      orderBy: { index: "asc" },
    }),
    buildLayerSwitcherGroupsForMap(mapName),
    buildLayerSwitcherBaselayersForMap(mapName),
    prisma.theme.findMany({
      where: { mapName },
      orderBy: { title: "asc" },
    }),
  ]);

  const quickAccessPresets = themes.map((theme) => {
    const payload =
      theme.data && typeof theme.data === "object" && !Array.isArray(theme.data)
        ? (theme.data as Record<string, unknown>)
        : {};
    const layers = Array.isArray(payload.layers) ? payload.layers : [];
    const metadata =
      payload.metadata &&
      typeof payload.metadata === "object" &&
      !Array.isArray(payload.metadata)
        ? payload.metadata
        : {};

    return {
      id: String(theme.id),
      title: theme.title,
      author: theme.owner ?? "",
      description: theme.description ?? "",
      keywords: theme.keywords,
      layers,
      metadata,
    };
  });

  return toolsOnMap.map((entry) => {
    const mergedOptions = mergeJsonObjects(entry.tool.options, entry.options);
    const legacyTarget = legacyTargetForBackendZone(entry.target);
    const options =
      legacyTarget != null
        ? mergeJsonObjects(mergedOptions, { target: legacyTarget })
        : mergedOptions;

    if (entry.tool.type === "layerswitcher") {
      return {
        type: entry.tool.type,
        index: entry.index,
        options: {
          ...options,
          groups,
          baselayers,
          ...(quickAccessPresets.length > 0 ? { quickAccessPresets } : {}),
        },
      };
    }

    return {
      type: entry.tool.type,
      index: entry.index,
      options,
    };
  });
}
