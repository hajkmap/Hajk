import i18n from "src/i18n";

/**
 * Locale for Intl formatters (`toLocaleString`, etc.), following the active
 * Hajk language. Prefers the user's own regional variant of that language
 * from the browser language list (e.g. "en-GB" when Hajk runs in "en"),
 * since a bare "en" would mean US formats. Falls back to the bare language
 * code, or the browser language list if i18n isn't initiated.
 */
export function getBrowserLocale() {
  const lng = i18n.language;
  if (!lng) {
    return navigator.languages?.[0] ? navigator.languages : undefined;
  }
  return (
    navigator.languages?.find(
      (l) => l.toLowerCase().split(/[-_]/)[0] === lng
    ) || lng
  );
}
