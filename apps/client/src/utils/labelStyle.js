/**
 * Returns the WMS style name to request when dynamic labels are active for
 * a (sub)layer. Uses the label style selected in Admin (`labelStyle`) if
 * present, otherwise falls back to the `<layerName>_labels` convention.
 *
 * @param {Object} layersInfo Object keyed by sublayer name (see ConfigMapper)
 * @param {string} layerName WMS layer name
 * @returns {string}
 */
export const getLabelStyleName = (layersInfo, layerName) =>
  layersInfo?.[layerName]?.labelStyle || `${layerName}_labels`;
