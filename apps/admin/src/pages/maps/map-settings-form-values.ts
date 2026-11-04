import type { FieldValues } from "react-hook-form";
import type { Map as MapRecord, MapMutation } from "../../api/maps/types";
import { getDefaultMapProjectionCode } from "../../lib/map-defaults";
import { deriveScalesFromOptions } from "./map-scales";
import { fromDateTimeLocal, toDateTimeLocal } from "./map-visibility";

interface MapProjectionSource {
  projection?: { code: string } | null;
  projections?: { code: string }[] | null;
  options?: Record<string, unknown>;
}

/** Unique, trimmed projection codes from a many-to-many projections array. */
function getMapProjectionCodes(
  projections: { code?: string | null }[] | null | undefined,
): string[] {
  if (!Array.isArray(projections)) return [];
  const codes = projections
    .map((projection) =>
      typeof projection?.code === "string" ? projection.code.trim() : "",
    )
    .filter((code) => code.length > 0);
  return Array.from(new Set(codes));
}

/** Reads the selected projection codes (string[]) from the form values. */
function getFormProjectionCodes(data: FieldValues): string[] {
  const value: unknown = data.projections;
  if (!Array.isArray(value)) return [];
  const codes = value
    .map((code) => (typeof code === "string" ? code.trim() : ""))
    .filter((code) => code.length > 0);
  return Array.from(new Set(codes));
}

/** Map files store real booleans, Admin saves them as text. */
function fromOptionFlag(value: unknown): boolean {
  return value === true || value === "true";
}

function toOptionFlag(value: unknown): string {
  return String(Boolean(value));
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const n = Number(trimmed);
    return Number.isNaN(n) ? undefined : n;
  }
  if (typeof value === "number") {
    return Number.isNaN(value) ? undefined : value;
  }
  return undefined;
}

