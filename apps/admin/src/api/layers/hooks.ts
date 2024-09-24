import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Layer } from "./types";
import { getLayers } from "./requests";

export const useLayers = (): UseQueryResult<Layer[]> => {
  return useQuery({ queryKey: ["layers"], queryFn: getLayers });
};
