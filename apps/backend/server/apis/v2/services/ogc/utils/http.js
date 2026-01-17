import { CONSTANTS } from "../constants.js";
import { UpstreamError } from "../errors.js";
import { logger } from "../logger.js";

// Status codes that trigger retry (Set for O(1) lookup)
const RETRY_STATUS_CODES = new Set([502, 503, 504]);

/**
 * Fetch with AbortController timeout.
 */
export async function fetchWithTimeout(
  url,
  options = {},
  timeout = CONSTANTS.UPSTREAM_TIMEOUT
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      throw new UpstreamError("Request timeout", 504);
    }
    throw error;
  }
}

/**
 * Fetch with retry (exponential backoff) for 502/503/504 and network errors.
 */
export async function fetchWithRetry(url, options = {}, retryCount = 0) {
  try {
    const response = await fetchWithTimeout(url, options);

    if (
      RETRY_STATUS_CODES.has(response.status) &&
      retryCount < CONSTANTS.MAX_RETRIES
    ) {
      const delay = CONSTANTS.RETRY_DELAYS[retryCount] || 5000;
      logger.warn("Retrying after server error", {
        url,
        status: response.status,
        retryCount,
        delay,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    if (retryCount < CONSTANTS.MAX_RETRIES) {
      const delay = CONSTANTS.RETRY_DELAYS[retryCount] || 5000;
      logger.warn("Retrying after network/timeout error", {
        url,
        retryCount,
        delay,
        err: error?.message,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Warn about large responses above MAX_RESPONSE_BYTES (via Content-Length).
 * Use directly after fetch for budget control.
 */
export function ensureNotTooLarge(res) {
  const contentLength = res.headers.get("content-length");
  if (
    contentLength &&
    parseInt(contentLength, 10) > CONSTANTS.MAX_RESPONSE_BYTES
  ) {
    throw new UpstreamError("Response too large", 413);
  }
}
