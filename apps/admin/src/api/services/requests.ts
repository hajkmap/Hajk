import axios from "axios";
import { getApiClient, InternalApiError } from "../../lib/internal-api-client";
import {
  Service,
  ServicesApiResponse,
  ServiceCreateInput,
  ServiceUpdateInput,
  ServiceCapabilities,
} from "./types";
import { LayersApiResponse } from "../layers";
import { Map } from "../maps";
import { GlobalMapsApiResponse } from "../tools";
import { generateRandomName } from "../generated/names";
import useAppStateStore from "../../store/use-app-state-store";

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
 * - The parseLayersFromXML function parses layer names from an XML string.
 * - The fetchCapabilities function fetches getCapabilities for a given URL.
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
): Promise<LayersApiResponse> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<LayersApiResponse>(
      `/services/${serviceId}/layers`
    );
    if (!response.data) {
      throw new Error("No layers data found");
    }
    return response.data;
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

export const getAllProjections = async (): Promise<string[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<{ projections: string[] }>(
      "/services/projections"
    );
    if (!response.data) {
      throw new Error("No projections data found");
    }
    return response.data.projections;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch projections. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to fetch projections");
    }
  }
};

export const createService = async (
  newService: ServiceCreateInput
): Promise<ServiceCreateInput> => {
  const internalApiClient = getApiClient();
  const { servicesDefault } = useAppStateStore.getState();

  if (!newService.name) {
    newService.name = generateRandomName();
  }

  const serviceData: ServiceCreateInput = {
    ...servicesDefault,
    ...newService,
  };
  try {
    const response = await internalApiClient.post<ServiceCreateInput>(
      "/services",
      serviceData
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
  data: Partial<ServiceUpdateInput>
): Promise<ServiceUpdateInput> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.patch<ServiceUpdateInput>(
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

const parseCapabilitiesFromXML = (xmlString: string): ServiceCapabilities => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  const layerNames: string[] = [];
  const layerElements = xmlDoc.getElementsByTagName("Name");

  const layers = xmlDoc.getElementsByTagName("Layer");
  const workspaces: Set<string> = new Set<string>();
  const styles: Record<string, string[]> = {};

  for (const layer of layers) {
    const name = layer.getElementsByTagName("Name")[0]?.textContent;
    if (name?.includes(":")) {
      const workspace = name.split(":")[0];
      workspaces.add(workspace);
    }
    const styleElements = layer.getElementsByTagName("Style");
    const styleNames: string[] = [];

    for (const styleElement of styleElements) {
      const styleName =
        styleElement.getElementsByTagName("Name")[0]?.textContent;
      if (styleName) {
        styleNames.push(styleName);
      }
    }
    if (name) {
      styles[name] = styleNames;
    }
  }
  for (const layerElement of layerElements) {
    const layerName = layerElement.textContent;
    if (layerName) {
      layerNames.push(layerName);
    }
  }

  return {
    layers: layerNames,
    workspaces: Array.from(workspaces),
    styles,
  };
};

export const fetchCapabilities = async (
  url: string
): Promise<ServiceCapabilities> => {
  const response = await axios.get(url, { responseType: "text" });
  const xmlData: string = response.data as string;
  const layers = parseCapabilitiesFromXML(xmlData);
  return { ...layers };
};
