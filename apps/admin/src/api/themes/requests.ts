import { getApiClient, InternalApiError } from "../../lib/internal-api-client";
import type {
  Theme,
  ThemesApiResponse,
  ThemeCreateInput,
  ThemeUpdateInput,
} from "./types";

const base = (mapName: string) =>
  `/maps/${encodeURIComponent(mapName)}/themes`;

export const getThemes = async (mapName: string): Promise<Theme[]> => {
  const client = getApiClient();
  try {
    const response = await client.get<ThemesApiResponse>(base(mapName));
    return response.data.themes;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to fetch themes. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to fetch themes."
    );
  }
};

export const getTheme = async (mapName: string, id: number): Promise<Theme> => {
  const client = getApiClient();
  try {
    const response = await client.get<Theme>(`${base(mapName)}/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to fetch theme. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to fetch theme."
    );
  }
};

export const createTheme = async (
  mapName: string,
  data: ThemeCreateInput
): Promise<Theme> => {
  const client = getApiClient();
  try {
    const response = await client.post<Theme>(base(mapName), data);
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw axiosError;
    }
    throw new Error("Failed to create theme.");
  }
};

export const updateTheme = async (
  mapName: string,
  id: number,
  data: ThemeUpdateInput
): Promise<Theme> => {
  const client = getApiClient();
  try {
    const response = await client.put<Theme>(`${base(mapName)}/${id}`, data);
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw axiosError;
    }
    throw new Error("Failed to update theme.");
  }
};

export const deleteTheme = async (
  mapName: string,
  id: number
): Promise<void> => {
  const client = getApiClient();
  try {
    await client.delete(`${base(mapName)}/${id}`);
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to delete theme. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to delete theme."
    );
  }
};

export const getDeletedThemes = async (): Promise<Theme[]> => {
  const client = getApiClient();
  try {
    const response = await client.get<ThemesApiResponse>("/themes/deleted");
    return response.data.themes;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to fetch deleted themes. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to fetch deleted themes."
    );
  }
};

export const restoreTheme = async (id: number): Promise<Theme> => {
  const client = getApiClient();
  try {
    const response = await client.post<Theme>(`/themes/${id}/restore`);
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to restore theme. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to restore theme."
    );
  }
};
