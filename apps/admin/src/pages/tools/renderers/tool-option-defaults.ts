// Matches AnchorView.jsx's own fallbacks. Used as the isDirty baseline in settings.tsx.
export const anchorDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  allowCreatingCleanUrls: true,
  instruction: "",
  visibleForGroups: [],
};

// Used as the isDirty baseline in settings.tsx.
export const bookmarksDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  visibleForGroups: [],
};

// Used as the isDirty baseline in settings.tsx. Client BufferModel.js takes
// only {map, localObserver} — no options at all. The legacy varbergVer/
// geoserverUrl/notFeatureLayers/geoserverNameToCategoryName fields are dead:
// buffering is computed entirely client-side now, no geoserver round-trip.
export const bufferDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  visibleForGroups: [],
};

// Used as the isDirty baseline in settings.tsx. Matches CoordinatesModel.js's
// own fallbacks (client MapClickModel is not involved here).
export const coordinatesDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  visibleForGroups: [],
  thousandSeparator: false,
  showFieldsOnStart: false,
  src: "marker.png",
  anchor: [0.5, 1],
  scale: 0.15,
  transformations: [],
};

// ExternalLinks isn't a BaseWindowPlugin (client controls/ExternalLinks.jsx)
// — no window placement, instruction tooltip, or visibleAtStart to configure.
export const externalLinksDefaults: Record<string, unknown> = {
  title: "Öppna koordinat i extern applikation", // client ExternalLinks.jsx:34 fallback
  list: [],
  visibleForGroups: [],
};

// Used as the isDirty baseline in settings.tsx. drawFillColor/drawStrokeColor
// are plain CSS rgba() strings (MapViewModel.js), not {r,g,b,a} objects like
// print/infoclick use. title/description are hardcoded in FmeServer.jsx's
// `custom` prop, so — like streetview — they're not exposed here.
export const fmeserverDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  visibleForGroups: [],
  drawFillColor: "rgba(255,255,255,0.07)",
  drawStrokeColor: "rgba(74,74,74,0.5)",
  groupDisplayName: "Grupp",
  productGroups: [],
  products: [],
};

// Matches the client's own fallbacks (FeaturePropsParsing.jsx, MapClickModel.js,
// customComponentsForReactMarkdown.jsx). Used as the isDirty baseline in settings.tsx.
export const infoclickDefaults: Record<string, unknown> = {
  title: "",
  description: "",
  instruction: "",
  visibleAtStart: false,
  visibleForGroups: [],
  allowDangerousHtml: true,
  useNewInfoclick: false,
  useNewPlaceholderMatching: false,
  useLevel1FeatureHighlight: false,
  transformLinkUri: true,
  linksColor: "primary",
  linksUnderline: "always",
  src: "",
  anchor: [0.5, 1],
  scale: 0.15,
  strokeWidth: 4,
  strokeColor: { r: 200, g: 0, b: 0, a: 0.7 },
  fillColor: { r: 255, g: 0, b: 0, a: 0.1 },
};

// Matches Information.jsx's own fallback for `title`. Used as the isDirty baseline in settings.tsx.
export const informationDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  showInfoOnce: false,
  title: "Om kartan",
  headerText: "Om kartan",
  text: "Information om kartan",
  buttonText: "Stäng",
  visibleForGroups: [],
};

// Used as the isDirty baseline in settings.tsx.
export const layerswitcherDefaults: Record<string, unknown> = {
  title: "",
  description: "",
  visibleAtStart: false,
  visibleAtStartMobile: false,
  showBreadcrumbs: false,
  showDrawOrderView: false,
  showFilter: false,
  showQuickAccess: false,
  legendForceTransparency: false,
  legendTryHiDPI: false,
  enableTransparencySlider: true,
  cqlFilterVisible: false,
  enableSystemLayersSwitch: false,
  lockDrawOrderBaselayer: false,
  drawOrderViewInfoText: "",
  enableQuickAccessPresets: false,
  quickAccessTopicsInfoText: "",
  enableUserQuickAccessFavorites: false,
  userQuickAccessFavoritesInfoText: "",
  dropdownThemeMaps: false,
  themeMapHeaderCaption: "",
  minMaxZoomAlertOnToggleOnly: false,
  backgroundSwitcherBlack: true,
  backgroundSwitcherWhite: true,
  enableOSM: false,
  OSMVisibleAtStart: false,
  renderSpecialBackgroundsAtBottom: false,
  instruction: "",
};

