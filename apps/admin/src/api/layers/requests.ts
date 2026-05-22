import {
  Layer,
  LayersApiResponse,
  LayerTypesApiResponse,
  LayerCreateInput,
  LayerUpdateInput,
  RoleOnLayerCreateAndUpdateInput,
  RoleOnLayer,
} from "./types";
import type { LayerUsage, LayerUsageApiResponse } from "./types";
import { Service } from "../services";
import { getApiClient, InternalApiError } from "../../lib/internal-api-client";
import { generateRandomName } from "../generated/names";
import useAppStateStore from "../../store/use-app-state-store";
import { mergeWithConfigDefaults } from "../../lib/merge-with-config-defaults";
import { applyServiceDefaultsToLayerCreate } from "./apply-service-to-layer-create";
import { filterDefaultsForLayerKind } from "./build-layer-payload";
import type { LayerKind } from "./types";

/**
 * This module provides API request functions to interact with the backend
 * services for fetching data related to layers.
 *
 * - The `getLayers` function retrieves a list of all layers.
 * - The `getLayerById` function fetches details of a specific layer by its ID.
 * - The `getLayerTypes` function retrieves all available layer types.
 * - The `getLayersByType` function fetches layers by their type.
 * - The `createLayer` function creates a new layer.
 * - The `updateLayer` function updates a layer.
 * - The `deleteLayer` function deletes a layer.
 * - The `getServicesByLayerId` function fetches a service associated with a layer by its ID.
 *
 * These functions utilize a custom Axios instance and throw appropriate error messages for failures.
 *
 * All functions return a Promise with the expected data format or throw an error in case of failure.
 */

// Fetch layers
export const getLayers = async (): Promise<Layer[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<LayersApiResponse>("/layers");

    if (!response.data) {
      throw new Error("No layers data found");
    }

    return response.data.layers;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch layers. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error(`Failed to fetch layers`);
    }
  }
};

// Fetch a single layer by its ID
export const getLayerById = async (layerId: string): Promise<Layer> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<Layer>(`/layers/${layerId}`);
    if (!response.data) {
      throw new Error("No layer data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch layer. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error(`Failed to fetch layer`);
    }
  }
};

// Fetch layers by their type
export const getLayersByType = async (type: string): Promise<Layer[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<LayersApiResponse>(
      `/layers/types/${type}`,
    );
    if (!response.data) {
      throw new Error("No layers found for this type");
    }
    return response.data.layers;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch layers by type. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error(`Failed to fetch layers by type`);
    }
  }
};

// Fetch all available layer types
export const getLayerTypes = async (): Promise<string[]> => {
  const internalApiClient = getApiClient();
  try {
    const response =
      await internalApiClient.get<LayerTypesApiResponse>("/layers/types");

    if (!response.data) {
      throw new Error("No layer types found");
    }
    return response.data.layerTypes;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch layer types. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error(`Failed to fetch layer types`);
    }
  }
};

export const getServiceByLayerId = async (
  layerId: string,
): Promise<Service> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<Service>(
      `/layers/${layerId}/service`,
    );
    if (!response.data) {
      throw new Error("No service data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch service. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error(`Failed to fetch service`);
    }
  }
};

export const createLayer = async (
  newLayer: LayerCreateInput,
): Promise<Layer> => {
  const internalApiClient = getApiClient();
  const { layersDefault } = useAppStateStore.getState();

  const payload: LayerCreateInput = { ...newLayer };
  if (!payload.name) {
    payload.name = generateRandomName();
  }

  const layerKind: LayerKind = payload.layerKind ?? "display";
  const kindDefaults = filterDefaultsForLayerKind(
    layerKind,
    layersDefault ?? {},
  );

  const merged = mergeWithConfigDefaults(
    { ...kindDefaults },
    { ...payload } as Record<string, unknown>,
    {
      deepMergeKeys:
        layerKind === "search"
          ? ["searchSettings", "metadata", "options"]
          : layerKind === "display"
            ? ["metadata", "infoClickSettings", "options"]
            : ["options"],
    },
  );

  const { getServiceById } = await import("../services/requests");
  const service = await getServiceById(payload.serviceId);
  applyServiceDefaultsToLayerCreate(merged, service, layerKind);

  const layerData = {
    ...merged,
    layerKind,
    serviceId: payload.serviceId,
  } as Record<string, unknown>;
  try {
    const response = await internalApiClient.post<Layer>("/layers", layerData);
    if (!response.data) {
      throw new Error("No layer data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to create layer. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error(`Failed to create layer`);
    }
  }
};

export const updateLayer = async (
  layerId: string,
  data: Partial<LayerUpdateInput>,
): Promise<LayerUpdateInput> => {
  const internalApiClient = getApiClient();
  const layerKind: LayerKind = data.layerKind ?? "display";
  const body = { ...data, layerKind };
  try {
    const response = await internalApiClient.patch<Layer>(
      `/layers/${layerId}`,
      body,
    );
    if (!response.data) {
      throw new Error("No layer data found");
    }
    return response.data as LayerUpdateInput;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to update service. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to update service");
    }
  }
};

export const deleteLayer = async (layerId: string): Promise<void> => {
  const internalApiClient = getApiClient();
  try {
    await internalApiClient.delete(`/layers/${layerId}`);
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to delete layer. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to delete layer");
    }
  }
};

export const getRoleOnLayerByLayerId = async (layerId: string) => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<RoleOnLayer>(
      `/layers/role/${layerId}`,
    );
    if (!response.data) {
      throw new Error("No data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch layer role. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error(`Failed to fetch layer role`);
    }
  }
};

export const getLayerUsage = async (layerId: string): Promise<LayerUsage[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<LayerUsageApiResponse>(
      `/layers/${layerId}/usage`,
    );
    if (!response.data) {
      throw new Error("No usage data found");
    }
    return response.data.usage;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch layer usage. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to fetch layer usage");
    }
  }
};

export const createAndUpdateRoleOnLayer = async (
  newLayerRole: RoleOnLayerCreateAndUpdateInput,
): Promise<RoleOnLayerCreateAndUpdateInput> => {
  const internalApiClient = getApiClient();
  try {
    const response =
      await internalApiClient.post<RoleOnLayerCreateAndUpdateInput>(
        "/layers/role",
        newLayerRole,
      );
    if (!response.data) {
      throw new Error("No data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to create layer role. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error(`Failed to create layer role`);
    }
  }
};
