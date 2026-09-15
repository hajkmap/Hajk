import { getPointResolution } from "ol/proj";

/**
 * Scale calculation helpers for the print plugin.
 */

// We have to make sure to get (and set on the print view) the current zoom
// of the "original" view before calculating scale – otherwise the calculation
// could be wrong since it depends on the static zoom of the print view.
const SCREEN_DPI = 25.4 / 0.28;
const INCHES_PER_METER = 39.37;

/**
 * Calculates the current map scale from a view.
 *
 * @param {import("ol/View").default} view
 * @returns {number} The map scale denominator (e.g. 10000 for 1:10 000).
 */
export const getMapScaleFromView = (view) => {
  const mpu = view.getProjection().getMetersPerUnit(),
    res = view.getResolution();

  return res * mpu * INCHES_PER_METER * SCREEN_DPI;
};

/**
 * Returns the configured scale closest to the proposed (actual) scale.
 *
 * @param {number} proposedScale
 * @param {Array<number>} scales Configured scales.
 * @returns {number} The closest configured scale.
 */
export const findClosestScale = (proposedScale, scales) => {
  return scales.reduce((prev, curr) => {
    return Math.abs(curr - proposedScale) < Math.abs(prev - proposedScale)
      ? curr
      : prev;
  });
};

/**
 * Calculates the resolution required to render at the desired scale and DPI.
 *
 * @param {number} scale Scale denominator divided by 1000.
 * @param {number} resolution Output DPI.
 * @param {import("ol/proj/Projection").default} projection
 * @param {Array<number>} center Map center coordinate.
 * @returns {number}
 */
export const calculateScaleResolution = (
  scale,
  resolution,
  projection,
  center
) => {
  return scale / getPointResolution(projection, resolution / 25.4, center);
};

/**
 * Formats a scale as a user friendly string prefixed with "1:".
 * Using toLocaleString for sv-SE is the easiest way to get space as
 * thousand separator, e.g "5000" -> "1:5 000".
 *
 * @param {*} scale Number that will be prefixed with "1:".
 * @returns {string}
 */
export const getUserFriendlyScale = (scale) => {
  return `1:${Number(scale).toLocaleString()}`;
};
