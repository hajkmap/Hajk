import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getTools, getMapsByToolName } from "./requests";
import { Tool, ToolsByMapNameApiResponse } from "./types";

// React Query hook to fetch tools
export const useTools = (): UseQueryResult<Tool[]> => {
  return useQuery({
    queryKey: ["tools"],
    queryFn: getTools,
  });
};

// React Query hook to fetch maps by tool name
export const useMapsByToolName = (
  toolName: string
): UseQueryResult<ToolsByMapNameApiResponse> => {
  return useQuery({
    queryKey: ["mapsByTool", toolName],
    queryFn: () => getMapsByToolName(toolName),
  });
};
