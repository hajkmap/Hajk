import {
  type QueryClient,
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
import { MapSummary } from "../maps";
import { fetchCapabilities } from "./requests";
import { useCallback, useEffect, useRef, useState } from "react";

const HEALTH_CHECK_CONCURRENCY = 3;
const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;
/** A service that hasn't answered by now is shown as slow, while its answer is still awaited. */
const CAPABILITIES_SLOW_AFTER_MS = 10 * 1000;

/** Whether a service is due for a check: one found down waits twice as long. */
function isDue(service: Service): boolean {
  if (!service.lastChecked) return true;
  const wait =
    service.status === SERVICE_STATUS.UNHEALTHY
      ? 2 * HEALTH_CHECK_INTERVAL_MS
      : HEALTH_CHECK_INTERVAL_MS;
  return Date.now() - new Date(service.lastChecked).getTime() >= wait;
}

/** Puts a finished check's status and time in the cached service list. */
function cacheCheckResult(
  queryClient: QueryClient,
  id: string,
  status: SERVICE_STATUS,
) {
  const lastChecked = new Date().toISOString();
  queryClient.setQueryData(["services"], (oldServices: Service[] | undefined) =>
    oldServices?.map((service) =>
      service.id === id ? { ...service, status, lastChecked } : service,
    ),
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
): UseQueryResult<MapSummary[]> => {
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
      void queryClient.invalidateQueries({ queryKey: ["serviceByLayerId"] });
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
      void queryClient.invalidateQueries({ queryKey: ["deletedLayers"] });
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
    // The query's signal cancels the request once no page awaits the answer.
    queryFn: ({ signal }) => fetchCapabilities(baseUrl, type, signal),
    enabled: Boolean(baseUrl && type),
  });

  // The answer is awaited for as long as it takes. `isSlow` tells when that
  // has gone on for a while, so the page can say so.
  const isAwaited = isFetching && data === undefined;
  const [waitedLong, setWaitedLong] = useState(false);
  useEffect(() => {
    if (!isAwaited) return;
    const timer = window.setTimeout(
      () => setWaitedLong(true),
      CAPABILITIES_SLOW_AFTER_MS,
    );
    return () => {
      window.clearTimeout(timer);
      setWaitedLong(false);
    };
  }, [isAwaited, baseUrl, type]);

  return {
    layers: data?.layers ?? [],
    workspaces: data?.workspaces ?? [],
    styles: data?.styles ?? {},
    isError,
    isLoading,
    isFetching,
    isSlow: isAwaited && waitedLong,
    refetch,
  };
};

export const useServicesHealthCheck = (services: Service[]) => {
  const queryClient = useQueryClient();
  const servicesRef = useRef<Service[]>(services);
  const runChecksRef = useRef<(() => Promise<void>) | null>(null);
  const isCheckRunning = useRef(false);

  // Keep servicesRef in sync without triggering re-runs
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  useEffect(() => {
    const updateCache = (id: string, status: SERVICE_STATUS) =>
      cacheCheckResult(queryClient, id, status);

    runChecksRef.current = async () => {
      if (isCheckRunning.current) return;
      isCheckRunning.current = true;
      try {
        const toCheck = servicesRef.current.filter(isDue);
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

  // Trigger check on load and after refetch — only when one is due
  useEffect(() => {
    if (services.some(isDue)) {
      void runChecksRef.current?.();
    }
  }, [services]);
};

/**
 * Checks a service now, outside the schedule. `checking` holds the ids of
 * the services being checked.
 */
export const useRecheckService = () => {
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState<ReadonlySet<string>>(new Set());
  const recheck = useCallback(
    async (service: Service) => {
      setChecking((ids) => new Set(ids).add(service.id));
      try {
        await checkServiceHealth(service, (id, status) =>
          cacheCheckResult(queryClient, id, status),
        );
      } finally {
        setChecking((ids) => {
          const next = new Set(ids);
          next.delete(service.id);
          return next;
        });
      }
    },
    [queryClient],
  );
  return { recheck, checking };
};
