import { getApiClient } from "../../lib/internal-api-client";
import {
  FmeConnectionResult,
  FmeProductRef,
  FmeProductResult,
} from "./types";

/**
 * Health checks against FME-server, via the backend's /fmeproxy (which adds
 * the credentials from the backend's .env). Neither function throws: every
 * outcome is returned as a status.
 */

const FME_REST = "/fmeproxy/fmerest/v3";

// Accept every status code so expected failures (404 when FME isn't
// configured) don't reach the client's error interceptor and log noise.
const requestConfig = { timeout: 5000, validateStatus: () => true };

const isHajkError = (data: unknown) =>
  typeof data === "object" && data !== null && "errorId" in data;

// Body of the backend proxy's onError handler (fme.server.proxy.ts).
const isProxyFailure = (data: unknown) =>
  typeof data === "string" && data.startsWith("Request failed while proxying");

// FME's repository listing: { items: [...], totalCount, ... }. A 200 with
// anything else means FME_SERVER_BASE_URL points at something that isn't FME.
const isRepositoryList = (data: unknown) =>
  typeof data === "object" &&
  data !== null &&
  Array.isArray((data as { items?: unknown }).items);

export const checkFmeServerConnection =
  async (): Promise<FmeConnectionResult> => {
    try {
      // repositories requires authentication, so bad credentials show up here.
      const { status, data } = await getApiClient().get<unknown>(
        `${FME_REST}/repositories`,
        { ...requestConfig, params: { limit: 1 } },
      );
      if (status >= 200 && status < 300) {
        return isRepositoryList(data)
          ? { status: "ok" }
          : { status: "unexpected", httpStatus: status };
      }
      if (status === 404 && isHajkError(data)) {
        return { status: "notConfigured" };
      }
      if (status === 401 || status === 403) {
        return { status: "unauthorized", httpStatus: status };
      }
      if (isProxyFailure(data) || status === 502 || status === 504) {
        return { status: "unreachable", httpStatus: status };
      }
      return { status: "unexpected", httpStatus: status };
    } catch {
      // Timeout or network error.
      return { status: "unreachable" };
    }
  };

// Same URL the client builds when fetching a product's parameters.
export const checkFmeProduct = async ({
  repository,
  workspace,
  geoAttribute,
}: FmeProductRef): Promise<FmeProductResult> => {
  const url = `${FME_REST}/repositories/${encodeURIComponent(repository)}/items/${encodeURIComponent(workspace)}/parameters`;
  try {
    const { status, data } = await getApiClient().get<unknown>(
      url,
      requestConfig,
    );
    if (status === 404) return { status: "notFound" };
    if (status < 200 || status >= 300) {
      return { status: "error", httpStatus: status };
    }
    // FME answers with the workspace's parameter list.
    if (!Array.isArray(data)) return { status: "error" };

    // Mirrors FmeServerModel.noGeomAttributeSupplied in the client.
    const usesGeometry = geoAttribute !== "" && geoAttribute !== "none";
    if (usesGeometry) {
      const names = data.map((p) => (p as { name?: unknown }).name);
      if (!names.includes(geoAttribute)) {
        return { status: "geoAttributeMissing" };
      }
    }
    return { status: "ok" };
  } catch {
    return { status: "error" };
  }
};
