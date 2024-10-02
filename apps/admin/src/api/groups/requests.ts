import { Group, GroupsApiResponse } from "./types";
import { Layer, LayersApiResponse } from "../layers";
import { getApiClient, InternalApiError } from "../../lib/internal-api-client";
import { GlobalMapsApiResponse } from "../tools";
import { Map } from "../maps";

/**
 * This module provides API request functions to interact with the backend
 * services for fetching data related to groups, layers, and maps.
 *
 * - The `getGroups` function retrieves a list of all groups.
 * - The `getGroupById` function fetches details of a specific group by its ID.
 * - The `getLayersByGroupId` function retrieves all layers associated with a given group ID.
 * - The `getMapsByGroupId` function fetches all maps linked to a specific group ID.
 *
 * These functions utilize a custom Axios instance and throw appropriate error messages for failures.
 *
 * All functions return a Promise with the expected data format or throw an error in case of failure.
 */

export const getGroups = async (): Promise<Group[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<GroupsApiResponse>("/groups");
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
      throw new Error("Failed to fetch groups");
    }
  }
};

export const getGroupById = async (groupId: string): Promise<Group> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<Group>(`/groups/${groupId}`);
    if (!response.data) {
      throw new Error("No group data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch group. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to fetch group");
    }
  }
};

export const getLayersByGroupId = async (groupId: string): Promise<Layer[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<LayersApiResponse>(
      `/groups/${groupId}/layers`
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
      throw new Error("Failed to fetch layers");
    }
  }
};
export const getMapsByGroupId = async (groupId: string): Promise<Map[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<GlobalMapsApiResponse>(
      `/groups/${groupId}/maps`
    );

    if (!response.data || !response.data.maps) {
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
      throw new Error("Failed to fetch maps");
    }
  }
};
