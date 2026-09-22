import { getApiClient } from "../../lib/internal-api-client";
import {
  FmeConnectionResult,
  FmeWorkspaceRef,
  FmeWorkspaceResult,
} from "./types";

/**
 * Requests to FME-server via the backend's /fmeproxy (which adds the
 * credentials from the backend's .env). None of them throw: the checks return
 * every outcome as a status, and the suggestion lists fall back to [].
 */

const FME_REST = "/fmeproxy/fmerest/v3";

// Accept every status code so expected failures (404 when FME isn't
// configured) don't reach the client's error interceptor and log noise.
// No cookies: the proxy needs none, and FME's own "Access-Control-Allow-
// Origin: *" comes through the proxy, which browsers reject for requests
// made with credentials.
const requestConfig = {
  timeout: 5000,
  validateStatus: () => true,
  withCredentials: false,
};

// -1 means no limit, as in legacy admin.
const ALL = { limit: -1, offset: -1 };

const isHajkError = (data: unknown) =>
  typeof data === "object" && data !== null && "errorId" in data;

// Body of the backend proxy's onError handler (fme.server.proxy.ts).
const isProxyFailure = (data: unknown) =>
  typeof data === "string" && data.startsWith("Request failed while proxying");

// FME lists repositories and repository items as { items: [{ name, ... }] }.
// A 200 with anything else means FME_SERVER_BASE_URL points at something that
// isn't FME.
const isItemList = (data: unknown): data is { items: unknown[] } =>
  typeof data === "object" &&
  data !== null &&
  Array.isArray((data as { items?: unknown }).items);

const names = (list: unknown[]) =>
  list
    .map((entry) => (entry as { name?: unknown } | null)?.name)
    .filter((name): name is string => typeof name === "string");

export const checkFmeServerConnection =
  async (): Promise<FmeConnectionResult> => {
    try {
      // repositories requires authentication, so bad credentials show up
      // here. Listing all of them also feeds the repository suggestions.
      const { status, data } = await getApiClient().get<unknown>(
        `${FME_REST}/repositories`,
        { ...requestConfig, params: ALL },
      );
      if (status >= 200 && status < 300) {
        return isItemList(data)
          ? { status: "ok", repositories: names(data.items) }
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

// Workspace names in a repository, for the suggestions. A repository can also
// hold custom transformers, formats and templates; only workspaces can be
// ordered, so those are filtered out (legacy admin listed everything).
export const getFmeWorkspaces = async (
  repository: string,
): Promise<string[]> => {
  try {
    const { status, data } = await getApiClient().get<unknown>(
      `${FME_REST}/repositories/${encodeURIComponent(repository)}/items`,
      { ...requestConfig, params: { ...ALL, type: "WORKSPACE" } },
    );
    return status >= 200 && status < 300 && isItemList(data)
      ? names(data.items)
      : [];
  } catch {
    return [];
  }
};

// Same URL the client builds when fetching a product's parameters.
export const getFmeWorkspaceParameters = async ({
  repository,
  workspace,
}: FmeWorkspaceRef): Promise<FmeWorkspaceResult> => {
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
    return { status: "ok", parameters: names(data) };
  } catch {
    return { status: "error" };
  }
};
