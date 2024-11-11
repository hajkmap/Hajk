import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Role, User } from "./types";
import { getRoles, getRolesByUserId, getUserById, getUsers } from "./requests";

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
