// Result of checking the backend's FME-server proxy (/fmeproxy). There is one
// FME connection per backend, configured in its .env — not per tool.
export type FmeConnectionStatus =
  | "ok"
  | "notConfigured" // proxy not mounted: FME_SERVER_ACTIVE/BASE_URL unset
  | "unreachable" // proxy mounted but FME-server didn't answer
  | "unauthorized" // FME-server rejected FME_SERVER_USER/PASSWORD
  | "unexpected";

export interface FmeConnectionResult {
  status: FmeConnectionStatus;
  httpStatus?: number;
  // Every repository's name when status is "ok"; feeds the suggestions.
  repositories?: string[];
}

export interface FmeWorkspaceRef {
  repository: string;
  workspace: string;
}

export interface FmeProductRef extends FmeWorkspaceRef {
  geoAttribute: string;
}

// Result of fetching a workspace's parameters.
export interface FmeWorkspaceResult {
  status: "ok" | "notFound" | "error"; // notFound: repository or workspace
  httpStatus?: number;
  // The parameter names when status is "ok".
  parameters?: string[];
}

export type FmeProductStatus =
  | "ok"
  | "notFound" // repository or workspace doesn't exist
  | "geoAttributeMissing" // workspace has no parameter named geoAttribute
  | "error";

export interface FmeProductResult {
  status: FmeProductStatus;
  httpStatus?: number;
}
