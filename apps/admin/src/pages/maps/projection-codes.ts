/**
 * Projections are usually stored twice: as `EPSG:N` and as the OGC URL alias
 * `http://www.opengis.net/gml/srs/epsg.xml#N` (WFS/GML responses often name
 * their SRS that way, so the client needs both). The admin shows such a pair
 * as one projection.
 */

export interface ProjectionGroup {
  /** The `EPSG:N` form when there is one, else the first code seen. */
  label: string;
  /** Every code in the group, the label first, aliases after. */
  codes: string[];
  sortKey: number;
}

const EPSG_PATTERN = /^EPSG:(\d+)$/i;
const OGC_URL_PATTERN =
  /^https?:\/\/www\.opengis\.net\/gml\/srs\/epsg\.xml#(\d+)$/i;

export function isEpsgCode(code: string): boolean {
  return EPSG_PATTERN.test(code);
}

/** EPSG number for `EPSG:N` and the OGC URL form; null for anything else. */
export function epsgNumber(code: string): number | null {
  const match = EPSG_PATTERN.exec(code) ?? OGC_URL_PATTERN.exec(code);
  return match ? Number(match[1]) : null;
}

/** One group per EPSG number; codes in other forms stand alone. */
export function groupProjectionCodes(codes: string[]): ProjectionGroup[] {
  const groups = new Map<string, ProjectionGroup>();
  for (const code of codes) {
    const n = epsgNumber(code);
    const key = n === null ? code : `epsg:${n}`;
    const group = groups.get(key) ?? {
      label: code,
      codes: [],
      sortKey: n ?? Number.MAX_SAFE_INTEGER,
    };
    group.codes.push(code);
    if (isEpsgCode(code)) group.label = code;
    groups.set(key, group);
  }
  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      codes: [group.label, ...group.codes.filter((c) => c !== group.label)],
    }))
    .sort((a, b) => a.sortKey - b.sortKey || a.label.localeCompare(b.label));
}

/**
 * Main-projection choices: the map's linked `EPSG:` codes, plus the current
 * value so it never vanishes from its own dropdown. A projection must be
 * linked before it can be the main one.
 */
export function getMainProjectionChoices(
  linked: string[] | undefined,
  current: string | undefined,
): string[] {
  const codes = (Array.isArray(linked) ? linked : []).filter(isEpsgCode);
  if (current) codes.push(current);
  return groupProjectionCodes(Array.from(new Set(codes))).flatMap(
    (group) => group.codes,
  );
}