// Used as the isDirty baseline in settings.tsx.
export const locationDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  visibleForGroups: [],
};

// Used as the isDirty baseline in settings.tsx.
export const measurerDefaults: Record<string, unknown> = {
  visibleAtStart: false,
};

// Preset isn't a BaseWindowPlugin (client PresetLinks.jsx) — no window
// placement, instruction tooltip, or visibleAtStart to configure.
export const presetDefaults: Record<string, unknown> = {
  title: "Snabbval", // client PresetLinks.jsx:38 `this.options.title || "Snabbval"`
  presetList: [],
  visibleForGroups: [],
};

// Matches PrintView.jsx's own fallbacks. Note includeNorthArrow is `false`
// here, not `true` like old legacy admin — the client changed since then.
// Used as the isDirty baseline in settings.tsx.
export const printDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  useCustomTileLoaders: true,
  maxTileSize: 4096,
  instruction: "",
  copyright: "",
  disclaimer: "",
  date: "",
  scales: "",
  scaleMeters: "",
  dpis: "",
  paperFormats: "",
  logo: "",
  northArrow: "",
  includeLogo: true,
  includeNorthArrow: false,
  includeScaleBar: true,
  includeQrCode: false,
  includeImageBorder: false,
  logoPlacement: "topRight",
  northArrowPlacement: "topLeft",
  scaleBarPlacement: "bottomLeft",
  qrCodePlacement: "topRight",
  mapTextColor: "#000000",
};

// Used as the isDirty baseline in settings.tsx.
export const routingDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  visibleForGroups: [],
  apiKey: "",
};

// Used as the isDirty baseline in settings.tsx.
export const searchDefaults: Record<string, unknown> = {
  searchInfoText: "",
  maxHitsPerDataset: 1000,
  autoSearchDelay: 500,
  showInfoWhenExceeded: false,
  disableAutocomplete: false,
  disableAutoCombinations: false,
  wildcardBeforeSearch: false,
  autofocusSearch: false,
  enablePolygonSearch: true,
  enableRadiusSearch: true,
  enableAreaSearch: true,
  searchWithinView: false,
  searchVisibleLayers: true,
  wildcardBefore: true,
  wildcardAfter: true,
  caseSensitive: true,
  requireFullObject: true,
  showResultLabel: true,
  preSelected: true,
  autoShowAllResultsOnMap: false,
  allowResultFiltering: false,
  allowResultSorting: false,
  allowQuickClearSelection: false,
  allowDownloadResults: false,
  showPreviewOnHover: false,
  collectSelectedResults: false,
  showPrevNextButtons: false,
  maxZoomLevel: -1,
  hitIcon: "",
  iconDisplacementX: 0,
  iconDisplacementY: 0,
  iconScale: 1,
  strokeColor: "",
  strokeOpacity: "",
  standardResultsMarkedFillColor: "",
  standardResultsMarkedFrameColor: "",
  markedResultsTextFillColor: "",
  markedResultsTextFrameColor: "",
  markedResultsMarkedFillColor: "",
  markedResultsMarkedFrameColor: "",
  activeResultTextFillColor: "",
  activeResultTextFrameColor: "",
  activeResultMarkedFillColor: "",
  activeResultMarkedFrameColor: "",
};

// Matches Sketch.jsx's own fallback. Used as the isDirty baseline in settings.tsx.
export const sketchDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  visibleForGroups: [],
};

// Used as the isDirty baseline in settings.tsx.
export const streetviewDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  visibleForGroups: [],
  apiKey: "",
};

// Per-type option defaults, used by settings.tsx as the isDirty baseline.
// documenthandler isn't here yet — its fields don't use the `options.*` naming.
const toolOptionDefaults: Record<string, Record<string, unknown>> = {
  print: printDefaults,
  infoclick: infoclickDefaults,
  anchor: anchorDefaults,
  sketch: sketchDefaults,
  measurer: measurerDefaults,
  streetview: streetviewDefaults,
  search: searchDefaults,
  layerswitcher: layerswitcherDefaults,
  location: locationDefaults,
  bookmarks: bookmarksDefaults,
  routing: routingDefaults,
  information: informationDefaults,
  preset: presetDefaults,
  coordinates: coordinatesDefaults,
  buffer: bufferDefaults,
  fmeserver: fmeserverDefaults,
  externalLinks: externalLinksDefaults,
};

export const getToolOptionDefaults = (
  type: string | undefined,
): Record<string, unknown> =>
  (type ? toolOptionDefaults[type] : undefined) ?? {};
