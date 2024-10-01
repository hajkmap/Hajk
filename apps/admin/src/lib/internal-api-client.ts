import axios, { AxiosInstance } from "axios";
import useAppStateStore from "../store/use-app-state-store";

const createApiClient = (): AxiosInstance => {
  const { apiBaseUrl } = useAppStateStore.getState();

  if (!apiBaseUrl) {
    throw new Error("API Base URL is not set.");
  }

  const apiClient = axios.create({
    baseURL: apiBaseUrl,
  });

  return apiClient;
};

let apiClientInstance: AxiosInstance | null = null;

export const getApiClient = (): AxiosInstance => {
  if (!apiClientInstance) {
    apiClientInstance = createApiClient();
  }
  return apiClientInstance;
};
