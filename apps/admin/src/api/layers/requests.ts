import { Layer, LayersApiResponse } from "./types";

export const getLayers = async (): Promise<Layer[]> => {
  const response = await fetch("http://localhost:3002/api/v3/layers");

  if (!response.ok) {
    const data = (await response.json()) as LayersApiResponse;
    throw new Error(`Failed to fetch layers. ErrorId: ${data.errorId}`);
  }

  const data = (await response.json()) as LayersApiResponse;

  return data.layers;
};
