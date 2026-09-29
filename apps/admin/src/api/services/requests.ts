import { getApiClient, InternalApiError } from "../../lib/internal-api-client";
import {
  Service,
  ServicesApiResponse,
  ServiceCreateInput,
  ServiceUpdateInput,
  ServiceCapabilities,
  ServiceLayerCountResponse,
  SERVICE_STATUS,
  SERVICE_TYPE,
  Projection,
} from "./types";
import { LayersApiResponse } from "../layers";
import { Map } from "../maps";
import { GlobalMapsApiResponse } from "../tools";
import { mergeWithConfigDefaults } from "../../lib/merge-with-config-defaults";
import useAppStateStore from "../../store/use-app-state-store";

/**
 * This module provides API request functions to interact with the backend
 * services for fetching data related to services.
 *
 * - The `getServices` function retrieves a list of all services.
 * - The `getServiceById` function fetches details of a specific service by its ID.
 * - The `getLayersByServiceId` function retrieves summary fields for layers linked to a service.
 * - The `getLayerCountByServiceId` function returns layer counts without loading layer rows.
 * - The `getMapsByServiceId` function fetches all maps linked to a given service ID.
 * - The ´createService` function creates a new service.
 * - The `updateService` function updates a service.
 * - The `deleteService` function deletes a service.
 * - The parseCapabilitiesFromXML function parses layer names and metadata from a capabilities XML string.
 * - The fetchCapabilities function fetches GetCapabilities directly from the external service.
 *
 * These functions utilize a custom Axios instance and throw appropriate error messages for failures.
 *
 * All functions return a Promise with the expected data format or throw an error in case of failure.
 */

export const getServices = async (): Promise<Service[]> => {
  const internalApiClient = getApiClient();
  try {
    const response =
      await internalApiClient.get<ServicesApiResponse>("/services");
    if (!response.data) {
      throw new Error("No services data found");
    }
    // Map backend DB fields to frontend fields
    type RawService = Service & {
      healthStatus?: string | null;
      healthCheckedAt?: string | null;
    };
    return (response.data.services as RawService[]).map(
      ({ healthStatus, healthCheckedAt, ...service }) => ({
        ...service,
        status:
          healthStatus === "HEALTHY"
            ? SERVICE_STATUS.HEALTHY
            : healthStatus === "UNHEALTHY"
              ? SERVICE_STATUS.UNHEALTHY
              : undefined,
        lastChecked: healthCheckedAt ?? undefined,
      }),
    );
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch services. ErrorId: ${axiosError.response.data.errorId}.`,
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
      `/services/${serviceId}`,
    );
    if (!response.data) {
      throw new Error("No service data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch service. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to fetch service");
    }
  }
};

export const getLayersByServiceId = async (
  serviceId: string,
): Promise<LayersApiResponse> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<LayersApiResponse>(
      `/services/${serviceId}/layers`,
    );
    if (!response.data) {
      throw new Error("No layers data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch layers. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to fetch layers");
    }
  }
};

export const getLayerCountByServiceId = async (
  serviceId: string,
): Promise<ServiceLayerCountResponse> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<ServiceLayerCountResponse>(
      `/services/${serviceId}/layers/count`,
    );
    if (!response.data) {
      throw new Error("No layer count data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch layer count. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to fetch layer count");
    }
  }
};

export const getMapsByServiceId = async (serviceId: string): Promise<Map[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<GlobalMapsApiResponse>(
      `/services/${serviceId}/maps`,
    );

    if (!response.data) {
      throw new Error("No maps data found");
    }

    return response.data.maps;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch maps. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to fetch maps");
    }
  }
};

export const getGroupsByServiceId = async (
  serviceId: string,
): Promise<{ id: string; name: string }[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<{
      count: number;
      groups: { id: string; name: string }[];
    }>(`/services/${serviceId}/groups`);
    if (!response.data) {
      throw new Error("No groups data found");
    }
    return response.data.groups;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch groups. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to fetch groups");
    }
  }
};

export const getAllProjections = async (): Promise<Projection[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<{
      count: number;
      projections: Projection[];
    }>("/services/projections");
    if (!response.data) {
      throw new Error("No projections data found");
    }
    return response.data.projections;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to fetch projections. ErrorId: ${axiosError.response.data.errorId}.`,
      );
    } else {
      throw new Error("Failed to fetch projections");
    }
  }
};

