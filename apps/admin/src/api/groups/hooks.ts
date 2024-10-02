import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  getGroups,
  getGroupById,
  getLayersByGroupId,
  getMapsByGroupId,
} from "./requests";
import { Group } from "./types";
import { Map } from "../maps";
import { Layer } from "../layers";

// A React Query hook to fetch groups
// This hook uses the `getGroups` function from the groups `requests` module
export const useGroups = (): UseQueryResult<Group[]> => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });
};

// A React Query hook to fetch a group by id
// This hook uses the `getGroupById` function from the groups `requests` module
export const useGroupById = (groupId: string): UseQueryResult<Group> => {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupById(groupId),
  });
};

// A React Query hook to fetch layers by group id
// This hook uses the `getLayersByGroupId` function from the groups `requests` module
export const useLayersByGroupId = (
  groupId: string
): UseQueryResult<Layer[]> => {
  return useQuery({
    queryKey: ["layersByGroupId", groupId],
    queryFn: () => getLayersByGroupId(groupId),
  });
};

// A React Query hook to fetch maps by group id
// This hook uses the `getMapsByGroupId` function from the groups `requests` module
export const useMapsByGroupId = (groupId: string): UseQueryResult<Map[]> => {
  return useQuery({
    queryKey: ["mapsByGroupId", groupId],
    queryFn: () => getMapsByGroupId(groupId),
  });
};
