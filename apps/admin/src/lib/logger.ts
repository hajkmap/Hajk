const isDev = import.meta.env.DEV;
const enableLogs = new URLSearchParams(window.location.search).has("debug");

type LogMethod = (...args: unknown[]) => void;

/**
 * Let's log messages to the console if we're in dev mode or if `?debug` is present in the URL
 */
export const logger: Record<"log" | "warn" | "error", LogMethod> = {
  log: (...args) => {
    if (isDev || enableLogs) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (isDev || enableLogs) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    console.error(...args); // Anyway, always log errors
  },
};
