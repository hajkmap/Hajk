export function createOgcApi(baseUrl) {
  const base = (baseUrl || "").replace(/\/+$/, "");

  // Skip undefined fields in ?fields=
  const pickFields = (fields) => {
    const f = (fields ?? "").trim();
    return f ? `?fields=${encodeURIComponent(f)}` : "";
  };

  return {
    async fetchWfstList(fields = "id,caption") {
      const res = await fetch(`${base}/ogc/wfst${pickFields(fields)}`);
      if (!res.ok) throw new Error(`WFST-lista misslyckades (${res.status})`);
      const json = await res.json();
      let items = [];
      if (Array.isArray(json)) items = json;
      else if (Array.isArray(json.layers)) items = json.layers;
      else if (Array.isArray(json.wfst)) items = json.wfst;
      return items;
    },

    async getServiceMeta(id) {
      const res = await fetch(`${base}/ogc/wfst/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch metadata (${res.status})`);
      const layer = await res.json();
      return {
        id: layer.id,
        caption: layer.caption,
        title: layer.caption,
        projection: layer.projection,
        layers: layer.layers || [],
      };
    },

    async fetchWfst(id, fields /* = undefined */) {
      const url = `${base}/ogc/wfst/${id}${pickFields(fields)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`WFST get misslyckades (${res.status})`);
      return res.json();
    },

    async fetchWfstFeatures(id, params = {}) {
      const queryParams = {
        limit: "10000",
        srsName: "EPSG:3006",
        ...params,
        _t: Date.now(),
        _r: Math.random().toString(36).substring(7),
      };

      const q = new URLSearchParams(queryParams).toString();
      const url = `${base}/ogc/wfst/${id}/features?${q}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        cache: "no-store",
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

    async commitWfstTransaction(layerId, transaction) {
      const url = `${baseUrl}/ogc/wfst/${layerId}/transaction`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || "Transaction failed");
      }

      const result = await response.json();
      return result;
    },
  };
}