/** Aligns with backend default when config has no projection (see services.service.ts). */
const CREATE_SERVICE_PROJECTION_FALLBACK = "EPSG:3006";
const CAPABILITIES_SERVICE_TYPE_BY_SERVICE_TYPE: Partial<
  Record<string, string>
> = {
  WMS: "WMS",
  WMTS: "WMS",
  WFS: "WFS",
  WFST: "WFS",
  VECTOR: "WFS",
};

function getCapabilitiesType(type?: string): string | null {
  if (!type) return null;
  return CAPABILITIES_SERVICE_TYPE_BY_SERVICE_TYPE[type] ?? null;
}

/**
 * Builds the JSON body for `POST /services` (admin API base includes `/api/v3`).
 * Merges `servicesDefault` from config.json with user input (`undefined` does not
 * wipe defaults; `projection` is deep-merged). Ensures `projection.code` when still
 * missing (backend Zod requires projection).
 */
function buildCreateServicePayload(
  input: ServiceCreateInput,
): Record<string, unknown> {
  const { servicesDefault, defaultCoordinates } = useAppStateStore.getState();

  const merged = mergeWithConfigDefaults(
    { ...(servicesDefault ?? {}) },
    { ...input },
    { deepMergeKeys: ["projection"] },
  );

  const projection = merged.projection as { code?: string } | undefined;
  const code = projection?.code?.trim();
  if (!code) {
    const first = defaultCoordinates?.[0];
    merged.projection = {
      code:
        typeof first === "string" && first.trim()
          ? first.trim()
          : CREATE_SERVICE_PROJECTION_FALLBACK,
    };
  }

  return merged;
}

async function enrichCreateServicePayloadWithCapabilities(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  const serviceType =
    typeof payload.type === "string" ? getCapabilitiesType(payload.type) : null;

  if (!url || !serviceType) {
    return payload;
  }

  try {
    const capabilities = await fetchCapabilities(url, serviceType);
    const currentMetadata =
      typeof payload.metadata === "object" && payload.metadata !== null
        ? (payload.metadata as Record<string, unknown>)
        : {};
    const autoDescription = capabilities.metadata?.description?.trim();
    const autoTitle = capabilities.metadata?.title?.trim();
    const autoOrganization = capabilities.metadata?.organization?.trim();

    if (!currentMetadata.description && autoDescription) {
      currentMetadata.description = autoDescription;
    } else if (!currentMetadata.description && autoTitle) {
      // Fall back to title when abstract/description is missing in capabilities.
      currentMetadata.description = autoTitle;
    }
    if (!currentMetadata.title && autoTitle) {
      currentMetadata.title = autoTitle;
    }
    if (!currentMetadata.owner && autoOrganization) {
      // Metadata model stores organization as owner.
      currentMetadata.owner = autoOrganization;
    }

    if (Object.keys(currentMetadata).length > 0) {
      payload.metadata = currentMetadata;
      console.info("Service metadata auto-populated from GetCapabilities", {
        type: payload.type,
        hasTitle: Boolean(currentMetadata.title),
        hasDescription: Boolean(currentMetadata.description),
        hasOwner: Boolean(currentMetadata.owner),
      });
    }

    return payload;
  } catch (error) {
    console.warn(
      "GetCapabilities request failed during service creation",
      error,
    );
    return payload;
  }
}

/**
 * Creates a service via backend `POST /services`.
 * On 4xx/5xx, rejects with the Axios error so callers can read `response.data` (e.g. Zod details).
 */
