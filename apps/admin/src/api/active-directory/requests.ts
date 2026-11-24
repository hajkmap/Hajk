import { getApiClient } from "../../lib/internal-api-client";
import type { ActiveDirectoryStatus } from "./types";

export const getActiveDirectoryStatus =
  async (): Promise<ActiveDirectoryStatus> => {
    const response =
      await getApiClient().get<ActiveDirectoryStatus>("/active-directory");
    return response.data;
  };
