import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  getTools,
  getToolTypes,
  getMapsByToolName,
  createTool,
  updateTool,
  deleteTool,
} from "./requests";
import { Tool, ToolType, ToolCreateInput, ToolUpdateInput } from "./types";
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

// React Query hook to fetch available tool types
export const useToolTypes = (): UseQueryResult<ToolType[]> => {
  return useQuery({
    queryKey: ["toolTypes"],
    queryFn: getToolTypes,
  });
};

// React Query mutation hook to create a tool instance
export const useCreateTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ToolCreateInput) => createTool(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
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
      void queryClient.invalidateQueries({ queryKey: ["toolsByMap"] });
    },
  });
};

// React Query mutation hook to delete (soft) a tool instance
export const useDeleteTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTool(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
      // The tool may be placed on maps — refresh all per-map tool queries.
      void queryClient.invalidateQueries({ queryKey: ["toolsByMap"] });
    },
  });
};
