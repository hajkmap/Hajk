export interface Layer {
  id: string;
  name: string;
  options: Record<string, string>;
}

export interface LayersApiResponse {
  layers: Layer[];
  error: string;
  errorId: string;
}
