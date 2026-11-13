import { useEffect, useState } from "react";
import type { FmeServerApi, PublishedParameter } from "../types";

interface UseProductParametersResult {
  error: boolean;
  loading: boolean;
  parameters: PublishedParameter[];
  setProductParameters: React.Dispatch<
    React.SetStateAction<PublishedParameter[]>
  >;
}

/**
 * Hook to fetch the product parameters.
 * This is used to fetch the product/workspace parameters when the product/workspace changes.
 */
export default function useProductParameters(
  groupName: string,
  productName: string,
  fmeApi: FmeServerApi
): UseProductParametersResult {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState<PublishedParameter[]>([]);

  const {
    fetchProductParameters,
    isReady,
    isResolving,
    error: apiError,
  } = fmeApi;
  const shouldFetch = Boolean(groupName && productName && isReady);

  useEffect(() => {
    if (!shouldFetch) {
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);

      const result = await fetchProductParameters(groupName, productName);

      if (cancelled) {
        return;
      }

      setError(result.error);
      setParameters(result.parameters);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchProductParameters, groupName, productName, shouldFetch]);

  const hasSelection = Boolean(groupName && productName);

  return {
    error: hasSelection ? error || apiError : false,
    loading: hasSelection ? loading || isResolving : false,
    parameters: hasSelection ? parameters : [],
    setProductParameters: setParameters,
  };
}
