import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { User } from "./types";
import { getUsers } from "./requests";

// A React Query hook to fetch all users
// This hook uses the `getUsers` function from the users `requests` module
export const useUsers = (): UseQueryResult<User[]> => {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });
};
