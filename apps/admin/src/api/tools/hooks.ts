import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { getTools, getMapsByToolName, updateTool } from "./requests";
import { Tool, ToolUpdateInput } from "./types";
import { Map } from "../maps";

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
export const useMapsByToolName = (toolName: string): UseQueryResult<Map[]> => {
  return useQuery({
    queryKey: ["mapsByTool", toolName],
    queryFn: () => getMapsByToolName(toolName),
  });
};

// React Query mutation hook to update a tool
export const useUpdateTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ToolUpdateInput }) =>
      updateTool(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
  });
};
