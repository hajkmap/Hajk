import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getTools, getMapsByToolName } from "./requests";
import { Tool, GlobalMapsApiResponse } from "./types";

// React Query hook to fetch tools
// This hook uses the `getTools` function from the tools `requests` module
export const useTools = (): UseQueryResult<Tool[]> => {
  return useQuery({
    queryKey: ["tools"],
    queryFn: getTools,
  });
};

// React Query hook to fetch maps by tool name
// This hook uses the `getMapsByToolName` function from the tools `requests` module
export const useMapsByToolName = (
  toolName: string
): UseQueryResult<GlobalMapsApiResponse> => {
  return useQuery({
    queryKey: ["mapsByTool", toolName],
    queryFn: () => getMapsByToolName(toolName),
  });
};
