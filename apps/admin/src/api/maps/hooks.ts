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
  getProjectionsByMapName,
  getToolsByMapName,
  createMap,
} from "./requests";
import { Map, ProjectionsApiResponse, GroupApiResponse } from "./types";
import { LayersApiResponse } from "../layers/types";
import { ToolsApiResponse } from "../tools/types";

// React Query hook to fetch all maps
// This hook uses the `getMaps` function from the `requests` module
export const useMaps = (): UseQueryResult<string[]> => {
  return useQuery({
    queryKey: ["maps"],
    queryFn: getMaps,
  });
};

// React Query hook to fetch map by name
// This hook uses the `getMapByName` function from the `requests` module
export const useMapByName = (mapName: string): UseQueryResult<Map> => {
  return useQuery({
    queryKey: ["map", mapName],
    queryFn: () => getMapByName(mapName),
  });
};

// React Query hook to fetch groups by map name
// This hook uses the `getGroupsByMapName` function from the `requests` module
export const useGroupsByMapName = (
  mapId: string
): UseQueryResult<GroupApiResponse> => {
  return useQuery({
    queryKey: ["groupsByMap", mapId],
    queryFn: () => getGroupsByMapName(mapId),
  });
};

// React Query hook to fetch layers by map name
// This hook uses the `getLayersByMapName` function from the maps `requests` module
export const useLayersByMapName = (
  mapName: string
): UseQueryResult<LayersApiResponse> => {
  return useQuery({
    queryKey: ["layersByMap", mapName],
    queryFn: () => getLayersByMapName(mapName),
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
): UseQueryResult<ToolsApiResponse[]> => {
  return useQuery({
    queryKey: ["toolsByMap", mapName],
    queryFn: () => getToolsByMapName(mapName),
  });
};

// React mutation to create a new map
// This hook uses the `createMap` function from the `requests` module
export const useCreateMap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maps"] });
    },
  });
};
