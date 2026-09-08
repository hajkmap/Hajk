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

      return true;
    } catch {
      return false;
    }
  },
};
