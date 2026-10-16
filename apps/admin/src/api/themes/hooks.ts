import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  getThemes,
  getTheme,
  getDeletedThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  restoreTheme,
} from "./requests";
import type { Theme, ThemeCreateInput, ThemeUpdateInput } from "./types";

export const useThemes = (
  mapName: string | undefined
): UseQueryResult<Theme[]> => {
  return useQuery({
    queryKey: ["themes", mapName],
    queryFn: () => getThemes(mapName!),
    enabled: !!mapName,
  });
};

export const useDeletedThemes = (): UseQueryResult<Theme[]> => {
  return useQuery({
    queryKey: ["deletedThemes"],
    queryFn: getDeletedThemes,
  });
};

export const useTheme = (
  mapName: string | undefined,
  id: number | undefined
): UseQueryResult<Theme> => {
  return useQuery({
    queryKey: ["theme", mapName, id],
    queryFn: () => getTheme(mapName!, id!),
    enabled: !!mapName && id != null,
  });
};

export const useCreateTheme = (mapName: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ThemeCreateInput) => createTheme(mapName, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["themes", mapName] });
    },
  });
};

export const useUpdateTheme = (mapName: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ThemeUpdateInput }) =>
      updateTheme(mapName, id, data),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["themes", mapName] });
      void queryClient.invalidateQueries({ queryKey: ["theme", mapName, id] });
    },
  });
};

export const useDeleteTheme = (mapName: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTheme(mapName, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["themes", mapName] });
      void queryClient.invalidateQueries({ queryKey: ["deletedThemes"] });
    },
  });
};

export const useRestoreTheme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => restoreTheme(id),
    onSuccess: (theme) => {
      void queryClient.invalidateQueries({ queryKey: ["deletedThemes"] });
      void queryClient.invalidateQueries({
        queryKey: ["themes", theme.mapName],
      });
    },
  });
};
