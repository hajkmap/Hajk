import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  getMaps,
  getMapByName,
  getGroupsByMapName,
  getLayersByMapName,
  getProjectionsByMapName,
  getToolsByMapName,
} from "./requests";
import { Map, ProjectionsApiResponse, GroupApiResponse } from "./types";
import { LayersApiResponse } from "../layers/types";
import { ToolsApiResponse } from "../tools/types";

// React Query hook to fetch maps
export const useMaps = (): UseQueryResult<string[]> => {
  return useQuery({
    queryKey: ["maps"],
    queryFn: getMaps,
  });
};

// React Query hook to fetch map by name
export const useMapByName = (mapName: string): UseQueryResult<Map> => {
  return useQuery({
    queryKey: ["map", mapName],
    queryFn: () => getMapByName(mapName),
  });
};

// React Query hook to fetch groups by map name
export const useGroupsByMapName = (
  mapId: string
): UseQueryResult<GroupApiResponse> => {
  return useQuery({
    queryKey: ["mapGroups", mapId],
    queryFn: () => getGroupsByMapName(mapId),
  });
};

// React Query hook to fetch layers by map name
export const useLayersByMapName = (
  mapName: string
): UseQueryResult<LayersApiResponse> => {
  return useQuery({
    queryKey: ["mapLayers", mapName],
    queryFn: () => getLayersByMapName(mapName),
  });
};

// React Query hook to fetch projection by map name
export const useProjectionByMapName = (
  mapName: string
): UseQueryResult<ProjectionsApiResponse> => {
  return useQuery({
    queryKey: ["mapProjection", mapName],
    queryFn: () => getProjectionsByMapName(mapName),
  });
};

// React Query hook to fetch tools by map name
export const useToolsByMapName = (
  mapName: string
): UseQueryResult<ToolsApiResponse[]> => {
  return useQuery({
    queryKey: ["mapTools", mapName],
    queryFn: () => getToolsByMapName(mapName),
  });
};
