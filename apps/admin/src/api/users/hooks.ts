import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { Role, User } from "./types";
import {
  createLocalUser,
  deleteUser,
  getRoles,
  getRolesByUserId,
  getUserById,
  getUsers,
} from "./requests";

// A React Query hook to fetch all users
// This hook uses the `getUsers` function from the users `requests` module
export const useUsers = (): UseQueryResult<User[]> => {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });
};

export const useUser = (id: string): UseQueryResult<User> => {
  return useQuery({
    queryKey: ["users/id"],
    queryFn: () => getUserById(id),
  });
};

export const useRoles = (): UseQueryResult<Role[]> => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });
};

export const useRolesByUserId = (id: string): UseQueryResult<Role[]> => {
  return useQuery({
    queryKey: ["user/id/roles"],
    queryFn: () => getRolesByUserId(id),
  });
};

export const useCreateLocalUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocalUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
