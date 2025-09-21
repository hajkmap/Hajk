export function createOgcApi(baseUrl) {
  const base = (baseUrl || "").replace(/\/+$/, "");

  const pickFields = (fields) =>
    fields ? `?fields=${encodeURIComponent(fields)}` : "";

  return {
    async fetchWfstList(fields = "id,caption") {
      const res = await fetch(`${base}/ogc/wfst${pickFields(fields)}`);
      if (!res.ok) throw new Error(`WFST-lista misslyckades (${res.status})`);
      const json = await res.json();

      // Normalize: API can respond as {layers:[...]}, {wfst:[...]}, or an Array
      let items = [];
      if (Array.isArray(json)) items = json;
      else if (Array.isArray(json.layers)) items = json.layers;
      else if (Array.isArray(json.wfst)) items = json.wfst;
      else items = [];

      return items; // ex: [{id, caption, ...}]
    },

    async getServiceMeta(id) {
      const res = await fetch(`${baseUrl}/ogc/wfst/${id}`);
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

    async fetchWfst(id, fields = "id,caption,projection,layers") {
      const res = await fetch(`${base}/ogc/wfst/${id}${pickFields(fields)}`);
      if (!res.ok) throw new Error(`WFST get misslyckades (${res.status})`);
      return res.json();
    },

    async fetchWfstFeatures(id, params = {}) {
      const q = new URLSearchParams({ limit: "10000", ...params }).toString();
      const res = await fetch(`${base}/ogc/wfst/${id}/features?${q}`);
      if (!res.ok)
        throw new Error(`WFST features misslyckades (${res.status})`);
      return res.json();
    },
  };
}
