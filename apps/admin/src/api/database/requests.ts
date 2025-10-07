import { getApiClient, InternalApiError } from "../../lib/internal-api-client";
import {
  DatabaseStatus,
  DatabaseExportRequest,
  DatabaseImportRequest,
  DatabaseExportResponse,
  DatabaseImportResponse,
  DatabaseToolsResponse,
} from "./types";

export const getDatabaseStatus = async (): Promise<DatabaseStatus> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<{ status: DatabaseStatus }>(
      "/database/status"
    );
    if (!response.data) {
      throw new Error("No database status data found");
    }
    return response.data.status;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch database status. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to fetch database status");
    }
  }
};

export const checkDatabaseTools = async (): Promise<DatabaseToolsResponse> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<DatabaseToolsResponse>(
      "/database/tools"
    );
    if (!response.data) {
      throw new Error("No database tools data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to check database tools. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to check database tools");
    }
  }
};

export const exportDatabase = async (
  exportOptions: DatabaseExportRequest
): Promise<DatabaseExportResponse> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.post<DatabaseExportResponse>(
      "/database/export",
      exportOptions
    );
    if (!response.data) {
      throw new Error("No export response data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to export database. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to export database");
    }
  }
};

export const importDatabase = async (
  importData: DatabaseImportRequest
): Promise<DatabaseImportResponse> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.post<DatabaseImportResponse>(
      "/database/import",
      importData
    );
    if (!response.data) {
      throw new Error("No import response data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      const errorCode = axiosError.response.data?.error ?? "GENERIC";
      throw new Error(errorCode);
    } else {
      throw new Error("GENERIC");
    }
  }
};
