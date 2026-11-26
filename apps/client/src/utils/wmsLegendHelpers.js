// Pure helpers for WMS legends, shared by ConfigMapper (LayerSwitcher) and Print.
// Kept free of OpenLayers and extensionless imports so they can be unit tested
// with `node --test` (see test/wmsLegendHelpers.test.js).

/**
 * An Admin legend value, trimmed. Whitespace only, or anything that isn't a string
 * (hand-edited config), means "automatic legend". Admin stores those as empty on
 * save, but older or hand-edited configs may still have them.
 */
export const cleanLegend = (value) =>
  typeof value === "string" ? value.trim() : "";

/**
 * Legends for a WMS layer as a whole, one entry per sublayer. The layer's own legend
 * wins over the sublayers' legends here (see #1644). For a single sublayer it's the
 * other way around, see ConfigMapper's mapLayersInfo() - that precedence is also
 * used by the LayerSwitcher's sublayer details view.
 *
 * @param {Object} args
 * @param {string[]} args.layers Sublayer names, in config order.
 * @param {Array|null|undefined} args.layersInfo Sublayer config from Admin (may be missing).
 * @param {string|undefined} args.legend The layer's own legend from Admin.
 * @param {(layer: string) => string} args.getLegendUrl Builds the automatic legend URL.
 * @returns {{url: string, description: string, automatic: boolean}[]}
 */
export const getWmsLegends = ({ layers, layersInfo, legend, getLegendUrl }) =>
  (layers || []).map((layer) => {
    const subLayerLegend = Array.isArray(layersInfo)
      ? cleanLegend(layersInfo.find((l) => l.id === layer)?.legend)
      : undefined;
    const explicitLegend = cleanLegend(legend) || subLayerLegend;
    return {
      url: explicitLegend || getLegendUrl(layer),
      description: "Teckenförklaring",
      // No legend set in Admin, so url is a GetLegendGraphic request for the
      // configured style. Print may swap in the active style, see getPrintLegendUrl().
      automatic: !explicitLegend,
    };
  });

/**
 * Replace the STYLE parameter of a GetLegendGraphic URL. Works on the plain string,
 * since the URL may have a proxy prefix that URL() would not parse the way we want.
 * Does not touch STYLES (GetMap) parameters.
 */
export const setLegendUrlStyle = (url, style = "") => {
  if (typeof url !== "string") return url;
  const match = url.match(/[?&]STYLE=([^&#]*)/i);
  if (!match) return url;
  // Leave the URL as it is when the style is already right.
  let current = match[1];
  try {
    current = decodeURIComponent(current);
  } catch {
    // Keep the raw value if it isn't valid percent-encoding.
  }
  if (current === (style || "")) return url;
  const value = encodeURIComponent(style || "");
  return url.replace(/([?&])STYLE=[^&#]*/gi, `$1STYLE=${value}`);
};

/**
 * The URL Print should use for one sublayer's legend.
 *
 * - An Admin legend (layer or sublayer) is used as is.
 * - An automatic legend is ConfigMapper's GetLegendGraphic URL (VERSION=1.0.0 and the
 *   map's LEGEND_OPTIONS, same as the LayerSwitcher). Its configured style is swapped
 *   for the active one only for single-sublayer layers: that's where the label style
 *   applies, and where STYLES is known to line up with LAYERS.
 * - Without a configured entry, fall back to Print's own GetLegendGraphic URL.
 */
export const getPrintLegendUrl = ({
  configuredEntry,
  generatedUrl,
  activeStyle,
  isSingleSublayer,
}) => {
  const configuredUrl = configuredEntry?.Url ?? configuredEntry?.url ?? null;
  if (!configuredUrl) return generatedUrl || null;
  if (configuredEntry.automatic && isSingleSublayer) {
    return setLegendUrlStyle(configuredUrl, activeStyle);
  }
  return configuredUrl;
};

/**
 * Drop entries whose legend URL was already used, e.g. a layer-level legend that is
 * set on every sublayer's entry. Entries without a URL are kept as they are.
 */
export const uniqueLegendEntries = (entries, getUrl = (e) => e?.url) => {
  const seen = new Set();
  return (entries || []).filter((entry) => {
    const url = getUrl(entry);
    if (!url) return true;
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
};
