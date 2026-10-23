/**
 * Central default values for application data stored in JSONB `options` columns.
 *
 * Per ROADMAP-admin.md: Prisma can't set defaults for JSONB objects, so we keep
 * them here and deep-merge (defaults first, DB values on top) when building API
 * responses. This guarantees the client always receives a complete object, even
 * for maps whose stored `options` is sparse.
 *
 * Values mirror the client's expected (typed/nested) map config — see
 * `App_Data/map_1.json` and `apps/client/src/models/appModel/mapFactory.js`.
 */
export const DEFAULT_MAP_OPTIONS: Record<string, unknown> = {
  target: "map",
  title: "",
  projection: "EPSG:3006",

  // View geometry
  center: [576357, 6386049],
  origin: [0, 0],
  extent: [-1200000, 4700000, 2600000, 8500000],
  resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8],
  extraPrintResolutions: [],
  zoom: 1.33,
  minZoom: 0,
  maxZoom: 8,
  constrainOnlyCenter: false,
  constrainResolution: false,
  constrainResolutionMobile: false,

  // Appearance
  colors: {
    primaryColor: "#333333",
    secondaryColor: "#ffa000",
    preferredColorScheme: "user",
  },
  logo: "/logoLight.png",
  logoLight: "/logoLight.png",
  logoDark: "/logoDark.png",
  geoserverLegendOptions: "",
  crossOrigin: "anonymous",

  // Controls
  mapselector: false,
  mapSelectorStyle: "button",
  mapcleaner: false,
  mapresetter: false,
  showThemeToggler: false,
  showUserAvatar: false,
  showRecentlyUsedPlugins: false,
  enableDownloadLink: false,
  enableAppStateInHash: false,
  confirmOnWindowClose: false,

  // Side panel / drawer
  drawerStatic: false,
  drawerVisible: false,
  drawerVisibleMobile: false,
  drawerPermanent: false,
  activeDrawerOnStart: "plugins",
  drawerTitle: "Kartverktyg",
  drawerButtonTitle: "Kartverktyg",
  drawerButtonIcon: "MapIcon",

  // Interactions (OpenLayers defaults are mostly enabled)
  altShiftDragRotate: true,
  onFocusOnly: false,
  doubleClickZoom: true,
  keyboard: true,
  mouseWheelZoom: true,
  shiftDragZoom: true,
  dragPan: true,
  pinchRotate: true,
  pinchZoom: true,
  zoomDelta: null,
  zoomDuration: null,

  // Cookies
  showCookieNotice: false,
  showCookieNoticeButton: false,
  cookieUse3dPart: false,
  defaultCookieNoticeMessage:
    "Vi använder cookies för att följa upp användandet och ge en bra upplevelse av kartan. Du kan blockera cookies i webbläsaren men då visas detta meddelande igen.",
  defaultCookieNoticeUrl:
    "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/",

  // Introduction guide
  introductionEnabled: false,
  introductionShowControlButton: false,
  introductionSteps: [],
};
