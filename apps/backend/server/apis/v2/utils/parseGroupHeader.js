import log4js from "log4js";

const logger = log4js.getLogger("service.auth.v2");

export const DEFAULT_GROUP_DELIMITER = ",";

/**
 * @summary Read the group delimiter from AD_TRUSTED_GROUP_HEADER_DELIMITER.
 * @description Falls back to "," if not set or if the value can't be used as
 * delimiter (whitespace only, or containing parentheses, which are reserved for
 * GeoServer-style role parameters).
 * @returns {string}
 */
export const getGroupDelimiter = () => {
  const value = process.env.AD_TRUSTED_GROUP_HEADER_DELIMITER;
  if (value === undefined || value.length === 0) {
    return DEFAULT_GROUP_DELIMITER;
  }

  if (value.trim().length === 0 || /[()]/.test(value)) {
    logger.error(
      'AD_TRUSTED_GROUP_HEADER_DELIMITER="%s" can\'t be used as delimiter. Falling back to "%s".',
      value,
      DEFAULT_GROUP_DELIMITER
    );
    return DEFAULT_GROUP_DELIMITER;
  }

  return value;
};

/**
 * @summary Split a group header value into group (role) names.
 * @description Supports the format used by GeoServer's header role source, where
 * each role may be followed by parameters in parentheses, e.g.
 * "role_a;role_b(pnr=123,nick=max);role_c". The parameters are ignored, only
 * role names are returned. Delimiters inside parentheses don't split, so the
 * format works with the default "," delimiter too.
 * @param {string} value Raw header value
 * @param {string} [delimiter=","]
 * @returns {string[]} Trimmed, unique, non-empty group names
 */
export const parseGroupHeader = (
  value,
  delimiter = DEFAULT_GROUP_DELIMITER
) => {
  if (typeof value !== "string" || value.length === 0) {
    return [];
  }

  const groups = [];
  let current = "";
  let depth = 0;
  // Becomes true once a role's parameter list has started. Anything after it,
  // up to the next delimiter, is not part of the role name.
  let nameDone = false;

  const endGroup = () => {
    const name = current.trim();
    if (name.length > 0 && !groups.includes(name)) {
      groups.push(name);
    }
    current = "";
    nameDone = false;
  };

  let i = 0;
  while (i < value.length) {
    const char = value[i];
    if (depth === 0 && value.startsWith(delimiter, i)) {
      endGroup();
      i += delimiter.length;
      continue;
    }

    if (char === "(") {
      depth++;
      nameDone = true;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0 && !nameDone) {
      current += char;
    }
    i++;
  }
  endGroup();

  return groups;
};
