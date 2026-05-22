export interface Service {
  id: string;
  metadataId?: string | null;
  projectionId?: number | null;
  name: string;
  locked: boolean;
  url: string;
  version: string;
  imageFormat: string;
  type: SERVICE_TYPE;
  serverType: string;
  workspace?: string | null;
  getMapUrl?: string | null;
  comment?: string | null;
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
  metadata?: {
    id: string;
    title?: string;
    owner?: string;
    description?: string;
    url?: string;
    urlTitle?: string;
    attribution?: string;
  } | null;
  projection?: {
    code: string;
  } | null;
  status?: SERVICE_STATUS;
  lastChecked?: string;
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
  serverType?: string;
  version?: string;
  imageFormat?: string;
  workspace?: string;
  getMapUrl?: string;
  comment?: string | null;
  locked?: boolean;
  projection?: {
    code: string;
  };
  metadata?: {
    title?: string;
    description?: string;
    owner?: string;
    url?: string;
    urlTitle?: string;
    attribution?: string;
  };
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
    title?: string;
    description?: string;
    owner?: string;
    url?: string;
    urlTitle?: string;
    attribution?: string;
  };
}

export interface ServiceCapabilities {
  layers: string[];
  workspaces?: string[];
  styles?: Record<string, { name: string; legendUrl?: string | undefined }[]>;
  metadata?: {
    title?: string;
    description?: string;
    organization?: string;
  };
}

export interface LayersGridProps {
  layers: string[];
  workspaces?: string[];
  serviceId: string;
  isError: boolean;
  isLoading: boolean;
  onRetry?: () => void;
}
export interface UseServiceCapabilitiesProps {
  baseUrl: string;
  type?: string;
}

export const serverTypes = [
  { title: "Geoserver", value: "GEOSERVER" },
  { title: "QGIS Server", value: "QGIS_SERVER" },
];
export const versions = [
  { title: "1.1.1", value: "1.1.1" },
  { title: "1.3.0", value: "1.3.0" },
];

export const imageFormats = [
  { title: "image/png", value: "image/png" },
  { title: "image/png; mode=8bit", value: "image/png; mode=8bit" },
  { title: "image/jpeg", value: "image/jpeg" },
  { title: "image/vnd.jpeg-png", value: "image/vnd.jpeg-png" },
  { title: "image/vnd.jpeg-png8", value: "image/vnd.jpeg-png8" },
];

export enum SERVICE_TYPE {
  ARCGIS = "ARCGIS",
  VECTOR = "VECTOR",
  WFS = "WFS",
  WFST = "WFST",
  WMS = "WMS",
  WMTS = "WMTS",
}

export enum SERVICE_STATUS {
  UNKNOWN,
  HEALTHY,
  UNHEALTHY,
}
