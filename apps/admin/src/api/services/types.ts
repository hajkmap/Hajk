export interface Service {
  id: string;
  name: string;
  version: string;
  locked: boolean;
  url: string;
  type: string;
  serverType: string;
  comment: string;
}

export interface ServicesApiResponse {
  services: Service[];
  count: number;
  error: string;
  errorId: string;
}

export interface ServiceCreateFormData {
  url: string;
  name?: string;
  version?: string;
  locked?: boolean;
  type: string;
  serverType?: string;
  comment?: string;
}

export interface ServiceUpdateFormData {
  name?: string;
  url?: string;
  version?: string;
  locked?: boolean;
  type?: string;
  serverType?: string;
  comment?: string;
}

export const serviceTypes = ["ARCGIS", "VECTOR", "WFS", "WFST", "WMS", "WMTS"];

export interface ServiceCapabilities {
  layers: string[];
}

export interface UseServiceCapabilitiesProps {
  baseUrl: string;
  type: string;
}
