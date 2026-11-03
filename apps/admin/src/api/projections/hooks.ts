import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  createProjection,
  deleteProjection,
  getProjectionsWithUsage,
  updateProjection,
} from "./requests";
import type { ProjectionWithUsage } from "./types";

export const useProjectionsWithUsage = (): UseQueryResult<
  ProjectionWithUsage[]
> =>
  useQuery({
    queryKey: ["projectionsWithUsage"],
    queryFn: getProjectionsWithUsage,
  });

/** Refresh both the catalogue page and the plain list maps use. */
function useInvalidateProjections() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["projections"] });
    void queryClient.invalidateQueries({ queryKey: ["projectionsWithUsage"] });
  };
}

export const useCreateProjection = () => {
  const invalidate = useInvalidateProjections();
  return useMutation({ mutationFn: createProjection, onSuccess: invalidate });
};

export const useUpdateProjection = () => {
  const invalidate = useInvalidateProjections();
  return useMutation({ mutationFn: updateProjection, onSuccess: invalidate });
};

export const useDeleteProjection = () => {
  const invalidate = useInvalidateProjections();
  return useMutation({ mutationFn: deleteProjection, onSuccess: invalidate });
};
