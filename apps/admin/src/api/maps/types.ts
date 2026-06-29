import type { Layer } from "../layers/types";

export interface Map {
  id: number;
  name: string;
  locked: boolean;
  options?: Record<string, string>;
  projection?: {
    code: string;
  } | null;
  /** Many-to-many projections linked to the map (from GET /maps/:name). */
  projections?: { code: string }[];
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
  /** Content counts from GET /maps (K6). */
  layerCount?: number;
  groupCount?: number;
  toolCount?: number;
  projectionCount?: number;
}

/**
 * A layer attached to a map (GET /maps/:name/layers). `mapId` is set for
 * layers placed directly on the map; `groupId` is set for layers inherited
 * via a group on the map.
 */
export interface MapLayer extends Layer {
  mapId: number | null;
  groupId: string | null;
  /** Placement on map (from LayerInstance), when loaded via GET /maps/:name/layers. */
  visibleAtStart?: boolean;
}

/** A group placement on a map (GroupsOnMaps row, GET /maps/:name/groups). */
export interface MapGroup {
  id: string;
  mapName: string;
  groupId: string;
  parentGroupId: string | null;
  usage: "BACKGROUND" | "FOREGROUND";
  name: string;
  toggled: boolean;
  expanded: boolean;
}

/** Payload entry for PUT /maps/:name/layers. */
export interface MapLayerPlacement {
  layerId: string;
  usage?: "BACKGROUND" | "FOREGROUND";
  visibleAtStart?: boolean;
  infoClickActive?: boolean;
  zIndex?: number;
}

/** Payload entry for PUT /maps/:name/groups. */
export interface MapGroupPlacement {
  id?: string;
  groupId: string;
  parentGroupId?: string | null;
  usage?: "BACKGROUND" | "FOREGROUND";
  name?: string;
  toggled?: boolean;
  expanded?: boolean;
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

export interface MapGroupsApiResponse {
  groups: MapGroup[];
  count: number;
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
  options?: Record<string, string>;
}

export type ToolZone = "drawer" | "widgetLeft" | "widgetRight" | "controlButton";

export interface ToolOnMap {
  mapName: string;
  toolId: number;
  index: number;
  target: ToolZone | null;
  tool: {
    id: number;
    type: string;
    options: Record<string, unknown>;
  };
}
