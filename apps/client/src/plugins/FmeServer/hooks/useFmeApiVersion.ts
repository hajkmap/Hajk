import { useEffect, useState } from "react";
import { hfetch } from "../../../utils/FetchWrapper";
import { detectFmeApiVersion } from "../api/version";
import type { FmeApiVersion } from "../types";

interface UseFmeApiVersionResult {
  apiVersion: FmeApiVersion | null;
  isResolving: boolean;
  isReady: boolean;
  error: boolean;
}

/**
 * Hook to detect the FME API version.
 * This is used to detect the FME API version of the FME server.
 * Simply probes an endpoint and checks if it is available. (We probe for v4 first, then v3 if not available.)
 */
export default function useFmeApiVersion(
  proxyBase: string
): UseFmeApiVersionResult {
  const hasProxyBase = Boolean(proxyBase);
  const [apiVersion, setApiVersion] = useState<FmeApiVersion | null>(null);
  const [isResolving, setIsResolving] = useState(hasProxyBase);
  const [error, setError] = useState(!hasProxyBase);

  useEffect(() => {
    if (!hasProxyBase) {
      return undefined;
    }

    let cancelled = false;

    detectFmeApiVersion(proxyBase, hfetch)
      .then((version) => {
        if (!cancelled) {
          setApiVersion(version);
          setIsResolving(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setIsResolving(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasProxyBase, proxyBase]);

  return {
    apiVersion,
    isResolving,
    isReady: apiVersion != null,
    error,
  };
}
