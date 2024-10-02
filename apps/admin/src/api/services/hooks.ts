import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  getServices,
  getServiceById,
  getLayersByServiceId,
  getMapsByServiceId,
} from "./requests";
import { Service } from "./types";
import { Layer } from "../layers";
import { Map } from "../maps";

// React Query hook to fetch all services
// This hook uses the `getServices` function from the services `requests` module
export const useServices = (): UseQueryResult<Service[]> => {
  return useQuery({
    queryKey: ["services"],
    queryFn: () => getServices(),
  });
};

// React Query hook to fetch a service by id
// This hook uses the `getServiceById` function from the services `requests` module
export const useServiceById = (serviceId: string): UseQueryResult<Service> => {
  return useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => getServiceById(serviceId),
  });
};

// React Query hook to fetch layers by service id
// This hook uses the `getLayersByServiceId` function from the services `requests` module
export const useLayersByServiceId = (
  serviceId: string
): UseQueryResult<Layer[]> => {
  return useQuery({
    queryKey: ["layersByServiceId", serviceId],
    queryFn: () => getLayersByServiceId(serviceId),
  });
};

// React Query hook to fetch maps by service id
// This hook uses the `getMapsByServiceId` function from the  services `requests` module
export const useMapsByServiceId = (
  serviceId: string
): UseQueryResult<Map[]> => {
  return useQuery({
    queryKey: ["mapsByServiceId", serviceId],
    queryFn: () => getMapsByServiceId(serviceId),
  });
};
