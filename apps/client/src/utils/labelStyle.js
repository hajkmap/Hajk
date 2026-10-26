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
 * Sets the WMS STYLES param of a single-sublayer layer to match its
 * `useLabelStyle` flag (label style when on, `initialStyles` when off).
 * WMSLayer calls this on every `change:useLabelStyle`, so callers only need
 * to set the flag. Multi-sublayer group layers handle labels per sublayer.
 *
 * @param {import("ol/layer/Base").default} olLayer
 */
export const applyLabelStyle = (olLayer) => {
  if (!olLayer) return;
  if (olLayer.get("allSubLayers")?.length > 1) return;

  const source = olLayer.getSource?.();
  if (!source || typeof source.updateParams !== "function") return;

  const currentParams = source.getParams?.() || {};
  const layerName = olLayer.get("wmsLayerName") || currentParams.LAYERS;
  if (!layerName) return;

  source.updateParams({
    ...currentParams,
    LAYERS: layerName,
    STYLES: olLayer.get("useLabelStyle")
      ? getLabelStyleName(olLayer.layersInfo, layerName)
      : olLayer.get("initialStyles") || "",
  });
};

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
