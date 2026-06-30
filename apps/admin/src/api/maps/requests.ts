import type {
  Map as MapRecord,
  MapsApiResponse,
  ProjectionsApiResponse,
  MapGroup,
  MapGroupsApiResponse,
  MapLayer,
  MapLayersApiResponse,
  MapLayerPlacement,
  MapGroupPlacement,
  MapMutation,
  ToolOnMap,
} from "./types";
import {
  buildCreateMapPayload,
  type MapCreateInput,
} from "./map-create-types";
import { getApiClient, InternalApiError } from "../../lib/internal-api-client";

/**
 * This module provides API request functions to interact with the backend
 * services for fetching data related to maps.
 *
 * - The `getMaps` function retrieves a list of all maps.
 * - The `getMapByName` function fetches details of a specific map by its name.
 * - The `getLayersByMapName` function retrieves all layers linked to a given map name.
 * - The `getToolsByMapName` function fetches all tools linked to a given map name.
 * - The `getGroupsByMapName` function fetches all groups linked to a given map name.
 * - The `getProjectionsByMapName` function fetches the projections linked to a given map name.
 * - The `createMap` function creates a new map.
 * - The `updateMap` function updates a map.
 * - The `deleteMap` function deletes a map.
 *
 * These functions utilize a custom Axios instance and throw appropriate error messages for failures.
 *
 * All functions return a Promise with the expected data format or throw an error in case of failure.
 *
 */
export const getMaps = async (): Promise<MapRecord[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<MapsApiResponse>("/maps");
    if (!response.data) {
      throw new Error("No maps data found");
    }
    return response.data.maps;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch maps. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to fetch maps.`);
    }
  }
};

export const getMapByName = async (mapName: string): Promise<MapRecord> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<MapRecord>(`/maps/${mapName}`);
    if (!response.data) {
      throw new Error("No map data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch map. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to fetch map.`);
    }
  }
};

export const getGroupsByMapName = async (
  mapName: string
): Promise<MapGroup[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<MapGroupsApiResponse>(
      `/maps/${mapName}/groups`
    );
    if (!response.data) {
      throw new Error("No groups data found");
    }
    return response.data.groups;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch groups. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to fetch groups.`);
    }
  }
};

export const getLayersByMapName = async (
  mapName: string
): Promise<MapLayer[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<MapLayersApiResponse>(
      `/maps/${mapName}/layers`
    );
    if (!response.data) {
      throw new Error("No layers data found");
    }
    return response.data.layers;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch layers. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to fetch layers.`);
    }
  }
};

export const getProjectionsByMapName = async (
  mapName: string
): Promise<ProjectionsApiResponse> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<ProjectionsApiResponse>(
      `/maps/${mapName}/projections`
    );
    if (!response.data) {
      throw new Error("No projections data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch projections. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to fetch projections.`);
    }
  }
};

export const getToolsByMapName = async (
  mapName: string
): Promise<ToolOnMap[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<{
      count: number;
      tools: ToolOnMap[];
    }>(`/maps/${mapName}/tools`);
    if (!response.data) {
      throw new Error("No tools data found");
    }
    return response.data.tools;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch tools. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to fetch tools.`);
    }
  }
};

export const updateMapTools = async (
  mapName: string,
  tools: { toolId: number; index: number; target: string | null }[]
): Promise<void> => {
  const internalApiClient = getApiClient();
  try {
    await internalApiClient.put(`/maps/${mapName}/tools`, { tools });
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to update map tools. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to update map tools.`);
    }
  }
};

/**
 * Replaces layers placed directly on a map (`PUT /maps/:mapName/layers`).
 * Alias: `setMapLayers`.
 */
export const updateMapLayers = async (
  mapName: string,
  layers: MapLayerPlacement[]
): Promise<void> => {
  const internalApiClient = getApiClient();
  try {
    await internalApiClient.put(`/maps/${mapName}/layers`, { layers });
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to update map layers. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to update map layers.`);
    }
  }
};

/** @alias updateMapLayers */
export const setMapLayers = updateMapLayers;

export const updateMapGroups = async (
  mapName: string,
  groups: MapGroupPlacement[]
): Promise<void> => {
  const internalApiClient = getApiClient();
  try {
    await internalApiClient.put(`/maps/${mapName}/groups`, { groups });
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to update map groups. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to update map groups.`);
    }
  }
};

/**
 * Creates a map via backend `POST /maps`.
 * On 4xx/5xx, rejects with the Axios error so callers can read `response.data`.
 */
export const createMap = async (newMap: MapCreateInput): Promise<MapRecord> => {
  const internalApiClient = getApiClient();
  const payload = buildCreateMapPayload(newMap);
  try {
    const response = await internalApiClient.post<MapRecord>("/maps", payload);
    if (!response.data) {
      throw new Error("No map data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw axiosError;
    }
    throw new Error("Failed to create map");
  }
};

export const updateMap = async (
  mapName: string,
  data: Partial<MapMutation>
): Promise<void> => {
  const internalApiClient = getApiClient();
  try {
    await internalApiClient.patch(`/maps/${mapName}`, data);
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to update map. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to update map.`);
    }
  }
};

export const deleteMap = async (mapName: string): Promise<void> => {
  const internalApiClient = getApiClient();
  try {
    await internalApiClient.delete(`/maps/${mapName}`);
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to delete map. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to delete map.`);
    }
  }
};

/**
 * Duplicates a map via backend `POST /maps/:mapName/duplicate`.
 * On 4xx/5xx, rejects with the Axios error so callers can read `response.data`.
 */
export const duplicateMap = async ({
  sourceMapName,
  name,
  includeLayers = true,
  includeGroups = true,
  includeTools = true,
}: {
  sourceMapName: string;
  name: string;
  includeLayers?: boolean;
  includeGroups?: boolean;
  includeTools?: boolean;
}): Promise<MapRecord> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.post<MapRecord>(
      `/maps/${encodeURIComponent(sourceMapName)}/duplicate`,
      {
        name: name.trim(),
        includeLayers,
        includeGroups,
        includeTools,
      }
    );
    if (!response.data) {
      throw new Error("No map data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw axiosError;
    }
    throw new Error("Failed to duplicate map");
  }
};
