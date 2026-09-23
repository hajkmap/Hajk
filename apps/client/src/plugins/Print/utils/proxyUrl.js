/**
 * Helpers for working with URLs that may need to be routed through the
 * application's proxy.
 */

// A fake base used for resolving relative URL:s so we can detect this when
// resolving the final URL to string (and remove it).
// This let's us work with NodeJS URL API with relative URL:s.
export const FAKE_BASE = "https://hajk.js.internal";

/**
 * Returns a URL object from the src string, prepended with proxy if any.
 *
 * @param {string} proxy The proxy prefix (may be empty).
 * @param {string} src
 * @returns {URL}
 */
export const getProxiedUrl = (proxy, src) => {
  const location = (proxy || "") + src;
  return new URL(location, FAKE_BASE);
};

/**
 * Returns a string with the complete URL, removing fake base if any.
 *
 * @param {URL} url
 * @returns {string}
 */
export const toUrlString = (url) => {
  const urlString = url.toString();
  return urlString.replace(FAKE_BASE, "");
};
