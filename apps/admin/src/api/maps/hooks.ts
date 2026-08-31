import {
  useQuery,
  UseQueryResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getMaps,
  getMapByName,
  getGroupsByMapName,
  getLayersByMapName,
  getMapContentByName,
  getProjectionsByMapName,
  getToolsByMapName,
  updateMapTools,
  updateMapLayers,
  updateMapGroups,
  updateMapContent,
  getMapLayerSwitcher,
  updateMapLayerSwitcher,
  createMap,
  deleteMap,
  duplicateMap,
  updateMap,
} from "./requests";
import type {
  Map as MapRecord,
  ProjectionsApiResponse,
  MapGroup,
  MapLayer,
  MapLayerPlacement,
  MapGroupPlacement,
  MapContentPlacement,
  MapLayerSwitcherPlacement,
  MapLayerSwitcherState,
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

// React Query hook to fetch map by name
// This hook uses the `getMapByName` function from the `requests` module
export const useMapByName = (mapName: string): UseQueryResult<MapRecord> => {
  return useQuery({
    queryKey: ["maps", mapName],
    queryFn: () => getMapByName(mapName),
  });
};

// React Query hook to fetch groups by map name
// This hook uses the `getGroupsByMapName` function from the `requests` module
export const useGroupsByMapName = (
  mapName: string
): UseQueryResult<MapGroup[]> => {
  return useQuery({
    queryKey: ["groupsByMap", mapName],
    queryFn: () => getGroupsByMapName(mapName),
    enabled: Boolean(mapName),
  });
};

// React Query hook to fetch layers by map name
// This hook uses the `getLayersByMapName` function from the maps `requests` module
export const useLayersByMapName = (
  mapName: string
): UseQueryResult<MapLayer[]> => {
  return useQuery({
    queryKey: ["layersByMap", mapName],
    queryFn: () => getLayersByMapName(mapName),
    enabled: Boolean(mapName),
  });
};

export const useMapContentByName = (mapName: string) => {
  return useQuery({
    queryKey: ["mapContent", mapName],
    queryFn: () => getMapContentByName(mapName),
    enabled: Boolean(mapName),
    select: (data) => ({
      layers: data.layers,
      groups: data.groups,
    }),
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

// React Query hook to fetch tools by map name
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

// React mutation to update tools for a map
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

// React mutation to update the layers placed directly on a map
export const useUpdateMapLayers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mapName,
      layers,
      replaceBackground,
      replaceForeground,
    }: {
      mapName: string;
      layers: MapLayerPlacement[];
      replaceBackground?: boolean;
      replaceForeground?: boolean;
    }) =>
      updateMapLayers(mapName, layers, {
        replaceBackground,
        replaceForeground,
      }),
    onSuccess: (_, { mapName }) => {
      void queryClient.invalidateQueries({
        queryKey: ["layersByMap", mapName],
      });
      void queryClient.invalidateQueries({
        queryKey: ["mapContent", mapName],
      });
      void queryClient.invalidateQueries({
        queryKey: ["mapLayerSwitcher", mapName],
      });
      void queryClient.invalidateQueries({ queryKey: ["maps"] });
    },
  });
};

// React mutation to update the group placements on a map
export const useUpdateMapGroups = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mapName,
      groups,
    }: {
      mapName: string;
      groups: MapGroupPlacement[];
    }) => updateMapGroups(mapName, groups),
    onSuccess: (_, { mapName }) => {
      void queryClient.invalidateQueries({
        queryKey: ["groupsByMap", mapName],
      });
      void queryClient.invalidateQueries({
        queryKey: ["mapContent", mapName],
      });
    },
  });
};

export const useUpdateMapContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mapName,
      content,
    }: {
      mapName: string;
      content: MapContentPlacement;
    }) => updateMapContent(mapName, content),
    onSuccess: (_, { mapName }) => {
      void queryClient.invalidateQueries({
        queryKey: ["mapContent", mapName],
      });
      void queryClient.invalidateQueries({
        queryKey: ["layersByMap", mapName],
      });
      void queryClient.invalidateQueries({
        queryKey: ["groupsByMap", mapName],
      });
      void queryClient.invalidateQueries({ queryKey: ["maps"] });
    },
  });
};

export const useMapLayerSwitcher = (
  mapName: string,
): UseQueryResult<MapLayerSwitcherState> => {
  return useQuery({
    queryKey: ["mapLayerSwitcher", mapName],
    queryFn: () => getMapLayerSwitcher(mapName),
    enabled: Boolean(mapName),
  });
};

export const useUpdateMapLayerSwitcher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mapName,
      content,
    }: {
      mapName: string;
      content: MapLayerSwitcherPlacement;
    }) => updateMapLayerSwitcher(mapName, content),
    onSuccess: (_, { mapName }) => {
      void queryClient.invalidateQueries({
        queryKey: ["mapLayerSwitcher", mapName],
      });
      void queryClient.invalidateQueries({
        queryKey: ["mapContent", mapName],
      });
      void queryClient.invalidateQueries({
        queryKey: ["layersByMap", mapName],
      });
      void queryClient.invalidateQueries({
        queryKey: ["groupsByMap", mapName],
      });
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      void queryClient.invalidateQueries({ queryKey: ["maps"] });
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

// React mutation to delete a map
// This hook uses the `deleteMap` function from the `requests` module
export const useDeleteMap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mapName: string) => deleteMap(mapName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["maps"] });
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
