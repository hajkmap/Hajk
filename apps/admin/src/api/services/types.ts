export interface Service {
  id: string;
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
  locked: boolean;
  type: string;
  serverType: string;
  comment?: string;
}

export interface ServiceUpdateFormData {
  url?: string;
  locked?: boolean;
  type?: string;
  serverType?: string;
  comment?: string;
}

export const ServiceType = ["ARCGIS", "VECTOR", "WFS", "WFST", "WMS", "WMTS"];
