import { useCallback } from "react";
import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  checkFmeServerConnection,
  getFmeWorkspaceParameters,
  getFmeWorkspaces,
} from "./requests";
import {
  FmeConnectionResult,
  FmeWorkspaceRef,
  FmeWorkspaceResult,
} from "./types";

const FME_SERVER_KEY = ["fmeServer"] as const;
const parametersKey = ({ repository, workspace }: FmeWorkspaceRef) =>
  [...FME_SERVER_KEY, "parameters", repository, workspace] as const;
const NO_NAMES: string[] = [];

// Runs every time the fmeServer settings page mounts (staleTime 0). Note that
// every subscriber that mounts later refetches too, so product rows get the
// result as a prop instead of calling this themselves.
export const useFmeServerConnection = (): UseQueryResult<FmeConnectionResult> =>
  useQuery({
    queryKey: [...FME_SERVER_KEY, "connection"],
    queryFn: checkFmeServerConnection,
    staleTime: 0,
  });

// The product health icon: does the workspace exist, and which parameters
// does it have. Like the connection check, it runs again on every page open.
export const useFmeProductCheck = (
  ref: FmeWorkspaceRef,
  enabled: boolean,
): UseQueryResult<FmeWorkspaceResult> =>
  useQuery({
    queryKey: parametersKey(ref),
    queryFn: () => getFmeWorkspaceParameters(ref),
    enabled: enabled && ref.repository !== "" && ref.workspace !== "",
    staleTime: 0,
  });

// Suggestions for one product's workspace and geoAttribute fields, given the
// repository names from the connection check (empty when it failed). Each
// list loads only once the value before it exactly matches a known name, so
// typing doesn't send a request per keystroke. The lists keep the app's
// default staleTime, so the parameters are reused from the health icon's
// request; clicking the connection icon refreshes everything.
export const useFmeSuggestions = (
  repositories: string[],
  repository: string,
  workspace: string,
) => {
  const ref = { repository, workspace };
  const repositoryKnown = repositories.includes(ref.repository);
  const { data: workspaces = NO_NAMES } = useQuery({
    queryKey: [...FME_SERVER_KEY, "workspaces", ref.repository],
    queryFn: () => getFmeWorkspaces(ref.repository),
    enabled: repositoryKnown,
  });
  const workspaceKnown = repositoryKnown && workspaces.includes(ref.workspace);
  const { data: parameters = NO_NAMES } = useQuery({
    queryKey: parametersKey(ref),
    queryFn: () => getFmeWorkspaceParameters(ref),
    enabled: workspaceKnown,
    select: (result) => result.parameters ?? NO_NAMES,
  });
  return {
    workspaces: repositoryKnown ? workspaces : NO_NAMES,
    parameters: workspaceKnown ? parameters : NO_NAMES,
  };
};

// Re-runs one product's check or, without an argument, the connection check,
// every product check and the suggestion lists.
export const useRecheckFmeServer = () => {
  const queryClient = useQueryClient();
  return useCallback(
    (ref?: FmeWorkspaceRef) =>
      queryClient.invalidateQueries({
        queryKey: ref ? parametersKey(ref) : FME_SERVER_KEY,
      }),
    [queryClient],
  );
};
