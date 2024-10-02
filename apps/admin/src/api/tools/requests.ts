import { Tool, ToolsApiResponse, GlobalMapsApiResponse } from "./types";
import { Map } from "../maps";
import { getApiClient, InternalApiError } from "../../lib/internal-api-client";

/**
 * This module provides API request functions to interact with the backend
 * services for fetching data related to tools and maps.
 *
 * - The `getTools` function retrieves a list of all tools.
 * - The `getMapsByToolName` function fetches all maps linked to a given tool name.
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

    if (!response.data || !response.data.mapsWithTool) {
      throw new Error("No maps data found");
    }

    return response.data.mapsWithTool;
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
