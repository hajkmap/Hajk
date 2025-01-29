export interface Service {
  id: string;
  metadataId: string;
  projectionId: number;
  name: string;
  locked: boolean;
  url: string;
  version: string;
  imageFormat: string;
  type: string;
  serverType: string;
  comment: string;
  metadata: {
    id: string;
    owner: string;
    description: string;
  };
  projection: {
    code: string;
  };
}

export interface ServicesApiResponse {
  services: Service[];
  count: number;
  error: string;
  errorId: string;
}

export interface ServiceCreateInput {
  id?: string;
  url: string;
  name?: string;
  version?: string;
  locked?: boolean;
  type: string;
  serverType?: string;
  comment?: string;
}

export interface ServiceUpdateInput {
  name?: string;
  url?: string;
  version?: string;
  locked?: boolean;
  type?: string;
  serverType?: string;
  comment?: string;
  metadata?: {
    owner?: string;
  };
}

export const serviceTypes = ["ARCGIS", "VECTOR", "WFS", "WFST", "WMS", "WMTS"];
export const serverTypes = [
  { title: "Geoserver", value: "GEOSERVER" },
  { title: "QGIS Server", value: "QGIS_SERVER" },
];

export interface ServiceCapabilities {
  layers: string[];
}

export interface UseServiceCapabilitiesProps {
  baseUrl: string;
  type: string;
}
