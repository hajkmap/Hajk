import type {
  ProjectionMapUsage,
  ProjectionServiceUsage,
  ProjectionWithUsage,
} from "../../../../api/projections";
import {
  groupProjectionCodes,
  type ProjectionGroup,
} from "../../projection-codes";

/** One row per projection: `EPSG:N` and its OGC URL alias together. */
export interface ProjectionRow extends ProjectionGroup {
  /**
   * The catalogue entry edited and deleted for this row (the `EPSG:N` one).
   * Missing for codes the map links that aren't in the catalogue.
   */
  primary?: ProjectionWithUsage;
  units: string;
  maps: ProjectionMapUsage[];
  services: ProjectionServiceUsage[];
  locked: boolean;
}

/**
 * Rows for the catalogue plus `extraCodes` (codes the map links that the
 * catalogue lacks), so nothing linked is hidden or impossible to untick.
 */
export function toRows(
  projections: ProjectionWithUsage[],
  extraCodes: string[],
): ProjectionRow[] {
  const byCode = new Map(projections.map((p) => [p.code, p]));
  const codes = Array.from(
    new Set([...projections.map((p) => p.code), ...extraCodes]),
  );
  return groupProjectionCodes(codes).map((group) => {
    const members = group.codes
      .map((code) => byCode.get(code))
      .filter((p): p is ProjectionWithUsage => p !== undefined);
    const primary = byCode.get(group.label) ?? members[0];
    // A map that uses either form uses the projection; "main" wins.
    const maps = new Map<number, ProjectionMapUsage>();
    for (const usage of members.flatMap((p) => p.maps)) {
      const known = maps.get(usage.id);
      if (!known || usage.usage === "main") maps.set(usage.id, usage);
    }
    const services = new Map<string, ProjectionServiceUsage>();
    for (const usage of members.flatMap((p) => p.services)) {
      services.set(usage.id, usage);
    }
    return {
      ...group,
      primary,
      units: primary?.units ?? "",
      maps: Array.from(maps.values()),
      services: Array.from(services.values()),
      locked: members.some((p) => p.locked),
    };
  });
}
