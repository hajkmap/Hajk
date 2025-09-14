import { CONSTANTS } from "../constants.js";
import { ValidationError } from "../errors.js";
import { Validator } from "../validator.js";

/**
 * Builds a WFS GetFeature URL (supports WFS 1.1.0 and 2.0.0)
 */
export function buildWfsGetFeatureUrl(options) {
  const {
    baseUrl,
    version = CONSTANTS.WFS_VERSIONS.V1,
    typeName,
    srsName,
    bbox,
    limit,
    offset,
    outputFormat = "application/json",
    filter,
    cqlFilter,
  } = options;

  if (!Validator.isValidUrl(baseUrl)) {
    throw new ValidationError("Invalid base URL");
  }

  const url = new URL(baseUrl);
  const isV2 = version.startsWith("2.");

  // Basic parameters
  url.searchParams.set("SERVICE", "WFS");
  url.searchParams.set("REQUEST", "GetFeature");
  url.searchParams.set("VERSION", version);
  if (srsName) url.searchParams.set("SRSNAME", srsName);

  // Output format (compatibility)
  url.searchParams.set("OUTPUTFORMAT", outputFormat);
  url.searchParams.set("outputFormat", outputFormat);
  url.searchParams.set("outputformat", outputFormat);

  // Version-specific parameters
  if (isV2) {
    url.searchParams.set("TYPENAMES", typeName);
    if (limit != null) url.searchParams.set("COUNT", String(limit));
    if (offset != null) url.searchParams.set("startIndex", String(offset));
  } else {
    url.searchParams.set("TYPENAME", typeName);
    if (limit != null) url.searchParams.set("MAXFEATURES", String(limit));
    if (offset != null) url.searchParams.set("STARTINDEX", String(offset));
  }

  // Bounding box compatibility (activated via env)
  if (process.env.OGC_WFS_PARAM_COMPAT === "both") {
    url.searchParams.set("TYPENAME", typeName);
    url.searchParams.set("TYPENAMES", typeName);
    if (limit != null) {
      url.searchParams.set("MAXFEATURES", String(limit));
      url.searchParams.set("COUNT", String(limit));
    }
    if (offset != null) {
      url.searchParams.set("STARTINDEX", String(offset));
      url.searchParams.set("startIndex", String(offset));
    }
  }

  // Optional parameters
  if (bbox) {
    const bboxValue = bbox.includes(",EPSG") ? bbox : `${bbox},${srsName}`;
    url.searchParams.set("BBOX", bboxValue);
  }
  if (filter) url.searchParams.set("FILTER", filter);
  if (cqlFilter) url.searchParams.set("CQL_FILTER", cqlFilter);

  return url.toString();
}

/**
 * Set the OUTPUTFORMAT in a given WFS URL to a new format.
 */
export function rewriteOutputFormat(urlStr, fmt) {
  const u = new URL(urlStr);
  u.searchParams.set("OUTPUTFORMAT", fmt);
  u.searchParams.set("outputFormat", fmt);
  u.searchParams.set("outputformat", fmt);
  return u.toString();
}
