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

  // Validate WFS version
  const allowedVersions = Object.values(CONSTANTS.WFS_VERSIONS);
  if (!allowedVersions.includes(version)) {
    throw new ValidationError(
      `Invalid WFS version. Allowed: ${allowedVersions.join(", ")}`
    );
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

  // Validate and set OGC Filter (must look like XML with Filter element)
  if (filter) {
    const trimmed = filter.trim();
    if (!trimmed.startsWith("<") || !trimmed.endsWith(">")) {
      throw new ValidationError("Invalid OGC Filter format (must be XML)");
    }
    if (!/Filter/i.test(trimmed)) {
      throw new ValidationError(
        "Invalid OGC Filter (must contain Filter element)"
      );
    }
    url.searchParams.set("FILTER", filter);
  }

  // Validate and set CQL Filter (block potential SQL injection patterns)
  if (cqlFilter) {
    // Block dangerous SQL patterns that shouldn't appear in CQL
    if (/;\s*(?:DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE)/i.test(cqlFilter)) {
      throw new ValidationError("Invalid CQL Filter (dangerous pattern)");
    }
    url.searchParams.set("CQL_FILTER", cqlFilter);
  }

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
