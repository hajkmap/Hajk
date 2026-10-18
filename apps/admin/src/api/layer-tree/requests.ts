import { HttpError } from "../../lib/http-error";
import { getApiClient, InternalApiError } from "../../lib/internal-api-client";
import {
  GroupTreeWrite,
  LayerTreeGroupNode,
  LayerTreePlacements,
  MapLayerTree,
  MapLayerTreeWrite,
} from "./types";

/**
 * Layer trees: GET/PUT /groups/:groupId/tree,
 * GET/PUT /maps/:mapName/layer-tree and GET /groups/placements.
 */

// The backend explains why a tree can't be saved (for example a group placed
// inside itself), so pass its text on instead of a generic message, with the
// status when there is one.
function toError(error: unknown, fallback: string): Error {
  const response = (error as InternalApiError).response;
  const message = response?.data?.error ?? fallback;
  return response
    ? new HttpError(response.status, message)
    : new Error(message);
}

/** A save refused because someone else saved the tree after it was loaded. */
export const isLayerTreeConflict = (error: unknown) =>
  error instanceof HttpError && error.status === 409;

export const getGroupTree = async (
  groupId: string,
): Promise<LayerTreeGroupNode> => {
  try {
    const response = await getApiClient().get<LayerTreeGroupNode>(
      `/groups/${groupId}/tree`,
    );
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to fetch the group's layer tree");
  }
};

export const updateGroupTree = async (
  groupId: string,
  payload: GroupTreeWrite,
): Promise<LayerTreeGroupNode> => {
  try {
    const response = await getApiClient().put<LayerTreeGroupNode>(
      `/groups/${groupId}/tree`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to save the group's layer tree");
  }
};

export const getPlacements = async (): Promise<LayerTreePlacements> => {
  try {
    const response =
      await getApiClient().get<LayerTreePlacements>("/groups/placements");
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to fetch where groups and layers are placed");
  }
};

export const getMapLayerTree = async (
  mapName: string,
): Promise<MapLayerTree> => {
  try {
    const response = await getApiClient().get<MapLayerTree>(
      `/maps/${encodeURIComponent(mapName)}/layer-tree`,
    );
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to fetch the map's layer tree");
  }
};

export const updateMapLayerTree = async (
  mapName: string,
  payload: MapLayerTreeWrite,
): Promise<MapLayerTree> => {
  try {
    const response = await getApiClient().put<MapLayerTree>(
      `/maps/${encodeURIComponent(mapName)}/layer-tree`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to save the map's layer tree");
  }
};
