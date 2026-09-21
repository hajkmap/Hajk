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

export interface FmeProductRef {
  repository: string;
  workspace: string;
  geoAttribute: string;
}
