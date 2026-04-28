// See #1294 for the reasons why this is needed
export const PLUGINS_TO_IGNORE_IN_HASH_APP_STATE = ["anchor", "print"];

// A list of all tools that are available in this build (exist in src/plugins).
// This is used to validate the activeTools list from appConfig, and to fall
// back to a default of loading all tools, if activeTools is not provided or invalid.
// PLEASE NOTE THAT THIS LIST IS CASE SENSITIVE, NAMES MUST CORRESPOND EXACTLY TO DIRECTORY NAMES.
export const AVAILABLE_TOOLS = [
  "Anchor",
  "Bookmarks",
  "Buffer",
  "Collector",
  "Coordinates",
  "DocumentHandler",
  "Dummy",
  "Edit",
  "Export",
  "Fir",
  "FmeServer",
  "GeosuiteExport",
  "InfoDialog",
  "Informative",
  "Kir",
  "LayerComparer",
  "LayerSwitcher",
  "Location",
  "Measurer",
  "Print",
  "PropertyChecker",
  "Routing",
  "Search",
  "Sketch",
  "StreetView",
  "TimeSlider",
];
