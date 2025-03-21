export interface Group {
  id: string;
  locked: boolean;
  name: string;
  internalName?: string;
  type: GroupType;
}

export interface GroupsApiResponse {
  groups: Group[];
  count?: number;
  error: string;
  errorId: string;
}

export enum GroupType {
  LAYER = "Layer",
  SEARCH = "Search",
}
