import { CONSTANTS } from "../constants.js";
import { UpstreamError } from "../errors.js";
import { logger } from "../logger.js";

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
 * Read response body as text with a hard byte limit.
 * Works even when Content-Length is missing (e.g. QGIS Server chunked responses).
 * Aborts the stream and throws if the limit is exceeded.
 */
export async function readTextWithLimit(
  res,
  maxBytes = CONSTANTS.MAX_RESPONSE_BYTES
) {
  const contentLength = res.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    throw new UpstreamError("Response too large", 413);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.length;
      if (totalBytes > maxBytes) {
        reader.cancel();
        throw new UpstreamError(
          `Response too large (>${(maxBytes / 1024 / 1024).toFixed(0)} MB)`,
          413
        );
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join("");
  } catch (error) {
    reader.cancel().catch(() => {});
    throw error;
  }
}
