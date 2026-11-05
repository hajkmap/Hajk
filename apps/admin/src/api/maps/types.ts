import type { Layer } from "../layers/types";

/** Same keys as the `map` object in `map_*.json`. */
export type MapOptions = Record<string, unknown> & {
  title?: string;
  description?: string;
};

/** The map fields returned by the "maps using X" endpoints. */
export type MapSummary = Pick<Map, "id" | "name">;

export interface Map {
  id: number;
  name: string;
  locked: boolean;
  options?: MapOptions;
  projection?: {
    code: string;
  } | null;
  /** Many-to-many projections linked to the map (from GET /maps/:name). */
  projections?: { code: string }[];
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
  deletedAt?: string | null;
  /** Content counts from GET /maps (K6). */
  layerCount?: number;
  groupCount?: number;
  toolCount?: number;
  projectionCount?: number;
  themeCount?: number;
}

/**
 * A layer placed directly on a map (GET /maps/:name/layers): a background
 * layer, or a search or editing layer the map uses. `zIndex` is its order.
 */
export interface MapLayer extends Layer {
  mapId: number | null;
  groupId: string | null;
  visibleAtStart?: boolean;
  /** BACKGROUND layers become the layerswitcher's baselayers. */
  usage?: "BACKGROUND" | "FOREGROUND";
}

/** Payload entry for PUT /maps/:name/layers: a search or editing layer. */
export interface MapLayerPlacement {
  layerId: string;
  zIndex?: number;
}

export interface Projection {
  id: string;
  code: string;
}
export interface MapsApiResponse {
  maps: Map[];
  count: number;
  error: string;
  errorId: string;
}

export interface MapLayersApiResponse {
  layers: MapLayer[];
  count: number;
}

export interface ProjectionsApiResponse {
  projections: Projection[];
  count: number;
  error: string;
  errorId: string;
}

export interface MapMutation {
  id: number;
  locked: boolean;
  name: string;
  projection?: {
    code: string;
  };
  /** Many-to-many projections to link to the map (replaces the set on PATCH). */
  projections?: { code: string }[];
  options?: MapOptions;
}

/** Where a tool instance is placed in the map setting tools' placement containers. */
export type ToolZone =
  | "drawer"
  | "widgetLeft"
  | "widgetRight"
  | "controlButton";

export type ToolWindowPosition = "left" | "right";

/** A tool's placement on a map, stored in `ToolOnMap.options.target`. */
export type ToolTarget = "toolbar" | "left" | "right" | "control";

export interface ToolOnMap {
  mapName: string;
  toolId: number;
  active?: boolean;
  index: number;
  options?: Record<string, unknown>;
  tool: {
    id: number;
    type: string;
    internalName?: string | null;
    options: Record<string, unknown>;
  };
}
