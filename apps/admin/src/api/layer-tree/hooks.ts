import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGroupTree,
  getMapLayerTree,
  getPlacements,
  updateGroupTree,
  updateMapLayerTree,
} from "./requests";
import { GroupTreeWrite, MapLayerTreeWrite } from "./types";

// Groups are linked into other groups and maps, so a save can change any
// layer tree that uses them. Of the ["groups"] queries only the list is
// refreshed (a group save can create groups): refetching a single group would
// reset the unsaved fields on its settings page.

/** Shared by both saves, so an editor can tell when a save is running. */
export const LAYER_TREE_SAVE_KEY = ["layerTree", "save"];

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
      queryClient.setQueryData(["layerTree", "map", mapName], tree);
      void queryClient.invalidateQueries({ queryKey: ["layerTree"] });
    },
  });
};

/** Which groups and maps every group and layer is placed in. */
export const useLayerTreePlacements = () =>
  useQuery({
    queryKey: ["layerTree", "placements"],
    queryFn: getPlacements,
  });