function toStringValue(value: unknown, fallback: string): string {
  if (value == null || value === "") return fallback;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function getFormOptions(data: FieldValues): Record<string, unknown> {
  return toRecord(data.options);
}

function getMapProjectionCode(map: MapProjectionSource): string {
  const projectionCode = map.projection?.code;
  if (typeof projectionCode === "string" && projectionCode.trim()) {
    return projectionCode.trim();
  }
  const optionsProjection = map.options?.projection;
  if (typeof optionsProjection === "string" && optionsProjection.trim()) {
    return optionsProjection.trim();
  }
  return getDefaultMapProjectionCode();
}

function getProjectionCode(data: FieldValues, fallback?: string): string {
  const projection: unknown = data.projection;
  if (
    projection &&
    typeof projection === "object" &&
    !Array.isArray(projection)
  ) {
    const code = (projection as { code?: unknown }).code;
    if (typeof code === "string" && code.trim()) {
      return code.trim();
    }
  }
  return fallback ?? getDefaultMapProjectionCode();
}

/** Map files store numbers and arrays; the form and saved options use text. */
function asText(value: unknown): string | undefined {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value : undefined;
}

function stepsAsText(value: unknown): string | undefined {
  return Array.isArray(value) ? JSON.stringify(value) : asText(value);
}

function buildOptionsFormValues(
  options: Record<string, unknown>,
): Record<string, unknown> {
  const colors = toRecord(options.colors);
  const zoomOptions = {
    zoom: asText(options.zoom) ?? "1.33",
    maxZoom: asText(options.maxZoom) ?? "8",
    minZoom: asText(options.minZoom) ?? "0",
    resolutions:
      asText(options.resolutions) ?? "2048, 1024, 512, 256, 128, 64, 32, 16, 8",
    extraPrintResolutions: asText(options.extraPrintResolutions) ?? "",
  };

  return {
    ...zoomOptions,
    // Form-only: scales are always derived and never saved.
    ...deriveScalesFromOptions(zoomOptions),
    center: asText(options.center) ?? "576357, 6386049",
    origin: asText(options.origin) ?? "0,0",
    extent: asText(options.extent) ?? "-1200000, 4700000, 2600000, 8500000",
    constrainResolution: fromOptionFlag(options.constrainResolution),
    constrainOnlyCenter: fromOptionFlag(options.constrainOnlyCenter),
    constrainResolutionMobile: fromOptionFlag(
      options.constrainResolutionMobile,
    ),
    enableDownloadLink: fromOptionFlag(options.enableDownloadLink),
    enableAppStateInHash: fromOptionFlag(options.enableAppStateInHash),
    confirmOnWindowClose: fromOptionFlag(options.confirmOnWindowClose),
    logoLight: options.logoLight ?? options.logo ?? "/logoLight.png",
    logoDark: options.logoDark ?? "/logoDark.png",
    geoserverLegendOptions: options.geoserverLegendOptions ?? "",
    crossOrigin: options.crossOrigin ?? "anonymous",
    mapselector: fromOptionFlag(options.mapselector),
    mapSelectorStyle:
      options.mapSelectorStyle === "dropdown" ? "dropdown" : "button",
    mapcleaner: fromOptionFlag(options.mapcleaner),
    mapresetter: fromOptionFlag(options.mapresetter),
    showThemeToggler: fromOptionFlag(options.showThemeToggler),
    showUserAvatar: fromOptionFlag(options.showUserAvatar),
    showRecentlyUsedPlugins: fromOptionFlag(options.showRecentlyUsedPlugins),
    altShiftDragRotate: fromOptionFlag(options.altShiftDragRotate),
    onFocusOnly: fromOptionFlag(options.onFocusOnly),
    doubleClickZoom: fromOptionFlag(options.doubleClickZoom),
    keyboard: fromOptionFlag(options.keyboard),
    mouseWheelZoom: fromOptionFlag(options.mouseWheelZoom),
    shiftDragZoom: fromOptionFlag(options.shiftDragZoom),
    dragPan: fromOptionFlag(options.dragPan),
    pinchRotate: fromOptionFlag(options.pinchRotate),
    pinchZoom: fromOptionFlag(options.pinchZoom),
    zoomDelta: asText(options.zoomDelta) ?? "",
    zoomDuration: asText(options.zoomDuration) ?? "",
    colors: {
      preferredColorScheme: colors.preferredColorScheme ?? "user",
      primaryColor: colors.primaryColor ?? "#333333",
      secondaryColor: colors.secondaryColor ?? "#ffa000",
    },
    drawerStatic: fromOptionFlag(options.drawerStatic),
    drawerVisible: fromOptionFlag(options.drawerVisible),
    drawerVisibleMobile: fromOptionFlag(options.drawerVisibleMobile),
    drawerPermanent: fromOptionFlag(options.drawerPermanent),
    activeDrawerOnStart: options.activeDrawerOnStart ?? "plugins",
    drawerTitle: options.drawerTitle ?? "Kartverktyg",
    drawerButtonTitle: options.drawerButtonTitle ?? "Kartverktyg",
    drawerButtonIcon: options.drawerButtonIcon ?? "MapIcon",
    showCookieNotice: fromOptionFlag(options.showCookieNotice),
    cookieUse3dPart: fromOptionFlag(options.cookieUse3dPart),
    showCookieNoticeButton: fromOptionFlag(options.showCookieNoticeButton),
    defaultCookieNoticeUrl:
      options.defaultCookieNoticeUrl ??
      "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/",
    defaultCookieNoticeMessage:
      options.defaultCookieNoticeMessage ??
      "Vi använder cookies för att följa upp användandet och ge en bra upplevelse av kartan. Du kan blockera cookies i webbläsaren men då visas detta meddelande igen.",
    introductionEnabled: fromOptionFlag(options.introductionEnabled),
    introductionShowControlButton: fromOptionFlag(
      options.introductionShowControlButton,
    ),
    introductionSteps: stepsAsText(options.introductionSteps) ?? "[]",
    visible: options.visible !== "false",
    visibleFrom: toDateTimeLocal(options.visibleFrom),
    visibleUntil: toDateTimeLocal(options.visibleUntil),
  };
}

/** Form shape used by map settings reset / dirty comparison. */
export function buildMapSettingsFormValues(map: MapRecord): FieldValues {
  const projectionCode = getMapProjectionCode(map);
  // Always include the main projection in the linked set so the multi-select
  // and the single projection field stay consistent.
  const projectionCodes = Array.from(
    new Set([projectionCode, ...getMapProjectionCodes(map.projections)]),
  );

  return {
    name: map.name ?? "",
    locked: map.locked ?? false,
    projection: {
      code: projectionCode,
    },
    projections: projectionCodes,
    options: buildOptionsFormValues(map.options ?? {}),
  };
}

function formOptionsFromValues(data: FieldValues): Record<string, unknown> {
  const options = getFormOptions(data);
  const colors = toRecord(options.colors);
  const projectionCode = getProjectionCode(data);

  return {
    projection: projectionCode,
    zoom: toStringValue(options.zoom, "1.33"),
    maxZoom: String(toNumber(options.maxZoom) ?? 8),
    minZoom: String(toNumber(options.minZoom) ?? 0),
    center: toStringValue(options.center, "576357, 6386049"),
    origin: toStringValue(options.origin, "0,0"),
    extent: toStringValue(
      options.extent,
      "-1200000, 4700000, 2600000, 8500000",
    ),
    resolutions: toStringValue(
      options.resolutions,
      "2048, 1024, 512, 256, 128, 64, 32, 16, 8",
    ),
    extraPrintResolutions: toStringValue(options.extraPrintResolutions, ""),
    constrainResolution: toOptionFlag(options.constrainResolution),
    constrainOnlyCenter: toOptionFlag(options.constrainOnlyCenter),
    constrainResolutionMobile: toOptionFlag(options.constrainResolutionMobile),
    enableDownloadLink: toOptionFlag(options.enableDownloadLink),
    enableAppStateInHash: toOptionFlag(options.enableAppStateInHash),
    confirmOnWindowClose: toOptionFlag(options.confirmOnWindowClose),
    logoLight: toStringValue(options.logoLight, "/logoLight.png"),
    logoDark: toStringValue(options.logoDark, ""),
    geoserverLegendOptions: toStringValue(options.geoserverLegendOptions, ""),
    crossOrigin: toStringValue(options.crossOrigin, "anonymous"),
    mapselector: toOptionFlag(options.mapselector),
    mapSelectorStyle:
      options.mapSelectorStyle === "dropdown" ? "dropdown" : "button",
    mapcleaner: toOptionFlag(options.mapcleaner),
    mapresetter: toOptionFlag(options.mapresetter),
    showThemeToggler: toOptionFlag(options.showThemeToggler),
    showUserAvatar: toOptionFlag(options.showUserAvatar),
    showRecentlyUsedPlugins: toOptionFlag(options.showRecentlyUsedPlugins),
    altShiftDragRotate: toOptionFlag(options.altShiftDragRotate),
    onFocusOnly: toOptionFlag(options.onFocusOnly),
    doubleClickZoom: toOptionFlag(options.doubleClickZoom),
    keyboard: toOptionFlag(options.keyboard),
    mouseWheelZoom: toOptionFlag(options.mouseWheelZoom),
    shiftDragZoom: toOptionFlag(options.shiftDragZoom),
    dragPan: toOptionFlag(options.dragPan),
    pinchRotate: toOptionFlag(options.pinchRotate),
    pinchZoom: toOptionFlag(options.pinchZoom),
    zoomDelta: String(toNumber(options.zoomDelta) ?? ""),
    zoomDuration: String(toNumber(options.zoomDuration) ?? ""),
    colors: {
      preferredColorScheme: toStringValue(colors.preferredColorScheme, "user"),
      primaryColor: toStringValue(colors.primaryColor, "#333333"),
      secondaryColor: toStringValue(colors.secondaryColor, "#ffa000"),
    },
    drawerStatic: toOptionFlag(options.drawerStatic),
    drawerVisible: toOptionFlag(options.drawerVisible),
    drawerVisibleMobile: toOptionFlag(options.drawerVisibleMobile),
    drawerPermanent: toOptionFlag(options.drawerPermanent),
    activeDrawerOnStart: toStringValue(options.activeDrawerOnStart, "plugins"),
    drawerTitle: toStringValue(options.drawerTitle, "Kartverktyg"),
    drawerButtonTitle: toStringValue(options.drawerButtonTitle, "Kartverktyg"),
    drawerButtonIcon: toStringValue(options.drawerButtonIcon, "MapIcon"),
    showCookieNotice: toOptionFlag(options.showCookieNotice),
    cookieUse3dPart: toOptionFlag(options.cookieUse3dPart),
    showCookieNoticeButton: toOptionFlag(options.showCookieNoticeButton),
    defaultCookieNoticeUrl: toStringValue(
      options.defaultCookieNoticeUrl,
      "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/",
    ),
    defaultCookieNoticeMessage: toStringValue(
      options.defaultCookieNoticeMessage,
      "Vi använder cookies för att följa upp användandet och ge en bra upplevelse av kartan. Du kan blockera cookies i webbläsaren men då visas detta meddelande igen.",
    ),
    introductionEnabled: toOptionFlag(options.introductionEnabled),
    introductionShowControlButton: toOptionFlag(
      options.introductionShowControlButton,
    ),
    introductionSteps: toStringValue(options.introductionSteps, "[]"),
    // Only an unticked box hides the map.
    visible: options.visible === false ? "false" : "true",
    visibleFrom: fromDateTimeLocal(options.visibleFrom),
    visibleUntil: fromDateTimeLocal(options.visibleUntil),
  };
}

export function buildMapUpdatePayload(
  data: FieldValues,
  map: MapProjectionSource & Pick<MapRecord, "name" | "locked">,
): Partial<MapMutation> {
  const formOptions = formOptionsFromValues(data);
  const projectionCode = getProjectionCode(data, getMapProjectionCode(map));
  // Ensure the main projection is part of the linked many-to-many set.
  const projectionCodes = Array.from(
    new Set([projectionCode, ...getFormProjectionCodes(data)]),
  );

  return {
    name: (data.name as string) ?? map.name ?? "",
    locked: (data.locked as boolean) ?? map.locked ?? false,
    projection: { code: projectionCode },
    projections: projectionCodes.map((code) => ({ code })),
    options: {
      ...(map.options ?? {}),
      ...formOptions,
      colors: {
        ...toRecord(map.options?.colors),
        ...toRecord(formOptions.colors),
      },
    },
  };
}
