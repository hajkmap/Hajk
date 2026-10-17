import {
  useQuery,
  UseQueryResult,
  useMutation,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  getGroups,
  getGroupById,
  getMapsByGroupId,
  createGroup,
  updateGroup,
  deleteGroup,
} from "./requests";
import { Group, GroupCreateInput, UpdateGroupVariables } from "./types";
import { Map } from "../maps";

export const useGroups = (): UseQueryResult<Group[]> => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });
};

export const useGroupById = (groupId: string): UseQueryResult<Group> => {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => getGroupById(groupId),
    enabled: Boolean(groupId),
  });
};

export const useMapsByGroupId = (groupId: string): UseQueryResult<Map[]> => {
  return useQuery({
    queryKey: ["mapsByGroupId", groupId],
    queryFn: () => getMapsByGroupId(groupId),
    enabled: Boolean(groupId),
  });
};

export const useCreateGroup = (): UseMutationResult<
  Group,
  Error,
  GroupCreateInput
> => {
  const queryClient = useQueryClient();

  return useMutation<Group, Error, GroupCreateInput>({
    mutationFn: createGroup,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      if (data.id) {
        queryClient.setQueryData<Group>(["groups", data.id], data);
      }
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useUpdateGroup = (): UseMutationResult<
  Group,
  Error,
  UpdateGroupVariables
> => {
  const queryClient = useQueryClient();

  return useMutation<Group, Error, UpdateGroupVariables>({
    mutationFn: ({ groupId, data }) => updateGroup(groupId, data),
    onSuccess: (data, { groupId }) => {
      queryClient.setQueryData<Group>(["groups", groupId], data);
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      void queryClient.invalidateQueries({
        queryKey: ["mapsByGroupId", groupId],
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useDeleteGroup = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteGroup,
    onSuccess: (_, groupId) => {
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.removeQueries({ queryKey: ["groups", groupId] });
      queryClient.removeQueries({ queryKey: ["mapsByGroupId", groupId] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
