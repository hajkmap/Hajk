import {
  Map,
  MapsApiResponse,
  ProjectionsApiResponse,
  GroupApiResponse,
} from "./types";
import { LayersApiResponse } from "../layers/types";
import { ToolsApiResponse } from "../tools/types";
import { getApiClient, InternalApiError } from "../../lib/internal-api-client";

export const getMaps = async (): Promise<string[]> => {
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

export const getMapByName = async (mapName: string): Promise<Map> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<Map>(`/maps/${mapName}`);
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
): Promise<GroupApiResponse> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<GroupApiResponse>(
      `/maps/${mapName}/groups`
    );
    if (!response.data) {
      throw new Error("No groups data found");
    }
    return response.data;
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
): Promise<LayersApiResponse[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<LayersApiResponse[]>(
      `/maps/${mapName}/layers`
    );
    if (!response.data) {
      throw new Error("No layers data found");
    }
    return response.data;
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
): Promise<ToolsApiResponse[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<ToolsApiResponse[]>(
      `/maps/${mapName}/tools`
    );
    if (!response.data) {
      throw new Error("No tools data found");
    }
    return response.data;
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
