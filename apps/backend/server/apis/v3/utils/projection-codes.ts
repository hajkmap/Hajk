/**
 * A projection is usually stored twice: as `EPSG:N` and as its OGC URL alias
 * `http://www.opengis.net/gml/srs/epsg.xml#N`. WFS/GML responses often name
 * their SRS in the URL form, so the client needs both registered with proj4.
 */
const EPSG_PATTERN = /^EPSG:(\d+)$/i;
const OGC_URL_PATTERN =
  /^https?:\/\/www\.opengis\.net\/gml\/srs\/epsg\.xml#(\d+)$/i;

/** EPSG number of `EPSG:N` or its OGC URL alias; null for anything else. */
export function epsgNumber(code: string): number | null {
  const match = EPSG_PATTERN.exec(code) ?? OGC_URL_PATTERN.exec(code);
  return match ? Number(match[1]) : null;
}

export function ogcUrlCode(n: number): string {
  return `http://www.opengis.net/gml/srs/epsg.xml#${n}`;
}

/** Both forms of an EPSG number, e.g. for looking up a projection's pair. */
export function epsgCodeForms(n: number): string[] {
  return [`EPSG:${n}`, ogcUrlCode(n)];
}
