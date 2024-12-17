export interface Map {
  id: string;
  name: string;
  locked: boolean;
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
  maps: Map[];
  count: number;
  error: string;
  errorId: string;
}

export interface GroupApiResponse {
  groups: string[];
  count: number;
  error: string;
  errorId: string;
}

export interface ProjectionsApiResponse {
  projections: Projection[];
  count: number;
  error: string;
  errorId: string;
}

export interface MapMutation {
  id: number;
  locked: boolean;
  name: string;
  options?: Record<string, string>;
}
