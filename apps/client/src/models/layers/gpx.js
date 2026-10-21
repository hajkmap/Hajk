import GPX from "ol/format/GPX.js";

export const GPX_DEFAULTS = {
  waypointColor: "#008000",
  waypointRadius: 6,
  trackColor: "#0000ff",
  trackWidth: 3,
  routeColor: "#ffa500",
  routeWidth: 3,
};

// Read object attributes directly: geometry layouts cannot distinguish an absent
// elevation/time from the zero values OpenLayers supplies for missing ordinates.
export function readGPX(text, layerId, projection) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const root = doc.documentElement;
  const namespaces = [
    "http://www.topografix.com/GPX/1/0",
    "http://www.topografix.com/GPX/1/1",
  ];
  if (
    doc.getElementsByTagNameNS("*", "parsererror").length ||
    root.localName !== "gpx" ||
    !namespaces.includes(root.namespaceURI) ||
    !["1.0", "1.1"].includes(root.getAttribute("version"))
  ) {
    throw new Error("Expected a valid GPX 1.0 or 1.1 document");
  }
  const types = { wpt: "waypoint", rte: "route", trk: "track" };
  const ordinals = { waypoint: 0, route: 0, track: 0 };
  const features = [];
  const format = new GPX();
  for (const node of Array.from(root.childNodes)) {
    const type = types[node.localName];
    if (!type || node.namespaceURI !== root.namespaceURI) continue;
    const ordinal = ordinals[type]++;
    const feature = format.readFeature(node, { featureProjection: projection });
    if (!feature) throw new Error("Invalid GPX object");
    const geometry = feature.getGeometry();
    for (const key of Object.keys(feature.getProperties()))
      feature.unset(key, true);
    feature.setGeometry(geometry);
    for (const field of Array.from(node.childNodes)) {
      if (field.namespaceURI !== root.namespaceURI) continue;
      const key = field.localName;
      if (
        ![
          "name",
          "cmt",
          "desc",
          "src",
          "sym",
          "type",
          "number",
          "ele",
          "time",
          "magvar",
          "geoidheight",
          "fix",
          "sat",
          "hdop",
          "vdop",
          "pdop",
          "ageofdgpsdata",
          "dgpsid",
          "url",
          "urlname",
          "link",
        ].includes(key)
      )
        continue;
      if (type !== "waypoint" && ["ele", "time"].includes(key)) continue;
      let value = field.textContent;
      if (key === "link") {
        const links = feature.get("links")?.split(", ") || [];
        links.push(field.getAttribute("href"));
        feature.set("links", links.filter(Boolean).join(", "));
        for (const child of Array.from(field.childNodes)) {
          if (
            child.namespaceURI === root.namespaceURI &&
            ["text", "type"].includes(child.localName)
          )
            feature.set(
              child.localName === "text" ? "linkText" : "linkType",
              child.textContent
            );
        }
        continue;
      }
      if (!value.trim()) continue;
      if (key === "time") {
        const timestamp = Date.parse(value);
        if (!Number.isFinite(timestamp)) continue;
        value = new Date(timestamp).toISOString();
      }
      if (key === "ele") value = Number(value);
      feature.set(key, value);
    }
    feature.set("gpxType", type);
    feature.setId(`${layerId}:${type}:${ordinal}`);
    features.push(feature);
  }
  return features;
}

// Keep GPX grouping separate from WFS feature-name conventions.
export function getGPXClickInfo(feature, layer) {
  if (!layer.get("gpx")) return null;
  const gpxType = feature.get("gpxType");
  return {
    gpxType,
    layerId: `${layer.get("name")}.${layer.ol_uid}.${gpxType}`,
    displayName: `${layer.get("caption") || "GPX"} (${gpxType})`,
    infoclickDefinition: layer.get("gpxTemplates")?.[gpxType] || "",
  };
}
