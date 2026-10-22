import {
  Group,
  GroupsApiResponse,
  GroupCreateInput,
  GroupMapsApiResponse,
  GroupUpdateInput,
} from "./types";
import { getApiClient, InternalApiError } from "../../lib/internal-api-client";
import { Map } from "../maps";
import { generateRandomName } from "../generated/names";

/**
 * API request functions for groups (GET/PATCH/DELETE /groups, the maps using them).
 * Create and update mutations return the full persisted {@link Group} entity from the API.
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
        `Failed to fetch groups. ErrorId: ${axiosError.response.data.errorId}.`,
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
        `Failed to fetch group. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to fetch group");
    }
  }
};

export const getMapsByGroupId = async (groupId: string): Promise<Map[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<GroupMapsApiResponse>(
      `/groups/${groupId}/maps`,
    );

    if (!response.data) {
      throw new Error("No maps data found");
    }

    return response.data.maps;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch maps. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to fetch maps");
    }
  }
};

export const createGroup = async (
  newGroup: GroupCreateInput,
): Promise<Group> => {
  const internalApiClient = getApiClient();
  const payload = { ...newGroup };
  if (!payload.name) {
    payload.name = generateRandomName();
  }
  try {
    const response = await internalApiClient.post<Group>("/groups", payload);
    if (!response.data) {
      throw new Error("No group data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw axiosError;
    } else {
      throw new Error("Failed to create group");
    }
  }
};

export const updateGroup = async (
  groupId: string,
  data: GroupUpdateInput,
): Promise<Group> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.patch<Group>(
      `/groups/${groupId}`,
      data,
    );
    if (!response.data) {
      throw new Error("No group data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw axiosError;
    } else {
      throw new Error("Failed to update group");
    }
  }
};

export const deleteGroup = async (groupId: string): Promise<void> => {
  const internalApiClient = getApiClient();
  try {
    await internalApiClient.delete(`/groups/${groupId}`);
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw axiosError;
    } else {
      throw new Error("Failed to delete group");
    }
  }
};

export const getDeletedGroups = async (): Promise<Group[]> => {
  const internalApiClient = getApiClient();
  try {
    const response =
      await internalApiClient.get<GroupsApiResponse>("/groups/deleted");
    if (!response.data) {
      throw new Error("No deleted groups data found");
    }
    return response.data.groups;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch deleted groups. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to fetch deleted groups.");
    }
  }
};

export const restoreGroup = async (groupId: string): Promise<Group> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.post<Group>(
      `/groups/${groupId}/restore`,
    );
    if (!response.data) {
      throw new Error("No group data returned");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to restore group. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to restore group.");
    }
  }
};
