import {
  Tool,
  ToolType,
  ToolsApiResponse,
  ToolTypesApiResponse,
  GlobalMapsApiResponse,
  ToolCreateInput,
  ToolUpdateInput,
} from "./types";
import { Map } from "../maps";
import { getApiClient, InternalApiError } from "../../lib/internal-api-client";

/**
 * This module provides API request functions to interact with the backend
 * services for fetching data related to tools and maps.
 *
 * "Tool" here means a tool instance: a configured instance of a ToolType
 * (backend model ToolInstance). One instance can be used on many maps, and
 * several instances of the same type can exist.
 *
 * - The `getTools` function retrieves all tool instances.
 * - The `getMapsByToolName` function fetches all maps using a tool of the given type.
 *
 * These functions utilize a custom Axios instance and throw appropriate error messages for failures.
 *
 * All functions return a Promise with the expected data format or throw an error in case of failure.
 */

export const getTools = async (): Promise<Tool[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<ToolsApiResponse>("/tools");
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

export const getMapsByToolName = async (toolName: string): Promise<Map[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<GlobalMapsApiResponse>(
      `/tools/${toolName}/maps`
    );

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

/** Fetches the plugin types that tool instances can be created from. */
export const getToolTypes = async (): Promise<ToolType[]> => {
  const internalApiClient = getApiClient();
  try {
    const response =
      await internalApiClient.get<ToolTypesApiResponse>("/tools/types");
    if (!response.data) {
      throw new Error("No tool types data found");
    }
    return response.data.toolTypes;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch tool types. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to fetch tool types.`);
    }
  }
};

/** Creates a tool instance of the given type. */
export const createTool = async (data: ToolCreateInput): Promise<Tool> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.post<Tool>("/tools", data);
    if (!response.data) {
      throw new Error("No tool data returned");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to create tool. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to create tool.`);
    }
  }
};

/** Soft-deletes a tool instance. It disappears from every map using it. */
export const deleteTool = async (id: string): Promise<void> => {
  const internalApiClient = getApiClient();
  try {
    await internalApiClient.delete(`/tools/${id}`);
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to delete tool. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to delete tool.`);
    }
  }
};

/** Updates a tool instance. Changes apply to every map using it. */
export const updateTool = async (
  id: string,
  data: ToolUpdateInput
): Promise<Tool> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.patch<Tool>(`/tools/${id}`, data);
    if (!response.data) {
      throw new Error("No tool data returned");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to update tool. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to update tool.`);
    }
  }
};
