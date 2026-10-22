import { Role } from "../users";

export type LayerKind = "display" | "search" | "editing";

export interface Layer {
  layerKind?: LayerKind;
  id: string;
  serviceId: string;
  metadataId?: string | null;
  searchSettingsId?: string | null;
  infoClickSettingsId?: string | null;
  selectedLayers: string[];
  locked: boolean;
  name: string;
  internalName?: string;
  description?: string;
  opacity: number;
  maxZoom: number;
  minZoom: number;
  minMaxZoomAlertOnToggleOnly: boolean;
  tiled: boolean;
  singleTile: boolean;
  hidpi: boolean;
  legendOptions?: string;
  legendUrl?: string;
  legendIconUrl?: string;
  customRatio: number;
  showMetadata: boolean;
  infoClickActive: boolean;
  timeSliderVisible: boolean;
  status: string;
  timeSliderStart?: string;
  timeSliderEnd?: string;
  hideExpandArrow: boolean;
  zIndex: number;
  style?: string;
  /** Search/editing layers: geometry attribute name (top-level on API for editing). */
  geometryField?: string;
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
  metadata?: {
    id: string;
    title?: string;
    description?: string;
    owner?: string;
    url?: string;
    urlTitle?: string;
    attribution?: string;
  } | null;
  searchSettings?: {
    id: string;
    active: boolean;
    url?: string;
    searchFields: string[];
    primaryDisplayFields: string[];
    secondaryDisplayFields: string[];
    shortDisplayFields: string[];
    geometryField?: string;
    outputFormat: string;
  };
  infoClickSettings?: {
    id: string;
    layerId?: string;
    layerInstanceId?: string;
    definition?: string;
    icon?: string;
    format: string;
    sortProperty?: string;
    sortMethod: string;
    sortDescending: boolean;
  };
  options: Record<string, unknown>;
}

export interface DeletedLayer {
  id: string;
  name: string;
  layerKind: LayerKind;
  serviceId: string;
  serviceName: string;
  serviceDeleted: boolean;
  deletedAt: string | null;
  lastSavedDate?: string | null;
}

export interface LayersApiResponse {
  layers: Layer[];
  count?: number;
  error: string;
  errorId: string;
}

export interface DeletedLayersApiResponse {
  layers: DeletedLayer[];
  count?: number;
  error: string;
  errorId: string;
}

export interface LayerTypesApiResponse {
  layerTypes: string[];
  count?: number;
  error: string;
  errorId: string;
}

/**
 * Hajk status code (`hajkCode`) returned by the backend when an attempted
 * layer publication conflicts with an existing same-kind publication that
 * targets the same `serviceId` + `selectedLayers`. The client may retry the
 * same call with `force: true` to override.
 */
export const LAYER_ALREADY_PUBLISHED_HAJK_CODE = "CF005";

/**
 * Typed error thrown by `createLayer` so callers can react to specific
 * backend conditions (e.g. duplicate-publication conflict on HTTP 409).
 */
export class LayerCreationError extends Error {
  status?: number;
  hajkCode?: string;
  errorId?: string;
  details?: unknown;

  constructor(
    message: string,
    init: {
      status?: number;
      hajkCode?: string;
      errorId?: string;
      details?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "LayerCreationError";
    this.status = init.status;
    this.hajkCode = init.hajkCode;
    this.errorId = init.errorId;
    this.details = init.details;
  }

  /** True when the backend rejected the create as a duplicate publication. */
  get isDuplicatePublication(): boolean {
    return (
      this.status === 409 && this.hajkCode === LAYER_ALREADY_PUBLISHED_HAJK_CODE
    );
  }
}

export interface LayerCreateInput {
  layerKind?: LayerKind;
  id?: string;
  name?: string;
  serviceId: string;
  selectedLayers?: string[];
  locked?: boolean;
  options?: Record<string, string>;
  /**
   * When `true`, the backend skips the duplicate-publication guard
   * (HTTP 409, status code `LAYER_ALREADY_PUBLISHED`) and creates the layer
   * even if another Hajk layer of the same kind already publishes the same
   * source layer(s) for this service. Set after explicit user confirmation.
   */
  force?: boolean;
}

export interface LayerUpdateInput {
  layerKind?: LayerKind;
  name?: string;
  serviceId?: string;
  selectedLayers?: string[];
  locked?: boolean;
  internalName?: string;
  description?: string;
  opacity?: number;
  maxZoom?: number;
  minZoom?: number;
  minMaxZoomAlertOnToggleOnly?: boolean;
  tiled?: boolean;
  singleTile?: boolean;
  hidpi?: boolean;
  legendOptions?: string;
  legendUrl?: string;
  legendIconUrl?: string;
  customRatio?: number;
  showMetadata?: boolean;
  infoClickActive?: boolean;
  timeSliderVisible?: boolean;
  timeSliderStart?: string;
  timeSliderEnd?: string;
  hideExpandArrow?: boolean;
  zIndex?: number;
  style?: string;
  metadata?: {
    title?: string;
    description?: string;
    owner?: string;
    url?: string;
    urlTitle?: string;
    attribution?: string;
  };
  searchSettings?: {
    active?: boolean;
    url?: string;
    searchFields?: string[];
    primaryDisplayFields?: string[];
    secondaryDisplayFields?: string[];
    shortDisplayFields?: string[];
    geometryField?: string;
    outputFormat?: string;
  };
  infoClickSettings?: {
    layerId?: string;
    layerInstanceId?: string;
    definition?: string;
    icon?: string;
    format?: string;
    sortProperty?: string;
    sortMethod?: string;
    sortDescending?: boolean;
  };
  options?: Record<string, unknown>;
  geometryField?: string;
}

export interface LayerUsage {
  id: string;
  usage: "BACKGROUND" | "FOREGROUND";
  map: { id: number; name: string } | null;
  group: { id: string; name: string; maps: { mapName: string }[] } | null;
}

export interface LayerUsageApiResponse {
  count: number;
  usage: LayerUsage[];
}

export interface LayerUsageSummaryEntry {
  mapCount: number;
  mapNames: string[];
}

export interface LayerUsageSummaryApiResponse {
  summary: Record<string, LayerUsageSummaryEntry>;
}

export interface RoleOnLayer {
  layerId: string;
  roleId: string;
  role: Role;
}
export interface RoleOnLayerCreateAndUpdateInput {
  layerId: string;
  roleId: string;
}
export const infoClickFormat = [
  { title: "application/json", value: "application/json" },
  { title: "application/vnd.ogc.gml", value: "application/vnd.ogc.gml" },
  { title: "text/xml", value: "text/xml" },
];

export const sortType = [
  { title: "text", value: "text" },
  { title: "number", value: "number" },
];

export const searchOutputFormat = ["GML2", "GML3", "GML32"];
