import type { FmeApiVersion, FmeProduct } from "../types";
import { FME_API_V4 } from "./version";

/**
 * Returns the API path prefix for the given FME API version.
 */
function getApiPathPrefix(version: FmeApiVersion): string {
  return version === FME_API_V4 ? "fmeapiv4" : "fmerest/v3";
}

/**
 * Returns the FME proxy base URL. If the proxy base does not end with "/fmeproxy", it is appended.
 * The proxy base is typically set in the plugin configuration.
 */
function getFmeProxyBase(proxyBase: string): string {
  return proxyBase.endsWith("/fmeproxy")
    ? proxyBase
    : `${proxyBase.replace(/\/$/, "")}/fmeproxy`;
}

/**
 * Builds a proxied URL for the given path and FME API version.
 * The path is normalized to start with a slash.
 * The proxy base is prepended to the path.
 * The API path prefix is appended to the path.
 */
function buildProxiedUrl(
  proxyBase: string,
  path: string,
  version: FmeApiVersion
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getFmeProxyBase(proxyBase)}/${getApiPathPrefix(version)}${normalizedPath}`;
}

/**
 * Returns the URL for the repositories endpoint.
 * This endpoint is used to get the repositories of the FME server.
 * TODO: Pagination, limits, offsets, etc.
 */
export function getRepositoriesUrl(
  proxyBase: string,
  version: FmeApiVersion
): string {
  const path =
    version === FME_API_V4
      ? "/repositories"
      : "/repositories?limit=-1&offset=-1";
  return buildProxiedUrl(proxyBase, path, version);
}

/**
 * Returns the URL for the workspaces endpoint.
 * This endpoint is used to get the workspaces of a repository.
 */
export function getWorkspacesUrl(
  proxyBase: string,
  repository: string,
  version: FmeApiVersion
): string {
  return buildProxiedUrl(
    proxyBase,
    `/repositories/${encodeURIComponent(repository)}/items`,
    version
  );
}

/**
 * Returns the URL for the workspace parameters endpoint.
 * This endpoint is used to get the parameters of a workspace.
 */
export function getWorkspaceParametersUrl(
  proxyBase: string,
  repository: string,
  workspace: string,
  version: FmeApiVersion
): string {
  const path =
    version === FME_API_V4
      ? `/workspaces/${encodeURIComponent(repository)}/${encodeURIComponent(workspace)}/parameters`
      : `/repositories/${encodeURIComponent(repository)}/items/${encodeURIComponent(workspace)}/parameters`;
  return buildProxiedUrl(proxyBase, path, version);
}

/**
 * Returns the URL for the submit job endpoint.
 * This endpoint is used to submit a job to the FME server.
 */
export function getSubmitJobUrl(
  proxyBase: string,
  product: FmeProduct,
  version: FmeApiVersion
): string {
  if (version === FME_API_V4) {
    return buildProxiedUrl(proxyBase, "/jobs", version);
  }
  return buildProxiedUrl(
    proxyBase,
    `/transformations/submit/${encodeURIComponent(product.repository)}/${encodeURIComponent(product.workspace)}/`,
    version
  );
}

/**
 * Returns the URL for the job status endpoint.
 * This endpoint is used to get the status of a submitted job.
 */
export function getJobStatusUrl(
  proxyBase: string,
  jobId: string,
  version: FmeApiVersion
): string {
  if (version === FME_API_V4) {
    return buildProxiedUrl(
      proxyBase,
      `/jobs/${encodeURIComponent(jobId)}`,
      version
    );
  }
  return buildProxiedUrl(
    proxyBase,
    `/transformations/jobs/id/${encodeURIComponent(jobId)}/`,
    version
  );
}

/**
 * Returns the URL for the data download endpoint.
 * This endpoint seems to be stable between v3 and v4.
 */
export function getDataDownloadUrl(
  proxyBase: string,
  product: FmeProduct
): string {
  return `${getFmeProxyBase(proxyBase)}/fmedatadownload/${encodeURIComponent(product.repository)}/${encodeURIComponent(product.workspace)}/`;
}

/**
 * Returns the URL for the data upload endpoint.
 * This endpoint is used to upload files to the FME server. The files uploaded can be used as source data for the workspace.
 */
export function getDataUploadUrl(
  proxyBase: string,
  product: FmeProduct,
  options: { sessionId: string }
): string {
  const base = `${getFmeProxyBase(proxyBase)}/fmedataupload/${encodeURIComponent(product.repository)}/${encodeURIComponent(product.workspace)}/`;
  const params = new URLSearchParams({
    opt_fullpath: "true",
    opt_responseformat: "json",
    opt_namespace: options.sessionId,
  });
  return `${base}?${params.toString()}`;
}
