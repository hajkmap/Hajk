import {
  Tool,
  ToolsApiResponse,
  ToolsByMapNameApiResponse,
  MapsByToolName,
} from "./types";
import { getApiClient, InternalApiError } from "../../lib/internal-api-client";

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

export const getMapsByToolName = async (
  toolName: string
): Promise<MapsByToolName[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<ToolsByMapNameApiResponse>(
      `/tools/${toolName}/maps`
    );
    if (!response.data) {
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
