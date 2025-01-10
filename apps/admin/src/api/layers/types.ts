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
