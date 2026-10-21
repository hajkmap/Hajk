import KML from "ol/format/KML.js";

const KML_NAMESPACES = [
  null,
  "http://www.opengis.net/kml/2.2",
  "http://earth.google.com/kml/2.0",
  "http://earth.google.com/kml/2.1",
  "http://earth.google.com/kml/2.2",
];

const ACCEPTED_NS = new Set([
  "",
  "http://www.opengis.net/kml/2.2",
  "http://earth.google.com/kml/2.0",
  "http://earth.google.com/kml/2.1",
  "http://earth.google.com/kml/2.2",
]);

const TEXT_FIELDS = new Set(["name", "description", "address", "phoneNumber"]);

const SIMPLE_TYPES = {
  Point: "point",
  MultiPoint: "point",
  LineString: "line",
  MultiLineString: "line",
  Polygon: "polygon",
  MultiPolygon: "polygon",
};

export const KML_STYLE_FIELDS = {
  point: ["pointColor", "pointRadius"],
  line: ["lineColor", "lineWidth"],
  polygon: [
    "polygonStrokeColor",
    "polygonStrokeWidth",
    "polygonFillColor",
    "polygonFillOpacity",
  ],
};

// A type is overridden only when every style field for it is stored.
export function hasKmlStyle(config, type) {
  return KML_STYLE_FIELDS[type].every(
    (key) => config?.[key] != null && config[key] !== ""
  );
}

function accepted(node) {
  return ACCEPTED_NS.has(node.namespaceURI ?? "");
}

function elements(node) {
  const children = [];
  for (
    let child = node.firstElementChild;
    child;
    child = child.nextElementSibling
  )
    children.push(child);
  return children;
}

function textValue(node) {
  const value = node.textContent ?? "";
  return value.trim() ? value : undefined;
}

// Homogeneous MultiGeometries, including nested ones, use that type so an
// Admin override can replace the file style. Mixed collections cannot.
function kmlGeometryType(geometry) {
  const simple = SIMPLE_TYPES[geometry.getType()];
  if (simple) return simple;
  if (geometry.getType() !== "GeometryCollection") return "collection";
  const kinds = new Set();
  const visit = (part) => {
    if (part.getType() === "GeometryCollection") {
      for (const child of part.getGeometries()) visit(child);
      return;
    }
    const kind = SIMPLE_TYPES[part.getType()];
    if (kind) kinds.add(kind);
  };
  visit(geometry);
  return kinds.size === 1 ? [...kinds][0] : "collection";
}

function collectPlacemarks(node, placemarks) {
  for (const child of elements(node)) {
    if (!accepted(child)) continue;
    if (child.localName === "Placemark") placemarks.push(child);
    else if (
      child.localName === "Document" ||
      child.localName === "Folder" ||
      child.localName === "kml"
    )
      collectPlacemarks(child, placemarks);
  }
}

function readExtendedData(node, fields) {
  for (const child of elements(node)) {
    if (!accepted(child)) continue;
    if (child.localName === "Data") {
      const valueNode = elements(child).find(
        (candidate) => accepted(candidate) && candidate.localName === "value"
      );
      const value = valueNode ? textValue(valueNode) : undefined;
      if (value === undefined) continue;
      const name = child.getAttribute("name");
      if (name) fields[name] = value;
      else {
        const display = elements(child).find(
          (candidate) =>
            accepted(candidate) && candidate.localName === "displayName"
        );
        const displayName = display ? textValue(display) : undefined;
        if (displayName) fields[displayName] = value;
      }
    } else if (child.localName === "SchemaData") {
      for (const simple of elements(child)) {
        if (!accepted(simple) || simple.localName !== "SimpleData") continue;
        const name = simple.getAttribute("name");
        const value = textValue(simple);
        if (name && value !== undefined) fields[name] = value;
      }
    }
  }
}

function readPlacemarkFields(placemark) {
  const fields = Object.create(null);
  for (const child of elements(placemark)) {
    if (!accepted(child)) continue;
    if (TEXT_FIELDS.has(child.localName)) {
      const value = textValue(child);
      if (value !== undefined) fields[child.localName] = value;
    } else if (child.localName === "ExtendedData")
      readExtendedData(child, fields);
  }
  return fields;
}

// OpenLayers keeps the embedded style on the feature, not in its properties.
export function readKML(text, layerId, projection) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const root = doc.documentElement;
  if (
    doc.getElementsByTagNameNS("*", "parsererror").length ||
    root?.localName !== "kml" ||
    !KML_NAMESPACES.includes(root.namespaceURI || null)
  ) {
    throw new Error("Expected a valid KML document");
  }
  const format = new KML({ extractStyles: true, showPointNames: true });
  // ExtendedData is read below. Keep arbitrary field names out of OL's parser,
  // where a field named "geometry" can replace the actual geometry.
  const geometryDoc = doc.cloneNode(true);
  for (const node of Array.from(
    geometryDoc.getElementsByTagNameNS("*", "ExtendedData")
  )) {
    if (accepted(node)) node.parentNode.removeChild(node);
  }
  const parsed = format.readFeatures(geometryDoc, {
    featureProjection: projection,
  });
  const placemarks = [];
  collectPlacemarks(root, placemarks);
  if (parsed.length !== placemarks.length)
    throw new Error("Invalid KML document");
  const ordinals = { point: 0, line: 0, polygon: 0, collection: 0 };
  const features = [];
  for (let i = 0; i < parsed.length; i++) {
    const feature = parsed[i];
    const geometry = feature.getGeometry();
    if (!geometry) continue;
    const style = feature.getStyle();
    for (const key of Object.keys(feature.getProperties()))
      feature.unset(key, true);
    feature.setGeometry(geometry);
    if (style) feature.setStyle(style);
    for (const [key, value] of Object.entries(
      readPlacemarkFields(placemarks[i])
    ))
      // "geometry" is OpenLayers' reserved geometry property.
      if (key !== feature.getGeometryName()) feature.set(key, value);
    const kmlType = kmlGeometryType(geometry);
    feature.set("kmlType", kmlType);
    feature.setId(`${layerId}:${kmlType}:${ordinals[kmlType]++}`);
    features.push(feature);
  }
  return features;
}

// Keep KML grouping separate from WFS feature-name conventions.
export function getKMLClickInfo(feature, layer) {
  if (!layer.get("kml")) return null;
  const kmlType = feature.get("kmlType");
  return {
    kmlType,
    layerId: `${layer.get("name")}.${layer.ol_uid}.${kmlType}`,
    displayName: `${layer.get("caption") || "KML"} (${kmlType})`,
    infoclickDefinition: layer.get("kmlTemplates")?.[kmlType] || "",
  };
}
