import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getActiveDirectoryStatus } from "./requests";
import type { ActiveDirectoryStatus } from "./types";

/** Whether the backend looks users up in AD, so that the AD groups apply. */
export const useActiveDirectoryStatus =
  (): UseQueryResult<ActiveDirectoryStatus> =>
    useQuery({
      queryKey: ["activeDirectoryStatus"],
      queryFn: getActiveDirectoryStatus,
    });
