import log4js from "log4js";

const logger = log4js.getLogger("service.auth.v2");

export const DEFAULT_GROUP_DELIMITER = ",";

/**
 * @summary Read the group delimiter from AD_TRUSTED_GROUP_HEADER_DELIMITER.
 * @description Falls back to "," if not set or if the value is whitespace only
 * (group names may contain spaces, so splitting on them would break names).
 * @returns {string}
 */
export const getGroupDelimiter = () => {
  const value = process.env.AD_TRUSTED_GROUP_HEADER_DELIMITER;
  if (value === undefined || value.length === 0) {
    return DEFAULT_GROUP_DELIMITER;
  }

  if (value.trim().length === 0) {
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
 * @summary Split a group header value into group names.
 * @description Everything between delimiters is used as the group name, only
 * leading and trailing whitespace is trimmed.
 * @param {string} value Raw header value
 * @param {string} [delimiter=","]
 * @returns {string[]} Trimmed, unique, non-empty group names
 */
export const parseGroupHeader = (
  value,
  delimiter = DEFAULT_GROUP_DELIMITER
) => {
  if (typeof value !== "string") {
    return [];
  }

  return [
    ...new Set(
      value
        .split(delimiter)
        .map((group) => group.trim())
        .filter(Boolean)
    ),
  ];
};
