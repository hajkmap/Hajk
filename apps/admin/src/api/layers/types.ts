export interface Layer {
  id: string;
  name: string;
  locked: boolean;
  serviceId: string;
  options: Record<string, string>;
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
  locked?: boolean;
  options?: Record<string, string>;
}
