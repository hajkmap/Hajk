import type { Layer } from "../layers";
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
  layers?: GroupLayerCreateInput[];
  layerSwitcherTree?: LayerSwitcherTreeNode[];
}

export interface GroupUpdateInput {
  name?: string;
  internalName?: string;
  type?: GroupType;
  locked?: boolean;
  layers?: GroupLayerCreateInput[];
  layerSwitcherTree?: LayerSwitcherTreeNode[];
  restrictedToRoles?: GroupRoleUpdateInput[];
}

export interface GroupLayersUpdateInput {
  layers: GroupLayerCreateInput[];
  layerSwitcherTree?: LayerSwitcherTreeNode[];
}

export type LayerSwitcherTreeNode =
  | { type: "layer"; id: string }
  | {
      type: "group";
      id: string;
      name: string;
      children: LayerSwitcherTreeNode[];
    };

export interface GroupLayerCreateInput {
  layerId: string;
  usage: "BACKGROUND" | "FOREGROUND";
  zIndex?: number;
  visibleAtStart?: boolean;
  options?: Record<string, unknown>;
}

/** Layer row returned from GET /groups/:id/layers (includes group placement). */
export interface GroupLayer extends Layer {
  drawOrder?: number;
  visibleAtStart?: boolean;
  placementOptions?: Record<string, unknown>;
}

export interface GroupLayersApiResponse {
  layers: GroupLayer[];
  layerSwitcherTree?: LayerSwitcherTreeNode[];
  count?: number;
  error?: string;
  errorId?: string;
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

export type UpdateGroupVariables = {
  groupId: string;
  data: GroupUpdateInput;
};

export type UpdateGroupLayersVariables = {
  groupId: string;
  data: GroupLayersUpdateInput;
};

export interface GroupRoleUpdateInput {
  roleId: string;
}

export enum GroupType {
  LAYER = "Layer",
  SEARCH = "Search",
}
