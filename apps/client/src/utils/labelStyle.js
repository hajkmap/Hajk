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

/**
 * Returns true if a WMS layer (raw config, as in layers.json) supports the
 * dynamic label toggle (and thus the `_l` suffix in the `l` URL param). Only
 * single-sublayer layers qualify; group layers handle labels per sublayer.
 * The flag is set per sublayer in Admin (`layersInfo[].hasLabelStyle`, see
 * #1842), but the legacy layer-level `hasLabelStyle` is still respected.
 *
 * @param {Object} layerConfig Raw WMS layer config
 * @returns {boolean}
 */
export const layerHasLabelStyle = (layerConfig) => {
  const subLayers = layerConfig?.layers ?? [];
  if (subLayers.length !== 1) return false;
  if (layerConfig.hasLabelStyle === true) return true;
  return (
    Array.isArray(layerConfig.layersInfo) &&
    layerConfig.layersInfo.find((li) => li.id === subLayers[0])
      ?.hasLabelStyle === true
  );
};
