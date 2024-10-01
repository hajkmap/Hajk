import { AxiosResponse } from "axios";
import { Layer, LayersApiResponse } from "./types";
import { getApiClient } from "../../lib/internal-api-client";

export const getLayers = async (): Promise<Layer[]> => {
  const internalApiClient = getApiClient();
  try {
    const response: AxiosResponse<LayersApiResponse> =
      await internalApiClient.get<LayersApiResponse>("/layers");
    return response.data.layers;
  } catch (error) {
    console.error("Error fetching layers");
    throw error;
  }
};
