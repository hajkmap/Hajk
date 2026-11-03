import { getApiClient, InternalApiError } from "../../lib/internal-api-client";
import type { Projection } from "../services/types";
import type {
  ProjectionCreateInput,
  ProjectionUpdateInput,
  ProjectionWithUsage,
} from "./types";

/**
 * Requests for the global projection catalogue (`/projections`).
 * Errors carry the backend's message, e.g. why a delete was refused.
 */
function toError(error: unknown, fallback: string): Error {
  const axiosError = error as InternalApiError;
  const message = axiosError.response?.data?.error;
  return new Error(message ? `${fallback}: ${message}` : fallback);
}

export const getProjectionsWithUsage = async (): Promise<
  ProjectionWithUsage[]
> => {
  try {
    const response = await getApiClient().get<{
      count: number;
      projections: ProjectionWithUsage[];
    }>("/projections");
    return response.data.projections;
  } catch (error) {
    throw toError(error, "Failed to fetch projections");
  }
};

/** Returns every created projection (the code and, if asked, its alias). */
export const createProjection = async (
  input: ProjectionCreateInput,
): Promise<Projection[]> => {
  try {
    const response = await getApiClient().post<{ projections: Projection[] }>(
      "/projections",
      input,
    );
    return response.data.projections;
  } catch (error) {
    throw toError(error, "Failed to create projection");
  }
};

export const updateProjection = async ({
  id,
  input,
}: {
  id: number;
  input: ProjectionUpdateInput;
}): Promise<Projection[]> => {
  try {
    const response = await getApiClient().patch<{
      projections: Projection[];
    }>(`/projections/${id}`, input);
    return response.data.projections;
  } catch (error) {
    throw toError(error, "Failed to update projection");
  }
};

/** Deletes the projection and its unused other form; returns deleted codes. */
export const deleteProjection = async (id: number): Promise<string[]> => {
  try {
    const response = await getApiClient().delete<{ deleted: string[] }>(
      `/projections/${id}`,
    );
    return response.data.deleted;
  } catch (error) {
    throw toError(error, "Failed to delete projection");
  }
};
