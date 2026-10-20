import {
  useQuery,
  UseQueryResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getServices,
  getServiceById,
  getDeletedServices,
  getLayersByServiceId,
  getLayerCountByServiceId,
  getMapsByServiceId,
  getGroupsByServiceId,
  createService,
  updateService,
  deleteService,
  restoreService,
  getAllProjections,
  checkServiceHealth,
} from "./requests";
import {
  Service,
  ServiceLayerCountResponse,
  ServiceUpdateInput,
  UseServiceCapabilitiesProps,
  Projection,
  SERVICE_STATUS,
} from "./types";
import { LayersApiResponse } from "../layers";
import { Map } from "../maps";
import { fetchCapabilities } from "./requests";
import { useEffect, useRef } from "react";

const HEALTH_CHECK_CONCURRENCY = 3;
const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function isStale(lastChecked?: string): boolean {
  if (!lastChecked) return true;
  return (
    Date.now() - new Date(lastChecked).getTime() >= HEALTH_CHECK_INTERVAL_MS
  );
}

async function runWithConcurrencyLimit(
  services: Service[],
  limit: number,
  fn: (service: Service) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < services.length; i += limit) {
    await Promise.allSettled(services.slice(i, i + limit).map(fn));
  }
}

// React Query hook to fetch all services
// This hook uses the `getServices` function from the services `requests` module
export const useServices = (): UseQueryResult<Service[]> => {
  return useQuery({
    queryKey: ["services"],
    queryFn: () => getServices(),
  });
};

export const useDeletedServices = (): UseQueryResult<Service[]> => {
  return useQuery({
    queryKey: ["deletedServices"],
    queryFn: getDeletedServices,
  });
};

// React Query hook to fetch a service by id
// This hook uses the `getServiceById` function from the services `requests` module
export const useServiceById = (serviceId: string): UseQueryResult<Service> => {
  return useQuery({
    queryKey: ["services", serviceId],
    queryFn: () => getServiceById(serviceId),
    enabled: Boolean(serviceId),
  });
};

// React Query hook to fetch layers by service id
// This hook uses the `getLayersByServiceId` function from the services `requests` module
export const useLayersByServiceId = (
  serviceId: string,
): UseQueryResult<LayersApiResponse> => {
  return useQuery({
    queryKey: ["services", "layers", serviceId],
    queryFn: () => getLayersByServiceId(serviceId),
    enabled: Boolean(serviceId),
  });
};

// React Query hook to fetch layer counts by service id
export const useLayerCountByServiceId = (
  serviceId: string,
): UseQueryResult<ServiceLayerCountResponse> => {
  return useQuery({
    queryKey: ["services", "layers", serviceId, "count"],
    queryFn: () => getLayerCountByServiceId(serviceId),
    enabled: Boolean(serviceId),
  });
};

// React Query hook to fetch maps by service id
// This hook uses the `getMapsByServiceId` function from the  services `requests` module
export const useMapsByServiceId = (
  serviceId: string,
): UseQueryResult<Map[]> => {
  return useQuery({
    queryKey: ["mapsByServiceId", serviceId],
    queryFn: () => getMapsByServiceId(serviceId),
    enabled: Boolean(serviceId),
  });
};

export const useGroupsByServiceId = (
  serviceId: string,
): UseQueryResult<{ id: string; name: string }[]> => {
  return useQuery({
    queryKey: ["groupsByServiceId", serviceId],
    queryFn: () => getGroupsByServiceId(serviceId),
    enabled: Boolean(serviceId),
  });
};

export const useProjections = (): UseQueryResult<Projection[]> => {
  return useQuery({
    queryKey: ["projections"],
    queryFn: () => getAllProjections(),
  });
};
// React mutation hook to create a service
// This hook uses the `createService` function from the services `requests` module
export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createService,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      if (data?.id) {
        queryClient.setQueryData<Service>(["services", data.id], data);
      }
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

