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
  workspace: string;
  getMapUrl: string;
  comment: string;
  metadata: {
    id: string;
    owner?: string;
    description?: string;
  };
  projection: {
    code: string;
  };
}

export interface Projection {
  id: number;
  locked: boolean;
  code: string;
  definition: string;
  extent: [number, number, number, number];
  units: string;
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
  name: string;
  type: string;
}

export interface ServiceUpdateInput {
  name?: string;
  url?: string;
  type?: string;
  version?: string;
  serverType?: string;
  imageFormat?: string;
  locked?: boolean;
  workspace?: string;
  getMapUrl?: string;
  comment?: string;
  projection?: {
    code?: string;
  };
  metadata?: {
    description?: string;
    owner?: string;
  };
}

export const serviceTypes = ["ARCGIS", "VECTOR", "WFS", "WFST", "WMS", "WMTS"];
export const serverTypes = [
  { title: "Geoserver", value: "GEOSERVER" },
  { title: "QGIS Server", value: "QGIS_SERVER" },
];
export const versions = [
  { title: "1.1.1", value: "1.1.1" },
  { title: "1.3.0", value: "1.3.0" },
];

export interface ServiceCapabilities {
  layers: string[];
  workspaces?: string[];
  styles?: Record<string, string[]>;
}

export interface LayersGridProps {
  layers: string[];
  serviceId: string;
  isError: boolean;
  isLoading: boolean;
}
export interface UseServiceCapabilitiesProps {
  baseUrl: string;
  type: string;
}