export const createService = async (
  newService: ServiceCreateInput,
): Promise<Service> => {
  const internalApiClient = getApiClient();
  let serviceData = buildCreateServicePayload(newService);
  serviceData = await enrichCreateServicePayloadWithCapabilities(serviceData);

  try {
    const response = await internalApiClient.post<Service>(
      "/services",
      serviceData,
    );
    if (!response.data) {
      throw new Error("No service data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw axiosError;
    } else {
      throw new Error("Failed to create service");
    }
  }
};

export const updateService = async (
  serviceId: string,
  data: Partial<ServiceUpdateInput>,
): Promise<ServiceUpdateInput> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.patch<ServiceUpdateInput>(
      `/services/${serviceId}`,
      data,
    );
    if (!response.data) {
      throw new Error("No service data found");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to update service. ErrorId: ${axiosError.response.data.errorId}.`,
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
      throw axiosError;
    } else {
      throw new Error("Failed to delete service");
    }
  }
};

const parseCapabilitiesFromXML = (
  xmlString: string,
  type = "WMS",
): ServiceCapabilities => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  const layerNames: string[] = [];
  const workspaces: Set<string> = new Set<string>();
  const styles: Record<string, { name: string; legendUrl?: string }[]> = {};

  // WFS capabilities use FeatureType elements; WMS/WMTS use Layer elements.
  const isWFS = type === "WFS";
  const elements = isWFS
    ? xmlDoc.getElementsByTagName("FeatureType")
    : xmlDoc.getElementsByTagName("Layer");

  for (const element of elements) {
    // Scope to direct child Name to avoid picking up names from nested layers or styles.
    const nameEl = Array.from(element.children).find(
      (c) => c.localName === "Name",
    );
    const name = nameEl?.textContent?.trim();

    if (!name) continue;

    layerNames.push(name);

    if (name.includes(":")) {
      workspaces.add(name.split(":")[0]);
    }

    if (!isWFS) {
      const styleElements = Array.from(element.children).filter(
        (c) => c.localName === "Style",
      );
      const styleData: { name: string; legendUrl?: string }[] = [];

      for (const styleElement of styleElements) {
        const styleNameEl = Array.from(styleElement.children).find(
          (c) => c.localName === "Name",
        );
        const styleName = styleNameEl?.textContent?.trim();
        const legendUrl = styleElement
          .getElementsByTagName("LegendURL")[0]
          ?.getElementsByTagName("OnlineResource")[0]
          ?.getAttribute("xlink:href");
        if (styleName) {
          styleData.push({
            name: styleName,
            legendUrl: legendUrl ?? undefined,
          });
        }
      }
      styles[name] = styleData;
    }
  }

  const getNodeTextByLocalNames = (
    root: Document | Element,
    localNames: string[],
  ): string | undefined => {
    const allNodes =
      "getElementsByTagName" in root ? root.getElementsByTagName("*") : [];

    for (const node of allNodes) {
      const localName = node.localName?.toLowerCase();
      if (!localName) continue;
      if (localNames.some((n) => n.toLowerCase() === localName)) {
        const text = node.textContent?.trim();
        if (text) return text;
      }
    }

    return undefined;
  };

  // Covers both OWS and plain WMS capability variants.
  const title = getNodeTextByLocalNames(xmlDoc, ["Title"]);
  const description = getNodeTextByLocalNames(xmlDoc, ["Abstract"]);
  const organization = getNodeTextByLocalNames(xmlDoc, [
    "ProviderName",
    "ContactOrganization",
    "ContactOrganizationName",
  ]);

  return {
    layers: layerNames,
    workspaces: Array.from(workspaces),
    styles,
    metadata: {
      title,
      description,
      organization,
    },
  };
};

export const fetchCapabilities = async (
  baseUrl: string,
  type = "WMS",
): Promise<ServiceCapabilities> => {
  const response = await fetch(
    `${baseUrl}?SERVICE=${type}&REQUEST=GetCapabilities`,
    { signal: AbortSignal.timeout(10000) },
  );

  if (!response.ok) {
    throw new Error(
      `Capabilities request failed with status ${response.status}`,
    );
  }

  const xmlData = await response.text();
  return parseCapabilitiesFromXML(xmlData, type);
};

export const updateServiceHealthStatus = async (
  id: string,
  healthStatus: "HEALTHY" | "UNHEALTHY",
): Promise<void> => {
  const internalApiClient = getApiClient();
  try {
    await internalApiClient.patch(`/services/${id}/health-status`, {
      healthStatus,
    });
  } catch (error) {
    console.warn(`Failed to persist health status for service ${id}:`, error);
  }
};

export const checkServiceHealth = async (
  service: Service,
  updateCache: (id: string, status: SERVICE_STATUS) => void,
) => {
  try {
    const healthUrl = `${service.url}?service=${service.type === SERVICE_TYPE.WFST ? "WFS" : service.type}&request=GetCapabilities`;
    // Bypass the browser cache: a cached GetCapabilities answer would report
    // the service as up even when it can't be reached.
    const response = await fetch(healthUrl, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const status = response.ok
      ? SERVICE_STATUS.HEALTHY
      : SERVICE_STATUS.UNHEALTHY;
    updateCache(service.id, status);
    void updateServiceHealthStatus(
      service.id,
      response.ok ? "HEALTHY" : "UNHEALTHY",
    );
  } catch {
    updateCache(service.id, SERVICE_STATUS.UNHEALTHY);
    void updateServiceHealthStatus(service.id, "UNHEALTHY");
  }
};
