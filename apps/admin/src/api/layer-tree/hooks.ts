import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGroupTree,
  getMapLayerTree,
  getPlacements,
  updateGroupTree,
  updateMapLayerTree,
} from "./requests";
import {
  GroupTreeWrite,
  LayerTreeGroupNode,
  MapLayerTree,
  MapLayerTreeWrite,
} from "./types";

// Groups are linked into other groups and maps, so a save can change any
// layer tree that uses them. Of the ["groups"] queries only the list is
// refreshed (both saves can create groups): refetching a single group would
// reset the unsaved fields on its settings page.

/** Shared by both saves, so an editor can tell when a save is running. */
export const LAYER_TREE_SAVE_KEY = ["layerTree", "save"];

// When this tab last saved each tree, so an editor can keep its undo steps
// across its own saves and start afresh on anyone else's.
const savedHere = new Map<string, string | null>();

/** Whether this tab made the tree's save at that time. */
export const isSavedHere = (
  mode: "group" | "map",
  ownerId: string,
  savedAt: string | null,
) => savedAt !== null && savedHere.get(`${mode}:${ownerId}`) === savedAt;

export const useGroupTree = (groupId: string) =>
  useQuery({
    queryKey: ["layerTree", "group", groupId],
    queryFn: () => getGroupTree(groupId),
    enabled: Boolean(groupId),
  });

export const useUpdateGroupTree = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: LAYER_TREE_SAVE_KEY,
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: string;
      payload: GroupTreeWrite;
    }) => updateGroupTree(groupId, payload),
    onSuccess: (tree, { groupId }) => {
      // Before the tree shows, so the editor knows the save is its own.
      savedHere.set(`group:${groupId}`, tree.savedAt);
      queryClient.setQueryData(["layerTree", "group", groupId], tree);
      void queryClient.invalidateQueries({ queryKey: ["layerTree"] });
      void queryClient.invalidateQueries({ queryKey: ["groups"], exact: true });
    },
  });
};

export const useMapLayerTree = (mapName: string) =>
  useQuery({
    queryKey: ["layerTree", "map", mapName],
    queryFn: () => getMapLayerTree(mapName),
    enabled: Boolean(mapName),
  });

export const useUpdateMapLayerTree = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: LAYER_TREE_SAVE_KEY,
    mutationFn: ({
      mapName,
      payload,
    }: {
      mapName: string;
      payload: MapLayerTreeWrite;
    }) => updateMapLayerTree(mapName, payload),
    onSuccess: (tree, { mapName }) => {
      // Before the tree shows, so the editor knows the save is its own.
      savedHere.set(`map:${mapName}`, tree.savedAt);
      queryClient.setQueryData(["layerTree", "map", mapName], tree);
      void queryClient.invalidateQueries({ queryKey: ["layerTree"] });
      void queryClient.invalidateQueries({ queryKey: ["groups"], exact: true });
    },
  });
};

/**
 * The tree as saved at `savedAt`, beside the one an editor has loaded, to
 * show what a save made elsewhere changed without taking it in.
 */
export const useLatestLayerTree = (
  type: "group" | "map",
  id: string,
  savedAt: string | null,
  enabled: boolean,
) =>
  useQuery({
    queryKey: ["layerTree", type, id, "latest", savedAt],
    queryFn: (): Promise<LayerTreeGroupNode | MapLayerTree> =>
      type === "group" ? getGroupTree(id) : getMapLayerTree(id),
    enabled,
  });

/** Which groups and maps every group and layer is placed in. */
export const useLayerTreePlacements = () =>
  useQuery({
    queryKey: ["layerTree", "placements"],
    queryFn: getPlacements,
  });
