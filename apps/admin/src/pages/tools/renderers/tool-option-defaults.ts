// Matches AnchorView.jsx's own fallbacks. Used as the isDirty baseline in settings.tsx.
export const anchorDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  allowCreatingCleanUrls: true,
  instruction: "",
  visibleForGroups: [],
};

// The client's own fallbacks. Window placement and size are set per map.
export const attributeeditorDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  visibleForGroups: [],
  title: "Attributredigerare",
  description: "Redigera attribut för WFS-lager",
  zoomLevel: 6,
  activeServices: [],
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

// Command palette opens from the keyboard. target and index are not a placement.
export const commandpaletteDefaults: Record<string, unknown> = {
  visibleForGroups: [],
};

// Matches the legacy feedback tool options. Window placement is per map.
export const feedbackDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  visibleAtStartMobile: false,
  visibleForGroups: [],
  title: "Tyck till",
  description: "Skicka synpunkter till oss",
  instructionText:
    "Har du synpunkter på kartan eller dess innehåll? Skriv dem här.",
  thankYouText: "Tack för din återkoppling!",
  maxLength: 2000,
};

// Matches FloodSimulator DEFAULT_OPTIONS. Empty optional fields stay unset.
export const floodsimulatorDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  visibleForGroups: [],
  title: "Översvämning",
  description: "Simulera en stigande vattennivå",
  elevationUrl: "",
  elevationEncoding: "terrarium",
  crossOrigin: "anonymous",
  tileSize: 256,
  minZoom: 0,
  maxZoom: 15,
  attributions: "",
  minLevel: 0,
  maxLevel: 10,
  levelStep: 0.01,
  defaultLevel: 1,
  animationDurationMs: 8000,
  showElevationReadout: true,
  minElevation: -100,
  maxElevation: 100,
  waterColor: "#86cbf9",
  deepWaterColor: "#283d4b",
  depthColors: [],
  layerOpacity: 0.6,
  enableDepthShading: false,
  interpolate: true,
  smoothDepthColors: true,
  maxShadingDepth: 5,
  maxResolutionSlack: 1,
  elevationExtent: null,
  elevationTileGrid: null,
  terrainZoomByMapZoom: null,
  hideAtMinZoom: null,
  minMapZoom: null,
  maxResolution: null,
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

export const dummyDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  visibleForGroups: [],
};

export const layercomparerDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  visibleForGroups: [],
  showNonBaseLayersInSelect: false,
  selectChosenLayers: false,
  chosenLayers: [],
  startCompareMode: "sideBySide",
};

export const editDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  visibleForGroups: [],
  activeServices: [],
};

export const timesliderDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  title: "Tidslinje",
  layers: [],
  defaultResolution: "years",
};

export const collectorDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  visibleForGroups: [],
  url: "",
  title: "Tyck till",
  abstract: "Vi vill veta vad du tycker!",
  headerText: "",
  showThankYou: true,
  thankYou: "",
  collectAgain: false,
  wkt: false,
  serviceId: "",
  featureType: "",
  featureNS: "",
  form: [],
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
  commandpalette: commandpaletteDefaults,
  feedback: feedbackDefaults,
  floodsimulator: floodsimulatorDefaults,
  attributeeditor: attributeeditorDefaults,
  dummy: dummyDefaults,
  layercomparer: layercomparerDefaults,
  edit: editDefaults,
  timeslider: timesliderDefaults,
  collector: collectorDefaults,
};

export const getToolOptionDefaults = (
  type: string | undefined,
): Record<string, unknown> =>
  (type ? toolOptionDefaults[type] : undefined) ?? {};
