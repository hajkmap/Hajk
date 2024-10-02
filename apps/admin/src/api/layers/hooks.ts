import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Layer, LayersApiResponse, LayerTypesApiResponse } from "./types";
import {
  getLayers,
  getLayerById,
  getLayerTypes,
  getLayersByType,
} from "./requests";

// A React Query hook to fetch all layers
// This hook uses the `getLayers` function from the layers `requests` module
export const useLayers = (): UseQueryResult<Layer[]> => {
  return useQuery({
    queryKey: ["layers"],
    queryFn: getLayers,
  });
};

// A React Query hook to fetch a layer by its ID
// This hook uses the `getLayerById` function from the layers `requests` module
export const useLayerById = (layerId: string): UseQueryResult<Layer> => {
  return useQuery({
    queryKey: ["layer", layerId],
    queryFn: () => getLayerById(layerId),
  });
};

// A React Query hook to fetch all layers by their type
// This hook uses the `getLayersByType` function from the layers `requests` module
export const useLayersByType = (
  type: string
): UseQueryResult<LayersApiResponse[]> => {
  return useQuery({
    queryKey: ["layersByType", type],
    queryFn: () => getLayersByType(type),
  });
};

// A React Query hook to fetch all layer types
// This hook uses the `getLayerTypes` function from the layers `requests` module
export const useLayerTypes = (): UseQueryResult<LayerTypesApiResponse[]> => {
  return useQuery({
    queryKey: ["layerTypes"],
    queryFn: getLayerTypes,
  });
};
