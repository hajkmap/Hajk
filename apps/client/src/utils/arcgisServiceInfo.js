import { hfetch } from "./FetchWrapper";

// Sublayer names and types for ArcGIS MapServices, read from the service root
// (<url>?f=json). They are used as captions for sublayers that have no names
// saved in the Admin, and to skip group layers when querying on click.
const resolved = new Map();
const pending = new Map();

export function normalizeServiceUrl(url) {
  return (url || "").replace(/\/$/, "");
}

/**
 * Returns the sublayers of a service that has already been fetched, as a Map
 * from layer id (string) to { name, isGroup }. Undefined if not fetched (yet).
 */
export function getServiceLayers(url) {
  return resolved.get(normalizeServiceUrl(url));
}

/**
 * Fetches the sublayers of an ArcGIS MapService. Each service is requested
 * once. Resolves to null if the service info can't be read, so that the map
 * still loads with the names from the Admin.
 */
export function fetchServiceLayers(url, proxyUrl) {
  const key = normalizeServiceUrl(url);
  if (!key) {
    return Promise.resolve(null);
  }
  if (!pending.has(key)) {
    // The proxy is a plain prefix, same as for all other requests in the client
    const request = hfetch((proxyUrl || "") + key + "?f=json")
      .then((r) => r.json())
      .then((json) => {
        if (json.error || !Array.isArray(json.layers)) {
          throw new Error(json.error?.message || "No layers in service info");
        }
        const layers = new Map(
          json.layers.map((l) => [
            String(l.id),
            { name: l.name, isGroup: l.type === "Group Layer" },
          ])
        );
        resolved.set(key, layers);
        return layers;
      })
      .catch((err) => {
        console.warn(`Could not read ArcGIS service info for ${key}:`, err);
        return null;
      });
    pending.set(key, request);
  }
  return pending.get(key);
}
