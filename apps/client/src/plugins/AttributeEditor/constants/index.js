// A file where we can keep some constant values to keep the components etc. more clean.
export const DEFAULT_MEASUREMENT_SETTINGS = Object.freeze({
  showText: false,
  showArea: false,
  showLength: false,
  showPerimeter: false,
  areaUnit: "AUTO",
  lengthUnit: "AUTO",
  precision: 0,
});

export const OGC_SOURCES = Object.freeze([
  { id: "NONE", type: "NONE", label: "Ingen" },
  { id: "wfs_avfall", type: "WFS", label: "Avfallsstationer" },
  { id: "wfs_trad", type: "WFS", label: "Träd" },
]);

export const PLUGIN_COLORS = Object.freeze({
  default: "#4a90e2",
  warning: "#ff5420ff",
});
