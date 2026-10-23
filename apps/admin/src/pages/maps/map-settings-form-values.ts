import type { FieldValues } from "react-hook-form";
import type { Map as MapRecord, MapMutation } from "../../api/maps/types";
import { getDefaultMapProjectionCode } from "../../lib/map-defaults";

interface MapProjectionSource {
  projection?: { code: string } | null;
  projections?: { code: string }[] | null;
  options?: Record<string, string>;
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

function fromOptionFlag(value: string | undefined): boolean {
  return value === "true";
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

function getFormOptions(data: FieldValues): Record<string, unknown> {
  const options: unknown = data.options;
  if (options && typeof options === "object" && !Array.isArray(options)) {
    return options as Record<string, unknown>;
  }
  return {};
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

function buildOptionsFormValues(
  options: Record<string, string>,
): Record<string, unknown> {
  return {
    startZoom: options.startZoom ?? "1.33",
    maxZoom: options.maxZoom ?? "8",
    minZoom: options.minZoom ?? "0",
    centerCoordinate: options.centerCoordinate ?? "576357, 6386049",
    origin: options.origin ?? "0,0",
    extent: options.extent ?? "-1200000, 4700000, 2600000, 8500000",
    resolutions:
      options.resolutions ?? "2048, 1024, 512, 256, 128, 64, 32, 16, 8",
    printResolutions: options.printResolutions ?? "",
    constrainResolution: fromOptionFlag(options.constrainResolution),
    constrainOnlyCenter: fromOptionFlag(options.constrainOnlyCenter),
    constrainResolutionMobile: fromOptionFlag(
      options.constrainResolutionMobile,
    ),
    enableDownloadLink: fromOptionFlag(options.enableDownloadLink),
    enableAppStateInHash: fromOptionFlag(options.enableAppStateInHash),
    confirmOnWindowClose: fromOptionFlag(options.confirmOnWindowClose),
    logoLight: options.logoLight ?? "/logoLight.png",
    logoDark: options.logoDark ?? "/logoDark.png",
    legendOptions: options.legendOptions ?? "",
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
    zoomLevelDelta: options.zoomLevelDelta ?? "",
    zoomAnimationDuration: options.zoomAnimationDuration ?? "",
    preferredColorScheme: options.preferredColorScheme ?? "user",
    primaryColor: options.primaryColor ?? "#333333",
    secondaryColor: options.secondaryColor ?? "#ffa000",
    drawerStatic: fromOptionFlag(options.drawerStatic),
    drawerVisible: fromOptionFlag(options.drawerVisible),
    drawerVisibleMobile: fromOptionFlag(options.drawerVisibleMobile),
    drawerPermanent: fromOptionFlag(options.drawerPermanent),
    drawerContent: options.drawerContent ?? "plugins",
    drawerTitle: options.drawerTitle ?? "Kartverktyg",
    drawerButtonTitle: options.drawerButtonTitle ?? "Kartverktyg",
    drawerButtonIcon: options.drawerButtonIcon ?? "MapIcon",
    showCookieNotice: fromOptionFlag(options.showCookieNotice),
    cookieUse3dPart: fromOptionFlag(options.cookieUse3dPart),
    showCookieNoticeButton: fromOptionFlag(options.showCookieNoticeButton),
    cookieLink:
      options.cookieLink ??
      "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/",
    cookieMessage:
      options.cookieMessage ??
      "Vi använder cookies för att följa upp användandet och ge en bra upplevelse av kartan. Du kan blockera cookies i webbläsaren men då visas detta meddelande igen.",
    introductionEnabled: fromOptionFlag(options.introductionEnabled),
    introductionShowControlButton: fromOptionFlag(
      options.introductionShowControlButton,
    ),
    introductionSteps: options.introductionSteps ?? "[]",
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

function formOptionsFromValues(data: FieldValues): Record<string, string> {
  const options = getFormOptions(data);
  const projectionCode = getProjectionCode(data);

  return {
    projection: projectionCode,
    startZoom: toStringValue(options.startZoom, "1.33"),
    maxZoom: String(toNumber(options.maxZoom) ?? 8),
    minZoom: String(toNumber(options.minZoom) ?? 0),
    centerCoordinate: toStringValue(
      options.centerCoordinate,
      "576357, 6386049",
    ),
    origin: toStringValue(options.origin, "0,0"),
    extent: toStringValue(
      options.extent,
      "-1200000, 4700000, 2600000, 8500000",
    ),
    resolutions: toStringValue(
      options.resolutions,
      "2048, 1024, 512, 256, 128, 64, 32, 16, 8",
    ),
    printResolutions: toStringValue(options.printResolutions, ""),
    constrainResolution: toOptionFlag(options.constrainResolution),
    constrainOnlyCenter: toOptionFlag(options.constrainOnlyCenter),
    constrainResolutionMobile: toOptionFlag(options.constrainResolutionMobile),
    enableDownloadLink: toOptionFlag(options.enableDownloadLink),
    enableAppStateInHash: toOptionFlag(options.enableAppStateInHash),
    confirmOnWindowClose: toOptionFlag(options.confirmOnWindowClose),
    logoLight: toStringValue(options.logoLight, "/logoLight.png"),
    logoDark: toStringValue(options.logoDark, ""),
    legendOptions: toStringValue(options.legendOptions, ""),
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
    zoomLevelDelta: String(toNumber(options.zoomLevelDelta) ?? ""),
    zoomAnimationDuration: String(
      toNumber(options.zoomAnimationDuration) ?? "",
    ),
    preferredColorScheme: toStringValue(options.preferredColorScheme, "user"),
    primaryColor: toStringValue(options.primaryColor, "#333333"),
    secondaryColor: toStringValue(options.secondaryColor, "#ffa000"),
    drawerStatic: toOptionFlag(options.drawerStatic),
    drawerVisible: toOptionFlag(options.drawerVisible),
    drawerVisibleMobile: toOptionFlag(options.drawerVisibleMobile),
    drawerPermanent: toOptionFlag(options.drawerPermanent),
    drawerContent: toStringValue(options.drawerContent, "plugins"),
    drawerTitle: toStringValue(options.drawerTitle, "Kartverktyg"),
    drawerButtonTitle: toStringValue(options.drawerButtonTitle, "Kartverktyg"),
    drawerButtonIcon: toStringValue(options.drawerButtonIcon, "MapIcon"),
    showCookieNotice: toOptionFlag(options.showCookieNotice),
    cookieUse3dPart: toOptionFlag(options.cookieUse3dPart),
    showCookieNoticeButton: toOptionFlag(options.showCookieNoticeButton),
    cookieLink: toStringValue(
      options.cookieLink,
      "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/",
    ),
    cookieMessage: toStringValue(
      options.cookieMessage,
      "Vi använder cookies för att följa upp användandet och ge en bra upplevelse av kartan. Du kan blockera cookies i webbläsaren men då visas detta meddelande igen.",
    ),
    introductionEnabled: toOptionFlag(options.introductionEnabled),
    introductionShowControlButton: toOptionFlag(
      options.introductionShowControlButton,
    ),
    introductionSteps: toStringValue(options.introductionSteps, "[]"),
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
    },
  };
}
