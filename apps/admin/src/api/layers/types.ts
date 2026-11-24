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
  /** Search layers: attribute name mapping stored as a JSON string. */
  aliasDict?: string | null;
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
    searchFields: string[];
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
    active?: boolean;
    displayFields?: string | null;
    secondaryLabelFields?: string | null;
    shortDisplayFields?: string | null;
    legend?: string | null;
    legendIcon?: string | null;
    options?: unknown;
  };
  options: Record<string, unknown>;
  /** The AD groups whose members get the layer; none means everyone. */
  visibleForGroups: string[];
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
  /** The text the layer's info shows users. */
  description?: string;
  metadata?: LayerUpdateInput["metadata"];
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
  aliasDict?: string;
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
    searchFields?: string[];
    geometryField?: string;
    outputFormat?: string;
    aliasDict?: string;
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
    active?: boolean;
    displayFields?: string;
    secondaryLabelFields?: string;
    shortDisplayFields?: string;
    legend?: string;
    legendIcon?: string;
    options?: Record<string, unknown>[];
  };
  options?: Record<string, unknown>;
  visibleForGroups?: string[];
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

export const searchOutputFormat = [
  "application/json",
  "application/vnd.geo+json",
  "GML3",
  "GML2",
];
