import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getFileList } from "./requests";
import type { FileListResponse } from "./types";

export const useFileList = (
  path: string | undefined,
  filter?: string,
  dir?: string
): UseQueryResult<FileListResponse> => {
  return useQuery({
    queryKey: ["fileList", dir, path, filter],
    queryFn: () => getFileList(path ?? "", filter, dir),
    enabled: path !== undefined,
  });
};
