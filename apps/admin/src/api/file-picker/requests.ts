import { getApiClient } from "../../lib/internal-api-client";
import type { FileListResponse } from "./types";

export const getFileList = async (
  path: string,
  filter?: string,
  dir?: string
): Promise<FileListResponse> => {
  const client = getApiClient();
  const params: Record<string, string> = { path };
  if (filter) {
    params.filter = filter;
  }
  if (dir) {
    params.dir = dir;
  }
  const response = await client.get<FileListResponse>("/files/list", {
    params,
  });
  return response.data;
};
