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
// refreshed (both saves can create groups): refetching a single group would
// reset the unsaved fields on its settings page.

/** Shared by both saves, so an editor can tell when a save is running. */
export const LAYER_TREE_SAVE_KEY = ["layerTree", "save"];

// The versions this tab saved itself, by tree, so an editor can keep its
// undo steps across its own saves and start afresh on anyone else's.
const savedHere = new Map<string, number>();

/** Whether this tab saved that version of the tree itself. */
export const isSavedHere = (
  mode: "group" | "map",
  ownerId: string,
  version: number,
) => savedHere.get(`${mode}:${ownerId}`) === version;

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
      // Before the tree shows, so the editor knows the version is its own.
      savedHere.set(`group:${groupId}`, tree.version);
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
      // Before the tree shows, so the editor knows the version is its own.
      savedHere.set(`map:${mapName}`, tree.version);
      queryClient.setQueryData(["layerTree", "map", mapName], tree);
      void queryClient.invalidateQueries({ queryKey: ["layerTree"] });
      void queryClient.invalidateQueries({ queryKey: ["groups"], exact: true });
    },
  });
};

/** The tree as an editor last loaded it, without loading it if none has. */
export const useLoadedLayerTree = (mode: "group" | "map", ownerId: string) =>
  useQuery<{ version: number }>({
    queryKey: ["layerTree", mode, ownerId],
    queryFn: () =>
      mode === "map" ? getMapLayerTree(ownerId) : getGroupTree(ownerId),
    enabled: false,
  });

/** Loads a tree again, as when a save was refused because it had changed. */
export const useReloadLayerTree = () => {
  const queryClient = useQueryClient();
  return (mode: "group" | "map", ownerId: string) =>
    queryClient.invalidateQueries({ queryKey: ["layerTree", mode, ownerId] });
};

/** Which groups and maps every group and layer is placed in. */
export const useLayerTreePlacements = () =>
  useQuery({
    queryKey: ["layerTree", "placements"],
    queryFn: getPlacements,
  });
