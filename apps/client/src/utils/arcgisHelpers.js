// Pure helpers for ArcGIS REST layers. This file must not import anything, so
// that it can be unit tested with plain `node --test` (see test/).

// 1x1 transparent PNG, used instead of a request when no sublayer is visible
export const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

/**
 * Adds https:// to a legend URL that has no protocol. Data URLs, http(s) URLs
 * and protocol-relative URLs are returned as they are.
 */
export function normalizeLegendUrl(url) {
  return typeof url === "string" &&
    url !== "" &&
    !/^(https?:|data:|\/\/)/i.test(url)
    ? "https://" + url
    : url;
}

/**
 * Admin saves the legend of an ArcGIS layer as a string. Either a plain URL,
 * or - when the legend was fetched from the service - one data URL per symbol
 * formatted as `data:image/png;base64,<data>&<layer name>`, joined with `#`.
 * Base64 never contains `&` or `#`, so those are safe to split on. A `#` that
 * is not followed by `data:` (e.g. a URL fragment) is left alone.
 *
 * @param {string} legend The legend string from Admin
 * @returns {{url: string, description: string}[]} One entry per legend image
 */
export function splitLegend(legend) {
  if (typeof legend !== "string" || legend === "") {
    return [];
  }
  return legend.split(/#(?=data:)/i).map((part) => {
    const separator = /^data:/i.test(part) ? part.indexOf("&") : -1;
    return separator === -1
      ? { url: normalizeLegendUrl(part), description: "" }
      : {
          url: part.slice(0, separator),
          description: part.slice(separator + 1),
        };
  });
}

/**
 * Admin may save opacity as a string (e.g. "0.5"), but OpenLayers requires a
 * number. Unlike `Number(x) || 1` this keeps an opacity of 0.
 */
export function parseOpacity(value, fallback = 1) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const opacity = Number(value);
  return Number.isFinite(opacity)
    ? Math.min(1, Math.max(0, opacity))
    : fallback;
}

/**
 * Admin saves the extent as an array of strings (or as "a,b,c,d"). Returns
 * four numbers, or undefined if the value is missing or incomplete.
 */
export function parseExtent(value) {
  const parts =
    typeof value === "string"
      ? value.split(",")
      : Array.isArray(value)
        ? value
        : [];
  if (parts.length !== 4) {
    return undefined;
  }
  const numbers = parts.map((part) =>
    typeof part === "number"
      ? part
      : typeof part === "string" && part.trim() !== ""
        ? Number(part)
        : NaN
  );
  return numbers.every(Number.isFinite) ? numbers : undefined;
}

/**
 * Returns the numeric part (WKID) of a projection code, e.g. "EPSG:3006" ->
 * "3006". Undefined if the code has none.
 */
export function getWkid(code) {
  const match = /(\d+)$/.exec(String(code ?? ""));
  return match ? match[1] : undefined;
}

const LAYERS_PARAM = /([?&])LAYERS=([^&]*)/i;
const SIZE_PARAM = /([?&])size=(\d+(?:\.\d+)?)(?:%2C|,)(\d+(?:\.\d+)?)/i;
const DPI_PARAM = /([?&])dpi=(\d+(?:\.\d+)?)/i;
// LayerControlModel writes these to every group layer (they are WMS
// parameters). The ArcGIS export operation doesn't use them.
const WMS_ONLY_PARAMS = new Set(["styles", "cql_filter"]);

function removeParams(url, names) {
  const queryStart = url.indexOf("?");
  if (queryStart === -1) {
    return url;
  }
  const kept = url
    .slice(queryStart + 1)
    .split("&")
    .filter((pair) => !names.has(pair.split("=")[0].toLowerCase()));
  return kept.length > 0
    ? url.slice(0, queryStart) + "?" + kept.join("&")
    : url.slice(0, queryStart);
}

/**
 * Turns the URL that OpenLayers built for an ImageArcGISRest request into the
 * URL we send to the server: `LAYERS` gets the `show:` prefix that ArcGIS
 * requires (we keep `LAYERS` clean in the layer params, so that share links
 * etc. work), and WMS-only parameters are dropped.
 *
 * @param {string} src The URL built by OpenLayers (may be prefixed by a proxy)
 * @returns {string|null} The URL to request, or null if no sublayer is
 * visible. With an empty list ("show:") some ArcGIS servers draw *all* layers,
 * so the caller should not send a request at all in that case.
 */
export function buildArcGISImageUrl(src) {
  const match = LAYERS_PARAM.exec(src);
  if (!match || match[2] === "") {
    return null;
  }
  const alreadyPrefixed = /^show(%3A|:)/i.test(match[2]);
  const withShow = alreadyPrefixed
    ? src
    : src.replace(
        LAYERS_PARAM,
        (_, separator, layers) => `${separator}LAYERS=show%3A${layers}`
      );
  return removeParams(withShow, WMS_ONLY_PARAMS);
}

/**
 * Makes sure an ArcGIS export request is not larger than `maxSize` pixels in
 * either direction (servers refuse images above their limit, 4096 by default).
 * The image keeps the same bbox, so it gets scaled up when drawn. `dpi` is
 * scaled with the size so that the server sees the same map scale.
 */
export function limitArcGISImageSize(src, maxSize) {
  const size = SIZE_PARAM.exec(src);
  if (!size || !(maxSize > 0)) {
    return src;
  }
  const width = Number(size[2]);
  const height = Number(size[3]);
  const largest = Math.max(width, height);
  if (largest <= maxSize) {
    return src;
  }
  const factor = maxSize / largest;
  const limited = src.replace(
    SIZE_PARAM,
    `${size[1]}size=${Math.max(1, Math.round(width * factor))}%2C${Math.max(
      1,
      Math.round(height * factor)
    )}`
  );
  return limited.replace(
    DPI_PARAM,
    (_, separator, dpi) =>
      `${separator}dpi=${Math.max(1, Math.round(Number(dpi) * factor))}`
  );
}

/**
 * Keeps the legend entries that belong to a visible sublayer. Admin names each
 * legend image after the sublayer it was fetched for (see splitLegend), so an
 * entry is matched to a sublayer by comparing its description with the
 * sublayers' captions. Entries that can't be matched to any sublayer (no
 * description, or an unknown name) are kept, since hiding them would lose
 * information.
 *
 * @param {{url: string, description: string}[]} legend
 * @param {string[]} visibleIds Ids of the sublayers that are currently visible
 * @param {Object<string, {caption?: string}>} layersInfo Sublayer info by id
 * @returns {{url: string, description: string}[]}
 */
export function filterLegendBySubLayers(legend, visibleIds, layersInfo) {
  const info = layersInfo || {};
  const captionOf = (id) => info[id]?.caption;
  const known = new Set(Object.keys(info).map(captionOf).filter(Boolean));
  const visible = new Set((visibleIds || []).map(captionOf).filter(Boolean));
  return (legend || []).filter(
    (entry) =>
      !entry.description ||
      !known.has(entry.description) ||
      visible.has(entry.description)
  );
}
