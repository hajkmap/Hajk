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

export interface LayersApiResponse {
  layers: Layer[];
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

export interface LayerCreateInput {
  layerKind?: LayerKind;
  id?: string;
  name?: string;
  serviceId: string;
  selectedLayers?: string[];
  locked?: boolean;
  options?: Record<string, string>;
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
