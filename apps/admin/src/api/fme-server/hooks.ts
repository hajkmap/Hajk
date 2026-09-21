import { useCallback } from "react";
import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { checkFmeServerConnection, checkFmeProduct } from "./requests";
import { FmeConnectionResult, FmeProductRef, FmeProductResult } from "./types";

const FME_SERVER_KEY = ["fmeServer"] as const;
const productKey = (product: FmeProductRef) =>
  [
    ...FME_SERVER_KEY,
    "product",
    product.repository,
    product.workspace,
    product.geoAttribute,
  ] as const;

// Runs every time the fmeServer settings page mounts (staleTime 0). Note that
// every subscriber that mounts later refetches too, so product rows get the
// result as a prop instead of calling this themselves.
export const useFmeServerConnection = (): UseQueryResult<FmeConnectionResult> =>
  useQuery({
    queryKey: [...FME_SERVER_KEY, "connection"],
    queryFn: checkFmeServerConnection,
    staleTime: 0,
  });

export const useFmeProductCheck = (
  product: FmeProductRef,
  enabled: boolean,
): UseQueryResult<FmeProductResult> =>
  useQuery({
    queryKey: productKey(product),
    queryFn: () => checkFmeProduct(product),
    enabled: enabled && product.repository !== "" && product.workspace !== "",
    // Like the connection check: run again every time the page opens.
    staleTime: 0,
  });

// Re-runs one product's check or, without an argument, the connection check
// and every product check on the page.
export const useRecheckFmeServer = () => {
  const queryClient = useQueryClient();
  return useCallback(
    (product?: FmeProductRef) =>
      queryClient.invalidateQueries({
        queryKey: product ? productKey(product) : FME_SERVER_KEY,
      }),
    [queryClient],
  );
};
