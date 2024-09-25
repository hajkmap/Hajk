import { useState, useEffect } from "react";

export interface Config {
  apiBaseUrl: string;
}

let cachedConfig: Config | null = null;

export const useConfig = (): {
  config: Config | null;
  loading: boolean;
  loadError: string | null;
} => {
  const [config, setConfig] = useState<Config | null>(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedConfig) {
      return;
    }
    const fetchConfig = async () => {
      try {
        const response = await fetch("/config.json");
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        const data = (await response.json()) as Config;
        cachedConfig = data;
        setConfig(data);
      } catch (error) {
        setLoadError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void fetchConfig();
  }, [config]);

  return {
    config,
    loading,
    loadError,
  };
};
