/**
 * Pure math helpers for the scale bar.
 */

/**
 * Returns a fitting scale bar length (in meters) for the supplied scale,
 * given a mapping of scale => meters. Falls back to a proportional estimate
 * when the scale has no mapped value.
 *
 * @param {Object} scaleBarLengths Map from scale to length in meters.
 * @param {number} scale
 * @returns {number} Length in meters.
 */
export const getFittingScaleBarLength = (scaleBarLengths, scale) => {
  const length = scaleBarLengths[scale];

  if (length) {
    return length;
  } else {
    if (scale < 250) {
      return 5;
    } else if (scale < 2500) {
      return scale * 0.02;
    } else {
      return scale * 0.05;
    }
  }
};

/**
 * Formats the text for the scale bar, switching between meters and kilometers.
 * Note: exactly 1000 m is still rendered in meters (strict > comparison).
 *
 * @param {number} scaleBarLengthMeters
 * @returns {string}
 */
export const getLengthText = (scaleBarLengthMeters) => {
  let units = "m";
  if (scaleBarLengthMeters > 1000) {
    scaleBarLengthMeters /= 1000;
    units = "km";
  }
  return `${Number(scaleBarLengthMeters).toLocaleString()} ${units}`;
};

/**
 * Divides the scale bar length with the correct number to get division lines
 * every 1, 10 or 100 m or km.
 * Example 1: If scaleBarLengthMeters is 1000 we divide by 10 to get 10 division lines every 100 meters.
 * Example 2: If scaleBarLengthMeters is 500 we divide by 5 to get 5 division lines every 10 meters.
 *
 * @param {number} scaleBarLengthMeters
 * @param {number} scaleBarLength The length of the bar in points/pixels.
 * @returns {Object} { divLinesArray, divider }
 */
export const getDivLinesArrayAndDivider = (
  scaleBarLengthMeters,
  scaleBarLength
) => {
  const scaleBarLengthMetersStr = scaleBarLengthMeters.toString();
  // Here we get the lengthMeters first two numbers.
  const scaleBarFirstDigits = parseInt(scaleBarLengthMetersStr.substring(0, 2));
  // We want to check if lengthMeters starts with 10 through 19 to make sure we divide correctly later.
  const startsWithDoubleDigits =
    scaleBarFirstDigits >= 10 && scaleBarFirstDigits <= 19;

  // Here we set the scaleLength variable to the length of lengthMeters.
  // For example, if lengthMeters is 1000 we want the scaleLength to be 10.
  // And if lengthMeters is 500 we want the scaleLength to be 5.
  const scaleLength = startsWithDoubleDigits
    ? scaleBarLengthMetersStr.length - 2
    : scaleBarLengthMetersStr.length - 1;

  // Here we set the divider by dividing lengthMeters with 10 to the power of scaleLength...
  // For example, if lengthMeters is 500 we want to divide it by 5 to get 5 division lines, each 100 meters...
  // and if lengthMeters is 1 000 we want to divide it by 100.
  const divider = scaleBarLengthMeters / Math.pow(10, scaleLength);
  // Finally, we want to calculate the number of pixels between each division line on the scalebar
  const divLinePixelsCount = scaleBarLength / divider;

  // We loop through and fill the divLinesArray with the divLinePixelsCount...
  // to get the correct division line distribution on the scalebar
  let divLinesArray = [];
  for (
    let divLine = divLinePixelsCount;
    divLine <= scaleBarLength;
    divLine += divLinePixelsCount
  ) {
    divLinesArray.push(divLine);
  }

  return { divLinesArray, divider };
};
