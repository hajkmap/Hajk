export interface Layer {
  id: string;
  serviceId: string;
  metadataId: string;
  searchSettingsId: string;
  infoClickSettingsId: string;
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
  legendUrl?: string;
  legendIconUrl?: string;
  customRatio: number;
  showMetaData: boolean;
  infoClickActive: boolean;
  timeSliderVisible: boolean;
  timeSliderStart?: string;
  timeSliderEnd?: string;
  hideExpandArrow: boolean;
  zIndex: number;
  style?: string;
  metadata: {
    id: string;
    url?: string;
    urlTitle?: string;
    attribution?: string;
  };
  searchSettings: {
    id: string;
    active: boolean;
    url?: string;
    searchFields?: string[];
    primaryDisplayFields?: string[];
    secondaryDisplayFields?: string[];
    shortDisplayFields?: string[];
    geometryField?: string;
  };
  infoClickSettings: {
    id: string;
    layerId?: string;
    layerInstanceId?: string;
    definition?: string;
    icon?: string;
    format?: string;
    sortProperty?: string;
    sortMethod?: string;
    sortDescending?: boolean;
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
  id?: string;
  name?: string;
  serviceId: string;
  selectedLayers?: string[];
  locked?: boolean;
  options?: Record<string, string>;
}

export interface LayerUpdateInput {
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
  legendUrl?: string;
  legendIconUrl?: string;
  customRatio?: number;
  showMetaData?: boolean;
  infoClickActive?: boolean;
  timeSliderVisible?: boolean;
  timeSliderStart?: string;
  timeSliderEnd?: string;
  hideExpandArrow?: boolean;
  zIndex?: number;
  style?: string;
  metadata: {
    url?: string;
    urlTitle?: string;
    attribution?: string;
  };
  searchSettings: {
    active?: boolean;
    url?: string;
    searchFields?: string[];
    primaryDisplayFields?: string[];
    secondaryDisplayFields?: string[];
    shortDisplayFields?: string[];
    geometryField?: string;
  };
  infoClickSettings: {
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
