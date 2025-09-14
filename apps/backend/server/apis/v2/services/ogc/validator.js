import { CONSTANTS } from "./constants.js";
import { logger } from "./logger.js";

export const Validator = {
  isValidId(id) {
    if (!id) return false;
    return /^[a-zA-Z0-9_-]+$/.test(String(id));
  },

  isValidUrl(urlString, checkSSRF = true) {
    try {
      const u = new URL(urlString);
      if (!["http:", "https:"].includes(u.protocol)) return false;

      // Whitelist (if configured)
      if (checkSSRF && CONSTANTS.ALLOWED_HOSTS) {
        const isAllowed = CONSTANTS.ALLOWED_HOSTS.some((allowed) => {
          if (allowed.startsWith("*.")) {
            const domain = allowed.substring(2);
            return u.hostname === domain || u.hostname.endsWith("." + domain);
          }
          return u.hostname === allowed;
        });
        if (!isAllowed) {
          logger.warn("URL blocked by SSRF protection", { url: urlString });
          return false;
        }
      }

      // Block private addresses
      const hostname = u.hostname;

      // IPv4
      const privateV4 = [
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^0\.0\.0\.0$/,
      ];
      if (privateV4.some((re) => re.test(hostname))) {
        logger.warn("Private IPv4 address blocked", { url: urlString });
        return false;
      }

      // IPv6
      const hnLower = hostname.toLowerCase();
      if (
        hnLower === "localhost" ||
        hnLower.startsWith("::1") || // loopback
        hnLower.startsWith("fe80:") || // link-local
        hnLower.startsWith("fc") || // ULA (fc00::/7)
        hnLower.startsWith("fd") // ULA (fd00::/7)
      ) {
        logger.warn("Private IPv6 address blocked", { url: urlString });
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  isValidBbox(bbox) {
    if (!bbox) return false;
    const parts = String(bbox).split(",");
    if (parts.length < 4) return false;

    const [xmin, ymin, xmax, ymax] = parts.slice(0, 4).map(Number);
    if (![xmin, ymin, xmax, ymax].every(Number.isFinite)) return false;

    return xmax > xmin && ymax > ymin;
  },

  validateLimit(limit) {
    if (limit == null) return null;
    const num = parseInt(limit, 10);
    if (isNaN(num) || num < 0) return null;
    return Math.min(num, CONSTANTS.MAX_LIMIT);
  },

  validateOffset(offset) {
    if (offset == null) return null;
    const num = parseInt(offset, 10);
    return isNaN(num) || num < 0 ? null : num;
  },

  sanitizeString(str) {
    if (!str) return "";
    // NOTE: Do not use this on OGC XML filters (can break output). OK for UI/logging.
    return String(str).replace(/[<>]/g, "");
  },
};
