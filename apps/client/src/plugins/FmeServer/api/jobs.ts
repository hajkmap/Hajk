import type {
  FmeApiVersion,
  FmeJobStatus,
  FmeProduct,
  ParameterToSend,
} from "../types";
import { FME_API_V3 } from "./version";

interface SubmitJobResponse {
  id?: string | number;
  jobId?: string | number;
}

interface JobStatusResponse {
  status?: string;
  jobStatus?: string;
  state?: string;
}

/**
 * Builds the body for the submit job endpoint.
 * v3 and v4 requires different bodies... We need to build the body differently for each version.
 */
export function buildSubmitBody(
  product: FmeProduct,
  parametersToSend: ParameterToSend[],
  apiVersion: FmeApiVersion
): Record<string, unknown> {
  if (apiVersion === "v4") {
    const publishedParameters: Record<string, unknown> = {};
    parametersToSend.forEach(({ name, value }) => {
      publishedParameters[name] = value;
    });
    return {
      repository: product.repository,
      workspace: product.workspace,
      publishedParameters,
    };
  }
  return { publishedParameters: parametersToSend };
}

/**
 * Parses the job id from the submit job response.
 * The job id can then be used to get the status of the job.
 */
export function parseSubmitJobId(data: SubmitJobResponse): string | null {
  const jobId = data?.id ?? data?.jobId;
  return jobId == null || jobId === "" ? null : String(jobId);
}

/**
 * Extracts the job status from the job status response.
 * The job status is returned in different formats for v3 and v4, hence the strange checks...
 */
export function extractJobStatus(data: JobStatusResponse): string | null {
  return data?.status ?? data?.jobStatus ?? data?.state ?? null;
}

/**
 * Maps v4 status spellings onto the canonical FME job statuses used by the UI. v3 already returns these verbatim (i think...)
 */
const V4_STATUS_ALIASES: Record<string, FmeJobStatus> = {
  SUCCESS: "SUCCESS",
  COMPLETE: "SUCCESS",
  COMPLETED: "SUCCESS",
  FAILURE: "FME_FAILURE",
  FAILED: "FME_FAILURE",
  FME_FAILURE: "FME_FAILURE",
  JOB_FAILURE: "JOB_FAILURE",
  ABORTED: "ABORTED",
  CANCELLED: "ABORTED",
  CANCELED: "ABORTED",
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  SUBMITTED: "SUBMITTED",
  PULLED: "PULLED",
};

/**
 * Normalizes the job status.
 * This is used to convert the job status to a canonical FME job status.
 */
export function normalizeJobStatus(
  status: string | null,
  apiVersion: FmeApiVersion
): FmeJobStatus | null {
  if (status == null || status === "") {
    return null;
  }
  if (apiVersion === FME_API_V3) {
    return status;
  }

  const normalized = String(status).trim().toUpperCase();
  return V4_STATUS_ALIASES[normalized] ?? normalized;
}
