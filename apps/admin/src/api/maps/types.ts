export interface Map {
  id: string;
  name: string;
  options?: Record<string, string>;
}

export interface Group {
  id: string;
  mapName: string;
  groupId: string;
  name: string;
}

export interface Projection {
  id: string;
  code: string;
}
export interface MapsApiResponse {
  maps: string[];
  count?: number;
  error: string;
  errorId: string;
}

export interface GroupApiResponse {
  groups: string[];
  count?: number;
  error: string;
  errorId: string;
}

export interface ProjectionsApiResponse {
  projections: Projection[];
  count?: number;
  error: string;
  errorId: string;
}
