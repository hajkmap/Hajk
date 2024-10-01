import { axiosInstance } from "../internal-axios-api";
import {
  Map,
  MapsApiResponse,
  ProjectionsApiResponse,
  GroupApiResponse,
} from "./types";
import { LayersApiResponse } from "../layers/types";
import { ToolsApiResponse } from "../tools/types";

export const getMaps = async (): Promise<MapsApiResponse> => {
  try {
    const response = await axiosInstance.get<MapsApiResponse>("/maps");
    if (!response.data) {
      throw new Error("No maps data found");
    }
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Error: ${error.response.status} - ${error.response.statusText}. ErrorId: ${error.response.data.errorId}`
      );
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

export const getMapByName = async (mapName: string): Promise<Map> => {
  try {
    const response = await axiosInstance.get<Map>(`/maps/${mapName}`);
    if (!response.data) {
      throw new Error("No map data found");
    }
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Error: ${error.response.status} - ${error.response.statusText}. ErrorId: ${error.response.data.errorId}`
      );
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

export const getGroupsByMapName = async (
  mapName: string
): Promise<GroupApiResponse> => {
  try {
    const response = await axiosInstance.get<GroupApiResponse>(
      `/maps/${mapName}/groups`
    );
    if (!response.data) {
      throw new Error("No groups data found");
    }
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Error: ${error.response.status} - ${error.response.statusText}. ErrorId: ${error.response.data.errorId}`
      );
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

export const getLayersByMapName = async (
  mapName: string
): Promise<LayersApiResponse[]> => {
  try {
    const response = await axiosInstance.get<LayersApiResponse[]>(
      `/maps/${mapName}/layers`
    );
    if (!response.data) {
      throw new Error("No layers data found");
    }
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Error: ${error.response.status} - ${error.response.statusText}. ErrorId: ${error.response.data.errorId}`
      );
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

export const getProjectionsByMapName = async (
  mapName: string
): Promise<ProjectionsApiResponse> => {
  try {
    const response = await axiosInstance.get<ProjectionsApiResponse>(
      `/maps/${mapName}/projections`
    );
    if (!response.data) {
      throw new Error("No projections data found");
    }
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Error: ${error.response.status} - ${error.response.statusText}. ErrorId: ${error.response.data.errorId}`
      );
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

export const getToolsByMapName = async (
  mapName: string
): Promise<ToolsApiResponse[]> => {
  try {
    const response = await axiosInstance.get<ToolsApiResponse[]>(
      `/maps/${mapName}/tools`
    );
    if (!response.data) {
      throw new Error("No tools data found");
    }
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Error: ${error.response.status} - ${error.response.statusText}. ErrorId: ${error.response.data.errorId}`
      );
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};
