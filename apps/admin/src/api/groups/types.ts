export interface Group {
  id: string;
  locked: boolean;
  name: string;
  internalName?: string;
  type: GroupType;
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
}

export interface GroupsApiResponse {
  groups: Group[];
  count?: number;
  error: string;
  errorId: string;
}

export interface GroupCreateInput {
  id?: string;
  name: string;
  internalName?: string;
  type: string;
}

export interface GroupUpdateInput {
  name?: string;
  internalName?: string;
  type?: string;
}

export enum GroupType {
  LAYER = "Layer",
  SEARCH = "Search",
}
