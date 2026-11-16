import type { CapabilitiesLayerInfo, ServiceCapabilities } from "./types";

/** The parts of a GetCapabilities answer that describe the service itself. */
const SERVICE_PARTS = ["Service", "ServiceIdentification", "ServiceProvider"];

/** Where a WMS layer lists its coordinate systems (WMS 1.3.0, 1.1.1). */
const WMS_LAYER_CRS = ["CRS", "SRS"];

/** Where a WFS feature type lists its coordinate systems (WFS 2.0, 1.1, 1.0). */
const FEATURE_TYPE_CRS = [
  "DefaultCRS",
  "OtherCRS",
  "DefaultSRS",
  "OtherSRS",
  "SRS",
];

/** The text of an element's first child with this local name that has any. */
function childText(parent: Element, localName: string): string | undefined {
  for (const child of Array.from(parent.children)) {
    if (child.localName !== localName) continue;
    const text = child.textContent?.trim();
    if (text) return text;
  }
  return undefined;
}

/** The text of the first element inside `parts` with one of these local names that has any. */
function textInside(
  parts: Element[],
  localNames: string[],
): string | undefined {
  for (const part of parts) {
    for (const node of Array.from(part.getElementsByTagName("*"))) {
      if (!localNames.includes(node.localName)) continue;
      const text = node.textContent?.trim();
      if (text) return text;
    }
  }
  return undefined;
}

/**
 * "EPSG:3006" from the ways capabilities write a coordinate system:
 * "EPSG:3006", "urn:ogc:def:crs:EPSG::3006",
 * "http://www.opengis.net/def/crs/EPSG/0/3006" and
 * "http://www.opengis.net/gml/srs/epsg.xml#3006". Others are kept as written.
 */
export function crsCode(value: string): string {
  const code = value.trim();
  const epsg =
    /EPSG(?::[\d.]*)?:(\d+)$|EPSG\/[\d.]+\/(\d+)$|epsg\.xml#(\d+)$/i.exec(code);
  return epsg ? `EPSG:${epsg[1] ?? epsg[2] ?? epsg[3]}` : code;
}

/** The coordinate systems an element lists in its children with these names, in order. */
function crsCodesIn(element: Element, localNames: string[]): string[] {
  return Array.from(element.children)
    .filter((child) => localNames.includes(child.localName))
    .flatMap((child) => (child.textContent ?? "").trim().split(/\s+/))
    .filter(Boolean)
    .map(crsCode);
}

/**
 * A layer's coordinate systems: those it adds to the ones of the layer above
 * it. A server may list thousands on its top layer, which the layers below
 * then share instead of each holding a copy.
 */
interface LayerCrs {
  added: Set<string>;
  above: LayerCrs | null;
}

function hasCrs(crs: LayerCrs | null, code: string): boolean {
  for (let level = crs; level; level = level.above) {
    if (level.added.has(code)) return true;
  }
  return false;
}

/** In order: those of the layers above, then the layer's own. */
function crsCodesOf(crs: LayerCrs | null): string[] {
  return crs ? [...crsCodesOf(crs.above), ...crs.added] : [];
}

/**
 * Reads WMS layers' coordinate systems, each layer once. A layer that adds
 * none to those above it is the layer above, as far as they go.
 */
function wmsCrsReader(): (layer: Element) => LayerCrs | null {
  const known = new Map<Element, LayerCrs | null>();
  const read = (layer: Element): LayerCrs | null => {
    const cached = known.get(layer);
    if (cached !== undefined) return cached;
    const parent = layer.parentElement;
    const above = parent?.localName === "Layer" ? read(parent) : null;
    const added = new Set(
      crsCodesIn(layer, WMS_LAYER_CRS).filter((code) => !hasCrs(above, code)),
    );
    const crs = added.size === 0 ? above : { added, above };
    known.set(layer, crs);
    return crs;
  };
  return read;
}

/** The codes every layer has, in the first layer's order. */
function inEveryLayer(layers: (LayerCrs | null)[]): string[] {
  const [first = null, ...rest] = [...new Set(layers)];
  return crsCodesOf(first).filter((code) =>
    rest.every((crs) => hasCrs(crs, code)),
  );
}

/**
 * Reads a GetCapabilities answer: the layers with their workspaces, styles,
 * titles and abstracts, the coordinate systems every layer can be drawn in,
 * and the service's own title, abstract and organisation.
 */
export function parseCapabilitiesFromXML(
  xmlString: string,
  type = "WMS",
): ServiceCapabilities {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  const layerNames: string[] = [];
  const workspaces: Set<string> = new Set<string>();
  const styles: Record<string, { name: string; legendUrl?: string }[]> = {};
  const layerInfo: Record<string, CapabilitiesLayerInfo> = {};
  const layerCrs: (LayerCrs | null)[] = [];
  const wmsLayerCrs = wmsCrsReader();

  // WFS capabilities use FeatureType elements; WMS/WMTS use Layer elements.
  const isWFS = type === "WFS";
  const elements = isWFS
    ? xmlDoc.getElementsByTagName("FeatureType")
    : xmlDoc.getElementsByTagName("Layer");

  for (const element of elements) {
    // Scope to direct child Name to avoid picking up names from nested layers or styles.
    const name = childText(element, "Name");

    if (!name) continue;

    layerNames.push(name);

    if (name.includes(":")) {
      workspaces.add(name.split(":")[0]);
    }

    layerInfo[name] = {
      title: childText(element, "Title"),
      abstract: childText(element, "Abstract"),
    };
    layerCrs.push(
      isWFS
        ? { added: new Set(crsCodesIn(element, FEATURE_TYPE_CRS)), above: null }
        : wmsLayerCrs(element),
    );

    if (!isWFS) {
      const styleElements = Array.from(element.children).filter(
        (c) => c.localName === "Style",
      );
      const styleData: { name: string; legendUrl?: string }[] = [];

      for (const styleElement of styleElements) {
        const styleName = childText(styleElement, "Name");
        const legendUrl = styleElement
          .getElementsByTagName("LegendURL")[0]
          ?.getElementsByTagName("OnlineResource")[0]
          ?.getAttribute("xlink:href");
        if (styleName) {
          styleData.push({
            name: styleName,
            legendUrl: legendUrl ?? undefined,
          });
        }
      }
      styles[name] = styleData;
    }
  }

  // Only the service's own part: a layer's title or abstract is not the service's.
  const serviceParts = Array.from(
    xmlDoc.documentElement?.children ?? [],
  ).filter((child) => SERVICE_PARTS.includes(child.localName));
  const serviceText = (localName: string) =>
    serviceParts.map((part) => childText(part, localName)).find(Boolean);

  return {
    layers: layerNames,
    workspaces: Array.from(workspaces),
    styles,
    layerInfo,
    projections: inEveryLayer(layerCrs),
    metadata: {
      title: serviceText("Title"),
      description: serviceText("Abstract"),
      organization: textInside(serviceParts, [
        "ProviderName",
        "ContactOrganization",
        "ContactOrganizationName",
      ]),
    },
  };
}

/**
 * The coordinate system a new service gets: the default when the service
 * lists it, else the first of those admin offers that it lists, else the
 * default. An empty list (the answer didn't say) keeps the default.
 */
export function chooseProjection(
  defaultCode: string,
  listed: string[],
  offered: string[],
): string {
  if (listed.length === 0 || listed.includes(defaultCode)) return defaultCode;
  return offered.find((code) => listed.includes(code)) ?? defaultCode;
}
