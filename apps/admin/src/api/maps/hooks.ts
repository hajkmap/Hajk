import {
  QueryClient,
  useQuery,
  UseQueryResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getMaps,
  getMapByName,
  getLayersByMapName,
  getProjectionsByMapName,
  getToolsByMapName,
  updateMapTools,
  updateMapLayers,
  createMap,
  deleteMap,
  getDeletedMaps,
  restoreMap,
  duplicateMap,
  updateMap,
} from "./requests";
import type {
  Map as MapRecord,
  ProjectionsApiResponse,
  MapLayer,
  MapLayerPlacement,
  MapMutation,
  ToolOnMap,
} from "./types";

// React Query hook to fetch all maps
// This hook uses the `getMaps` function from the `requests` module
export const useMaps = (): UseQueryResult<MapRecord[]> => {
  return useQuery({
    queryKey: ["maps"],
    queryFn: getMaps,
  });
};

export const useDeletedMaps = (): UseQueryResult<MapRecord[]> => {
  return useQuery({
    queryKey: ["deletedMaps"],
    queryFn: getDeletedMaps,
  });
};

// React Query hook to fetch map by name
// This hook uses the `getMapByName` function from the `requests` module
export const useMapByName = (mapName: string): UseQueryResult<MapRecord> => {
  return useQuery({
    queryKey: ["maps", mapName],
    queryFn: () => getMapByName(mapName),
  });
};

// React Query hook to fetch the layers placed directly on a map: its
// background layers and the search and editing layers it uses
export const useLayersByMapName = (
  mapName: string
): UseQueryResult<MapLayer[]> => {
  return useQuery({
    queryKey: ["layersByMap", mapName],
    queryFn: () => getLayersByMapName(mapName),
    enabled: Boolean(mapName),
  });
};

// React Query hook to fetch projection by map name
// This hook uses the `getProjectionsByMapName` function from the maps `requests` module
export const useProjectionByMapName = (
  mapName: string
): UseQueryResult<ProjectionsApiResponse> => {
  return useQuery({
    queryKey: ["projectionsByMap", mapName],
    queryFn: () => getProjectionsByMapName(mapName),
  });
};

// React Query hook to fetch the tool instances placed on a map
// This hook uses the `getToolsByMapName` function from the maps `requests` module
export const useToolsByMapName = (
  mapName: string
): UseQueryResult<ToolOnMap[]> => {
  return useQuery({
    queryKey: ["toolsByMap", mapName],
    queryFn: () => getToolsByMapName(mapName),
    enabled: Boolean(mapName),
  });
};

// React mutation to update which tool instances a map uses and where they are placed
export const useUpdateMapTools = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mapName,
      tools,
    }: {
      mapName: string;
      tools: {
        toolId: number;
        index: number;
        target: string | null;
        active?: boolean;
        options?: Record<string, string | number>;
      }[];
    }) => updateMapTools(mapName, tools),
    onMutate: async ({ mapName, tools }) => {
      await queryClient.cancelQueries({ queryKey: ["toolsByMap", mapName] });
      const previous = queryClient.getQueryData<ToolOnMap[]>([
        "toolsByMap",
        mapName,
      ]);
      if (previous) {
        const previousById = new Map(
          previous.map((tool) => [tool.toolId, tool]),
        );
        queryClient.setQueryData<ToolOnMap[]>(
          ["toolsByMap", mapName],
          tools.map((entry) => {
            const existing = previousById.get(entry.toolId);
            return {
              mapName,
              toolId: entry.toolId,
              active: entry.active !== false,
              index: entry.index,
              target: entry.target as ToolOnMap["target"],
              options: entry.options ?? existing?.options,
              tool: existing?.tool ?? {
                id: entry.toolId,
                type: "",
                options: {},
              },
            };
          }),
        );
      }
      return { previous };
    },
    onError: (_error, { mapName }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["toolsByMap", mapName], context.previous);
      }
    },
    onSettled: async (_data, _error, { mapName }) => {
      await queryClient.refetchQueries({ queryKey: ["toolsByMap", mapName] });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
  });
};

// React mutation to update the search and editing layers a map uses
export const useUpdateMapLayers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mapName,
      layers,
    }: {
      mapName: string;
      layers: MapLayerPlacement[];
    }) => updateMapLayers(mapName, layers),
    onSuccess: (_, { mapName }) => {
      void queryClient.invalidateQueries({
        queryKey: ["layersByMap", mapName],
      });
      void queryClient.invalidateQueries({ queryKey: ["maps"] });
      void queryClient.invalidateQueries({ queryKey: ["layerUsage"] });
      void queryClient.invalidateQueries({ queryKey: ["layersUsageSummary"] });
    },
  });
};

// React mutation to create a new map
// This hook uses the `createMap` function from the `requests` module
export const useCreateMap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMap,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["maps"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

// React mutation to update a map
// This hook uses the `updateMap` function from the `requests` module
export const useUpdateMap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mapName,
      data,
    }: {
      mapName: string;
      data: Partial<MapMutation>;
    }) => updateMap(mapName, data),
    onSuccess: (_, { mapName }) => {
      void queryClient.invalidateQueries({ queryKey: ["maps"] });
      void queryClient.invalidateQueries({ queryKey: ["maps", mapName] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

// A deleted map is left out of what is counted per map until it is restored,
// so deleting and restoring both change the usage of tools, layers, groups
// and services.
const invalidateMapUsage = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: ["tools"] });
  void queryClient.invalidateQueries({ queryKey: ["mapsByTool"] });
  void queryClient.invalidateQueries({ queryKey: ["layersUsageSummary"] });
  void queryClient.invalidateQueries({ queryKey: ["layerUsage"] });
  void queryClient.invalidateQueries({ queryKey: ["mapsByGroupId"] });
  void queryClient.invalidateQueries({ queryKey: ["mapsByServiceId"] });
  void queryClient.invalidateQueries({ queryKey: ["layerTree"] });
};

// React mutation to delete a map
// This hook uses the `deleteMap` function from the `requests` module
export const useDeleteMap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mapName: string) => deleteMap(mapName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["maps"] });
      void queryClient.invalidateQueries({ queryKey: ["deletedMaps"] });
      void queryClient.invalidateQueries({ queryKey: ["deletedThemes"] });
      invalidateMapUsage(queryClient);
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useRestoreMap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mapName: string) => restoreMap(mapName),
    onSuccess: (_data, mapName) => {
      void queryClient.invalidateQueries({ queryKey: ["deletedMaps"] });
      void queryClient.invalidateQueries({ queryKey: ["deletedThemes"] });
      void queryClient.invalidateQueries({ queryKey: ["maps"] });
      void queryClient.invalidateQueries({ queryKey: ["maps", mapName] });
      void queryClient.invalidateQueries({ queryKey: ["themes", mapName] });
      invalidateMapUsage(queryClient);
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

// React mutation to duplicate a map
export const useDuplicateMap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: duplicateMap,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["maps"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
