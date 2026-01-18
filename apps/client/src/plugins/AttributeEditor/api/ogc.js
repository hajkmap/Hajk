/**
 * Creates an OGC API client for WFST operations.
 * @param {string} baseUrl - The base URL for the API
 * @returns {Object} API methods
 */
export function createOgcApi(baseUrl) {
  const base = (baseUrl || "").replace(/\/+$/, "");

  // Validate layerId to prevent path traversal attacks
  const validateLayerId = (id) => {
    if (id == null || id === "") {
      throw new Error("Layer ID is required");
    }
    const idStr = String(id);
    // Disallow path traversal characters
    if (/[/\\.]{2,}|[<>"|*?]/.test(idStr)) {
      throw new Error("Invalid layer ID format");
    }
    return encodeURIComponent(idStr);
  };

  // Skip undefined fields in ?fields=
  const pickFields = (fields) => {
    const f = (fields ?? "").trim();
    return f ? `?fields=${encodeURIComponent(f)}` : "";
  };

  // Centralized error logging
  const logError = (context, error) => {
    console.error(`[AttributeEditor/OGC] ${context}:`, error);
  };

  return {
    async fetchWfstList(fields = "id,caption", { signal } = {}) {
      const res = await fetch(`${base}/ogc/wfst${pickFields(fields)}`, {
        signal,
      });
      if (!res.ok) throw new Error(`WFST-lista misslyckades (${res.status})`);
      const json = await res.json();
      let items = [];
      if (Array.isArray(json)) items = json;
      else if (Array.isArray(json.layers)) items = json.layers;
      else if (Array.isArray(json.wfst)) items = json.wfst;
      return items;
    },

    async getServiceMeta(id, { signal } = {}) {
      const safeId = validateLayerId(id);
      try {
        const res = await fetch(`${base}/ogc/wfst/${safeId}`, { signal });
        if (!res.ok)
          throw new Error(`Failed to fetch metadata (${res.status})`);
        const layer = await res.json();
        return {
          id: layer.id,
          caption: layer.caption,
          title: layer.caption,
          projection: layer.projection,
          layers: layer.layers || [],
        };
      } catch (error) {
        logError("getServiceMeta", error);
        throw error;
      }
    },

    async fetchWfstMeta(id, { signal } = {}) {
      return this.getServiceMeta(id, { signal });
    },

    async fetchWfst(id, fields, { signal } = {}) {
      const safeId = validateLayerId(id);
      try {
        const url = `${base}/ogc/wfst/${safeId}${pickFields(fields)}`;
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`WFST get misslyckades (${res.status})`);
        return res.json();
      } catch (error) {
        logError("fetchWfst", error);
        throw error;
      }
    },

    async fetchWfstFeatures(id, params = {}, { signal } = {}) {
      const safeId = validateLayerId(id);
      const queryParams = {
        limit: "10000",
        srsName: "EPSG:3006",
        ...params,
        _t: Date.now(),
        _r: Math.random().toString(36).substring(7),
      };

      const q = new URLSearchParams(queryParams).toString();
      const url = `${base}/ogc/wfst/${safeId}/features?${q}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        cache: "no-store",
        signal,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch WFST features (${res.status})`);
      }

      const data = await res.json();

      // Ensure CRS metadata is present for OpenLayers
      if (!data.crsName && !data.crs) {
        data.crsName = "EPSG:3006";
        data.crs = {
          type: "name",
          properties: {
            name: "urn:ogc:def:crs:EPSG::3006",
          },
        };
      }

      return data;
    },

    async commitWfstTransaction(layerId, transaction, { signal } = {}) {
      const safeLayerId = validateLayerId(layerId);
      try {
        const url = `${base}/ogc/wfst/${safeLayerId}/transaction`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transaction),
          signal,
        });

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(error.error || "Transaction failed");
        }

        const result = await response.json();
        return result;
      } catch (error) {
        logError("commitWfstTransaction", error);
        throw error;
      }
    },
  };
}
