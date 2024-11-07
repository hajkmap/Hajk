import { getApiClient, InternalApiError } from "../../lib/internal-api-client";
import {
  Service,
  ServicesApiResponse,
  ServiceCreateFormData,
  ServiceUpdateFormData,
} from "./types";
import { Layer, LayersApiResponse } from "../layers";
import { Map } from "../maps";
import { GlobalMapsApiResponse } from "../tools";

/**
 * This module provides API request functions to interact with the backend
 * services for fetching data related to services.
 *
 * - The `getServices` function retrieves a list of all services.
 * - The `getServiceById` function fetches details of a specific service by its ID.
 * - The `getLayersByServiceId` function retrieves all layers linked to a given service ID.
 * - The `getMapsByServiceId` function fetches all maps linked to a given service ID.
 * - The ´createService` function creates a new service.
 * - The `updateService` function updates a service.
 * - The `deleteService` function deletes a service.
 *
 * These functions utilize a custom Axios instance and throw appropriate error messages for failures.
 *
 * All functions return a Promise with the expected data format or throw an error in case of failure.
 */

export const getServices = async (): Promise<Service[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<ServicesApiResponse>(
      "/services"
    );
    if (!response.data) {
      throw new Error("No services data found");
    }
    return response.data.services;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch services. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to fetch services");
    }
  }
};

export const getServiceById = async (serviceId: string): Promise<Service> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<Service>(
      `/services/${serviceId}`
    );
    if (!response.data) {
      throw new Error("No service data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch service. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to fetch service");
    }
  }
};

export const getLayersByServiceId = async (
  serviceId: string
): Promise<Layer[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<LayersApiResponse>(
      `/services/${serviceId}/layers`
    );
    if (!response.data) {
      throw new Error("No layers data found");
    }
    return response.data.layers;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch layers. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to fetch layers");
    }
  }
};

export const getMapsByServiceId = async (serviceId: string): Promise<Map[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<GlobalMapsApiResponse>(
      `/services/${serviceId}/maps`
    );

    if (!response.data) {
      throw new Error("No maps data found");
    }

    return response.data.maps;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch maps. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to fetch maps");
    }
  }
};

export const createService = async (
  newService: ServiceCreateFormData
): Promise<ServiceCreateFormData> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.post<ServiceCreateFormData>(
      "/services",
      newService
    );
    if (!response.data) {
      throw new Error("No service data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to create service. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to create service");
    }
  }
};

export const updateService = async (
  serviceId: string,
  data: Partial<ServiceUpdateFormData>
): Promise<ServiceUpdateFormData> => {
  const internalApiClient = getApiClient();
  try {
    // just to test the loading spinner in the UI
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const response = await internalApiClient.patch<ServiceUpdateFormData>(
      `/services/${serviceId}`,
      data
    );
    if (!response.data) {
      throw new Error("No service data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to update service. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to update service");
    }
  }
};

export const deleteService = async (serviceId: string): Promise<void> => {
  const internalApiClient = getApiClient();
  try {
    await internalApiClient.delete(`/services/${serviceId}`);
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to delete service. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to delete service");
    }
  }
};
