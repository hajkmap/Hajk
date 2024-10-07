import axios, { AxiosError, AxiosInstance } from "axios";
import useAppStateStore from "../store/use-app-state-store";

export type InternalApiError = AxiosError<{ errorId: string }>;

const createApiClient = (): AxiosInstance => {
  const { apiBaseUrl } = useAppStateStore.getState();

  if (!apiBaseUrl) {
    throw new Error("API Base URL is not set.");
  }

  const apiClient = axios.create({
    baseURL: apiBaseUrl,
  });

  apiClient.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      const apiError = error as InternalApiError;

      if (apiError.response) {
        switch (apiError.response.status) {
          case 400:
            console.error(
              `Bad request, errorId: ${apiError.response.data.errorId}`
            );
            break;
          case 401:
            console.error("Unauthorized");
            break;
          case 403:
            console.error(
              `Forbidden, errorId: ${apiError.response.data.errorId}`
            );
            break;
          case 404:
            console.error("Page not found");
            break;
          case 500:
            console.error(
              `Internal server error, errorId: ${apiError.response.data.errorId}`
            );
            break;
          default:
            console.error("An unexpected error occurred");
        }
      } else if (apiError.request) {
        console.error("Network error");
      } else {
        console.error("An unexpected error occurred");
      }

      return Promise.reject(apiError);
    }
  );

  return apiClient;
};

let apiClientInstance: AxiosInstance | null = null;

export const getApiClient = (): AxiosInstance => {
  if (!apiClientInstance) {
    apiClientInstance = createApiClient();
  }
  return apiClientInstance;
};