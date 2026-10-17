import type { Map } from "../maps";

export interface Group {
  id: string;
  locked: boolean;
  name: string;
  internalName?: string;
  type: GroupType;
  restrictedToRoles?: GroupRole[];
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
  /** From GET /groups — composition summary for list views. */
  layerCount?: number;
  nestedGroupCount?: number;
  nestingLevel?: number;
}

export interface GroupsApiResponse {
  groups: Group[];
  count?: number;
  error: string;
  errorId: string;
}

export interface GroupMapsApiResponse {
  maps: Map[];
  count?: number;
  error?: string;
  errorId?: string;
}

export interface GroupCreateInput {
  id?: string;
  name: string;
  internalName?: string;
  type: GroupType;
  /** The layers it starts with: in a layer group's tree, or a search group's. */
  layers?: GroupLayerCreateInput[];
}

/** A group's own fields; a layer group's content is saved with its tree. */
export interface GroupUpdateInput {
  name?: string;
  internalName?: string;
  type?: GroupType;
  locked?: boolean;
  restrictedToRoles?: GroupRoleUpdateInput[];
}

export interface GroupLayerCreateInput {
  layerId: string;
}

export interface GroupRole {
  groupId: string;
  roleId: string;
  role?: {
    id: string;
    code: string;
    title?: string | null;
  };
}

export interface UpdateGroupVariables {
  groupId: string;
  data: GroupUpdateInput;
}

export interface GroupRoleUpdateInput {
  roleId: string;
}

export enum GroupType {
  LAYER = "Layer",
  SEARCH = "Search",
}
