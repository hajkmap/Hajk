import type { CapabilitiesLayerInfo, ServiceCapabilities } from "./types";

/** The parts of a GetCapabilities answer that describe the service itself. */
const SERVICE_PARTS = ["Service", "ServiceIdentification", "ServiceProvider"];

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
 * "EPSG:3006", "urn:ogc:def:crs:EPSG::3006" and
 * "http://www.opengis.net/def/crs/EPSG/0/3006". Others are kept as written.
 */
export function crsCode(value: string): string {
  const code = value.trim();
  const epsg = /EPSG(?::[\d.]*)?:(\d+)$|EPSG\/[\d.]+\/(\d+)$/i.exec(code);
  return epsg ? `EPSG:${epsg[1] ?? epsg[2]}` : code;
}

/** The coordinate systems in these elements, in order and without repeats. */
function crsListOf(elements: Element[]): string[] {
  const codes = elements
    .flatMap((element) => (element.textContent ?? "").trim().split(/\s+/))
    .filter(Boolean)
    .map(crsCode);
  return [...new Set(codes)];
}

/** A WMS layer's coordinate systems: those of the layers above it, then its own. */
function wmsLayerCrs(layer: Element): string[] {
  const chain: Element[] = [];
  for (
    let element: Element | null = layer;
    element?.localName === "Layer";
    element = element.parentElement
  ) {
    chain.unshift(element);
  }
  return [
    ...new Set(
      chain.flatMap((element) =>
        crsListOf(
          Array.from(element.children).filter(
            (child) => child.localName === "CRS" || child.localName === "SRS",
          ),
        ),
      ),
    ),
  ];
}

function featureTypeCrs(featureType: Element): string[] {
  return crsListOf(
    Array.from(featureType.children).filter((child) =>
      FEATURE_TYPE_CRS.includes(child.localName),
    ),
  );
}

/** The codes every list has, in the first list's order. */
function inEveryList(lists: string[][]): string[] {
  const [first = [], ...rest] = lists;
  return first.filter((code) => rest.every((list) => list.includes(code)));
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
  const crsLists: string[][] = [];

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
    crsLists.push(isWFS ? featureTypeCrs(element) : wmsLayerCrs(element));

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
    projections: inEveryList(crsLists),
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
 * lists it, else the first one it lists among those admin offers, else the
 * default. An empty list (the answer didn't say) keeps the default.
 */
export function chooseProjection(
  defaultCode: string,
  listed: string[],
  offered: string[],
): string {
  if (listed.length === 0 || listed.includes(defaultCode)) return defaultCode;
  return listed.find((code) => offered.includes(code)) ?? defaultCode;
}
