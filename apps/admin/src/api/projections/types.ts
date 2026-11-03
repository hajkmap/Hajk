import type { Projection } from "../services/types";

export interface ProjectionMapUsage {
  id: number;
  name: string;
  /** "main" = the map's main projection, "linked" = in its linked set. */
  usage: "main" | "linked";
  /** Soft-deleted maps still reference the projection. */
  deleted: boolean;
}

export interface ProjectionServiceUsage {
  id: string;
  name: string;
  deleted: boolean;
}

export interface ProjectionWithUsage extends Projection {
  maps: ProjectionMapUsage[];
  services: ProjectionServiceUsage[];
}

export interface ProjectionCreateInput {
  code: string;
  definition: string;
  extent: [number, number, number, number];
  units?: string;
  /** For `EPSG:N`, also create `http://www.opengis.net/gml/srs/epsg.xml#N`. */
  withOgcAlias?: boolean;
}

export interface ProjectionUpdateInput {
  definition?: string;
  extent?: [number, number, number, number];
  units?: string;
}
