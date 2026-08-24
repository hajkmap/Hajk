/**
 * Default configuration values for the Print plugin, along with helpers to
 * normalize admin-supplied options.
 *
 * Nothing in this module has side effects – it only declares constants and
 * provides pure helper functions.
 */

// Paper dimensions in millimeters: Array[width, height], landscape orientation.
export const PAPER_DIMS_MM = {
  a0: [1189, 841],
  a1: [841, 594],
  a2: [594, 420],
  a3: [420, 297],
  a4: [297, 210],
  a5: [210, 148],
};

// Paper sizes in points assuming landscape.
export const PAPER_SIZE_PT = {
  a2: { width: 1684, height: 1190 },
  a3: { width: 1190, height: 842 },
  a4: { width: 842, height: 595 },
};

// Default DPIs, used if none supplied in options.
export const DEFAULT_DPIS = [72, 150, 300];

// Default scales, used if none supplied in options.
export const DEFAULT_SCALES = [
  100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 200000, 500000,
];

// Default scale bar lengths (in meters) per scale. Used when the admin-supplied
// "scales" and "scaleMeters" arrays don't have the same length.
export const DEFAULT_SCALE_BAR_LENGTHS = {
  200: 10,
  500: 50,
  1000: 100,
  2000: 200,
  5000: 500,
  10000: 1000,
  20000: 2000,
  50000: 5000,
  100000: 10000,
  200000: 20000,
  300000: 20000,
};

// Conversion factor between millimeters and points.
export const MM_PER_POINT = 2.83465;

/**
 * Normalizes an admin-supplied list option. The value may come as an array
 * (used as-is), or as a comma-separated string (whitespace stripped). If
 * neither, the fallback is used.
 *
 * @param {Array|string} value
 * @param {Array} fallback
 * @param {Function} [mapItem] Optional transform applied to each string item.
 * @returns {Array}
 */
export const parseListOption = (value, fallback, mapItem = (el) => el) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value?.split(",").length > 1) {
    return value
      .replace(/\s/g, "")
      .split(",")
      .map((el) => mapItem(el));
  }
  return fallback;
};

/**
 * Builds the mapping between scales and their fitting scale bar lengths
 * (meters). Falls back to the defaults if the two arrays differ in length.
 *
 * @param {Array} scales
 * @param {Array} scaleMeters
 * @returns {Object} Map from scale to length in meters.
 */
export const buildScaleBarLengths = (scales, scaleMeters) => {
  if (scales.length === scaleMeters.length) {
    return scales.reduce((acc, curr, index) => {
      acc[curr] = scaleMeters[index];
      return acc;
    }, {});
  }
  return DEFAULT_SCALE_BAR_LENGTHS;
};

const isBoolean = (v) => typeof v === "boolean";

/**
 * Normalizes raw plugin options exactly like the Print plugin entry point has
 * always done. Returns a new object; the input is left untouched.
 *
 * @param {Object} rawOptions Options as supplied via plugin configuration.
 * @param {Object} mapConfig The app's map configuration (for crossOrigin).
 * @returns {Object} A new, normalized options object.
 */
export const normalizePrintOptions = (rawOptions, mapConfig) => {
  const o = { ...rawOptions };

  // Prepare scales from admin options, fallback to default if needed
  o.scales = parseListOption(rawOptions.scales, DEFAULT_SCALES);

  // Prepare scaleMeters from admin options, fallback to default if needed
  o.scaleMeters = parseListOption(
    rawOptions.scaleMeters,
    [20, 40, 40, 100, 200, 200, 400, 600, 2000, 4000, 10000, 20000]
  );

  // Prepare dpis from admin options, fallback to default if needed
  o.dpis = parseListOption(rawOptions.dpis, DEFAULT_DPIS, (el) => parseInt(el));

  // Prepare paperFormats from admin options, fallback to default if needed
  o.paperFormats = parseListOption(
    rawOptions.paperFormats,
    Object.keys(PAPER_DIMS_MM),
    (el) => el.toLowerCase()
  );

  // If no valid max logo width is supplied, use a hard-coded default
  o.logoMaxWidth =
    typeof rawOptions?.logoMaxWidth === "number" ? rawOptions.logoMaxWidth : 40;

  o.northArrowMaxWidth =
    typeof rawOptions?.northArrowMaxWidth === "number"
      ? rawOptions.northArrowMaxWidth
      : 10;

  // If no path to north-arrow image is supplied, use fallback
  o.northArrow = rawOptions.northArrow || "/north_arrow.png";

  o.includeImageBorder = isBoolean(rawOptions?.includeImageBorder)
    ? rawOptions.includeImageBorder
    : false;
  o.allowLegendsInPdfOutput = isBoolean(rawOptions?.allowLegendsInPdfOutput)
    ? rawOptions.allowLegendsInPdfOutput
    : false;
  o.generateLegendsByDefault = isBoolean(rawOptions?.generateLegendsByDefault)
    ? rawOptions.generateLegendsByDefault
    : false;

  // Ensure we have a value for the crossOrigin parameter
  o.crossOrigin = mapConfig?.crossOrigin || "anonymous";

  return o;
};