// React mutation hook to update a service
// This hook uses the `updateService` function from the services `requests` module
export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceId,
      data,
    }: {
      serviceId: string;
      data: ServiceUpdateInput;
    }) => updateService(serviceId, data),
    onSuccess: (data, { serviceId }) => {
      queryClient.setQueryData(["services", serviceId], data);
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

// React mutation hook to delete a service
// This hook uses the `deleteService` function from the services `requests` module
export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => deleteService(serviceId),
    onSuccess: (_data, serviceId) => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      void queryClient.invalidateQueries({ queryKey: ["deletedServices"] });
      void queryClient.invalidateQueries({ queryKey: ["services", serviceId] });
      void queryClient.invalidateQueries({
        queryKey: ["services", "layers", serviceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["services", "layers", serviceId, "count"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["mapsByServiceId", serviceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["groupsByServiceId", serviceId],
      });
      void queryClient.invalidateQueries({ queryKey: ["layers"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useRestoreService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => restoreService(serviceId),
    onSuccess: (_data, serviceId) => {
      void queryClient.invalidateQueries({ queryKey: ["deletedServices"] });
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      void queryClient.invalidateQueries({ queryKey: ["services", serviceId] });
      void queryClient.invalidateQueries({
        queryKey: ["services", "layers", serviceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["services", "layers", serviceId, "count"],
      });
      void queryClient.invalidateQueries({ queryKey: ["layers"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useServiceCapabilities = ({
  baseUrl,
  type,
}: UseServiceCapabilitiesProps) => {
  const { data, isError, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["serviceCapabilities", baseUrl, type],
    queryFn: () => fetchCapabilities(baseUrl, type),
    enabled: Boolean(baseUrl && type),
  });

  return {
    layers: data?.layers ?? [],
    workspaces: data?.workspaces ?? [],
    styles: data?.styles ?? {},
    isError,
    isLoading,
    isFetching,
    refetch,
  };
};

export const useServicesHealthCheck = (services: Service[]) => {
  const queryClient = useQueryClient();
  const servicesRef = useRef<Service[]>(services);
  const skipNextCheck = useRef<Set<string>>(new Set());
  const runChecksRef = useRef<(() => Promise<void>) | null>(null);
  const isCheckRunning = useRef(false);

  // Keep servicesRef in sync without triggering re-runs
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  useEffect(() => {
    const updateCache = (id: string, status: SERVICE_STATUS) => {
      const lastChecked = new Date().toISOString();
      queryClient.setQueryData(["services"], (oldServices: Service[]) =>
        oldServices?.map((service: Service) =>
          service.id === id ? { ...service, status, lastChecked } : service,
        ),
      );
      if (status === SERVICE_STATUS.UNHEALTHY) {
        skipNextCheck.current.add(id);
      } else {
        skipNextCheck.current.delete(id);
      }
    };

    runChecksRef.current = async () => {
      if (isCheckRunning.current) return;
      isCheckRunning.current = true;
      try {
        const toCheck = servicesRef.current.filter((service) => {
          if (!isStale(service.lastChecked)) return false;
          if (skipNextCheck.current.has(service.id)) {
            skipNextCheck.current.delete(service.id);
            return false;
          }
          return true;
        });
        if (!toCheck.length) return;
        await runWithConcurrencyLimit(
          toCheck,
          HEALTH_CHECK_CONCURRENCY,
          (service) => checkServiceHealth(service, updateCache),
        );
      } finally {
        isCheckRunning.current = false;
      }
    };

    const interval = setInterval(
      () => void runChecksRef.current?.(),
      HEALTH_CHECK_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [queryClient]);

  // Trigger check on load and after refetch — only when stale or missing
  useEffect(() => {
    if (services.length > 0 && services.some((s) => isStale(s.lastChecked))) {
      void runChecksRef.current?.();
    }
  }, [services]);
};
