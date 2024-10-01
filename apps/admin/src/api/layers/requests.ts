import { axiosInstance } from "../internal-axios-api";
import { Layer, LayersApiResponse, LayerTypesApiResponse } from "./types";

// Fetch all layers
export const getLayers = async (): Promise<LayersApiResponse> => {
  try {
    const response = await axiosInstance.get<LayersApiResponse>("/layers");

    if (!response.data) {
      throw new Error("No layers data found");
    }

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Error: ${error.response.status} - ${error.response.statusText}. ErrorId: ${error.response.data?.errorId}`
      );
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

// Fetch a single layer by its ID
export const getLayerById = async (id: string): Promise<Layer> => {
  try {
    const response = await axiosInstance.get<Layer>(`/layers/${id}`);
    if (!response.data) {
      throw new Error("No layer data found");
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

// Fetch layers by their type
export const getLayersByType = async (
  type: string
): Promise<LayersApiResponse[]> => {
  try {
    const response = await axiosInstance.get<LayersApiResponse[]>(
      `/layers/types/${type}`
    );
    if (!response.data) {
      throw new Error("No layers found for this type");
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

// Fetch all available layer types
export const getLayerTypes = async (): Promise<LayerTypesApiResponse[]> => {
  try {
    const response = await axiosInstance.get<LayerTypesApiResponse[]>(
      "/layers/types"
    );

    if (!response.data) {
      throw new Error("No layer types found");
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
