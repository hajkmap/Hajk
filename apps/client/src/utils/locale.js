/**
 * Locale list for Intl formatters (`toLocaleString`, etc.).
 * Passing this explicitly makes Chrome/Edge respect the browser language
 * list instead of the OS locale. Falls back to the runtime default if missing.
 */
export function getBrowserLocale() {
  return navigator.languages?.[0] ? navigator.languages : undefined;
}
