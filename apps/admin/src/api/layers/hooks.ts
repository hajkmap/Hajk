import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Layer, LayersApiResponse, LayerTypesApiResponse } from "./types";
import {
  getLayers,
  getLayerById,
  getLayerTypes,
  getLayersByType,
} from "./requests";

export const useLayers = (): UseQueryResult<LayersApiResponse> => {
  return useQuery({
    queryKey: ["layers"],
    queryFn: getLayers,
  });
};

export const useLayerById = (id: string): UseQueryResult<Layer> => {
  return useQuery({
    queryKey: ["layer", id],
    queryFn: () => getLayerById(id),
  });
};

export const useLayersByType = (
  type: string
): UseQueryResult<LayersApiResponse[]> => {
  return useQuery({
    queryKey: ["layersByType", type],
    queryFn: () => getLayersByType(type),
  });
};

export const useLayerTypes = (): UseQueryResult<LayerTypesApiResponse[]> => {
  return useQuery({
    queryKey: ["layerTypes"],
    queryFn: getLayerTypes,
  });
};
