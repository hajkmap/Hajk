/**
 * i18n bootstrap for the Hajk client.
 *
 * - Swedish ("sv") is the source and fallback language.
 * - Core strings live in `src/i18n/<lng>.json`, all in the default namespace
 *   ("translation"), grouped by a top-level key per area, e.g. `search.*`.
 * - Each plugin keeps its strings in `src/plugins/<Plugin>/i18n/<lng>.json`,
 *   under its own area, e.g. `print.*`. These are merged in, but never
 *   overwrite core keys.
 * - The language is resolved once at startup (see resolveLanguage()). Switching
 *   language (setLanguage()) reloads the page: live switching is not supported.
 *
 * Usage:
 *   React function components: `const { t } = useTranslation(); t("common.close")`
 *   Class components, plain JS: `import i18n from "src/i18n"; i18n.t("common.close")`
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LocalStorageHelper from "../utils/LocalStorageHelper";
import { functionalOk } from "../models/Cookie";
import { getMergedSearchAndHashParams } from "../utils/getMergedSearchAndHashParams";

export const SOURCE_LANGUAGE = "sv";
const DEFAULT_AVAILABLE_LANGUAGES = ["sv", "en"];
const STORAGE_KEY = "i18n";
const URL_PARAM = "lang";

// Language used when no lang param is present and appConfig doesn't set
// defaultLanguage. Updated by resolveLanguage() once appConfig is loaded.
let defaultLanguage = SOURCE_LANGUAGE;
let availableLanguages = DEFAULT_AVAILABLE_LANGUAGES;

// Reduce any BCP 47 tag ("sv-SE", "en_GB") to its bare language subtag ("sv", "en").
const toBaseLanguage = (code) =>
  typeof code === "string" && code.trim().length > 0
    ? code.trim().toLowerCase().split(/[-_]/)[0]
    : null;

const languageFromPath = (path) => path.match(/([^/]+)\.json$/)?.[1];

const coreFiles = import.meta.glob("./*.json", {
  eager: true,
  import: "default",
});
const pluginFiles = import.meta.glob("../plugins/*/i18n/*.json", {
  eager: true,
  import: "default",
});

const resources = {};
for (const [path, data] of Object.entries(coreFiles)) {
  resources[languageFromPath(path)] = { translation: data };
}

// Languages that we actually have strings for (core or plugins).
const bundledLanguages = [
  ...new Set(
    [...Object.keys(coreFiles), ...Object.keys(pluginFiles)].map(
      languageFromPath
    )
  ),
];

const getUrlLanguage = () =>
  toBaseLanguage(getMergedSearchAndHashParams().get(URL_PARAM));

const getStoredLanguage = () =>
  functionalOk()
    ? toBaseLanguage(LocalStorageHelper.get(STORAGE_KEY, {}, true).lang)
    : null;

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

/**
 * Initiates i18next. Called before appConfig is fetched, so that startup
 * error screens can be translated. Uses the URL lang param if it's a language
 * we have strings for, otherwise Swedish. resolveLanguage() picks the final
 * language once appConfig is loaded.
 */
export async function initI18n() {
  const urlLanguage = getUrlLanguage();
  await i18n.use(initReactI18next).init({
    resources,
    lng: bundledLanguages.includes(urlLanguage) ? urlLanguage : SOURCE_LANGUAGE,
    fallbackLng: SOURCE_LANGUAGE,
    // Only languages we have strings for. resolveLanguage() further limits
    // this to appConfig.availableLanguages.
    supportedLngs: bundledLanguages,
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: { escapeValue: false }, // React escapes already
    // `i18n:extract` adds new keys to secondary languages as "". Treat those
    // as missing, so the Swedish fallback is shown instead of an empty string.
    returnEmptyString: false,
  });

  // Merge plugin-local translations. Deep merge, but never overwrite: core wins.
  for (const [path, data] of Object.entries(pluginFiles)) {
    i18n.addResourceBundle(
      languageFromPath(path),
      "translation",
      data,
      true, // deep
      false // don't overwrite
    );
  }

  return i18n;
}

/**
 * Resolves the language to use, in this order:
 * 1. `lang` URL param (hash or query)
 * 2. stored preference (only if functional cookies are allowed)
 * 3. appConfig.defaultLanguage
 * 4. "sv"
 * Candidates not in appConfig.availableLanguages (default ["sv", "en"]) are skipped.
 *
 * Pass `useStoredLanguage: false` until the cookie manager is configured
 * (that needs the map config), since functionalOk() can't be trusted before that.
 */
export async function resolveLanguage(
  appConfig = {},
  { useStoredLanguage = true } = {}
) {
  availableLanguages = Array.isArray(appConfig.availableLanguages)
    ? appConfig.availableLanguages.map(toBaseLanguage).filter(Boolean)
    : DEFAULT_AVAILABLE_LANGUAGES;

  const isAvailable = (lng) =>
    availableLanguages.includes(lng) && bundledLanguages.includes(lng);

  const configDefault = toBaseLanguage(appConfig.defaultLanguage);
  defaultLanguage = isAvailable(configDefault)
    ? configDefault
    : SOURCE_LANGUAGE;

  const lng =
    [
      getUrlLanguage(),
      useStoredLanguage ? getStoredLanguage() : null,
      defaultLanguage,
    ].find(isAvailable) || SOURCE_LANGUAGE;

  if (lng !== i18n.language) {
    await i18n.changeLanguage(lng);
  }
  return lng;
}

export const getDefaultLanguage = () => defaultLanguage;

// Languages that can be passed to setLanguage(): available in appConfig and bundled.
export const getAvailableLanguages = () =>
  availableLanguages.filter((lng) => bundledLanguages.includes(lng));

/**
 * Switches language by saving the choice and reloading the page.
 * The choice is also written to the URL (lang param), so it survives the
 * reload even when storage isn't allowed (no functional cookie consent).
 * Note that the reload triggers the "unsaved changes" confirmation if there
 * are dirty layers, which lets the user cancel the switch.
 */
export function setLanguage(lng) {
  const base = toBaseLanguage(lng);
  if (!availableLanguages.includes(base) || !bundledLanguages.includes(base)) {
    console.warn(
      `setLanguage: "${lng}" is not an available language. Available: ${availableLanguages.join(", ")}.`
    );
    return;
  }

  functionalOk() && LocalStorageHelper.set(STORAGE_KEY, { lang: base }, true);

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replaceAll("#", ""));
  const inHash = hashParams.has(URL_PARAM);
  const inQuery = url.searchParams.has(URL_PARAM);

  // Update lang wherever it already is. If it's nowhere, put it in the hash
  // if the hash is in use, otherwise in the query.
  if (inHash || (!inQuery && url.hash.length > 1)) {
    hashParams.set(URL_PARAM, base);
    url.hash = hashParams.toString();
  }
  if (inQuery || (!inHash && url.hash.length <= 1)) {
    url.searchParams.set(URL_PARAM, base);
  }

  window.history.replaceState(null, "", url.toString());
  window.location.reload();
}

/**
 * Picks the text to show for an admin-configurable text (tool title,
 * description, button labels and similar `options.*` texts) that also has a
 * translated default in the client.
 *
 * IMPORTANT ASSUMPTION: all text entered in Admin (stored in App_Data/*.json)
 * is Swedish. Admin even pre-fills Swedish defaults in its tool forms.
 * Therefore:
 * - Active language is Swedish: the admin text always wins, as it always has.
 *   The sv default is only used if Admin left the field empty.
 * - Any other language: the client's translated default wins and the admin
 *   text is ignored, because it's Swedish. Accepted trade-off: custom admin
 *   titles are not shown in other languages.
 * - No translation of the default in the active language (e.g. a third-party
 *   plugin without that language): show the admin text rather than a generic
 *   Swedish default.
 *
 * The key comes first so that `i18n:extract` picks it up, like it does for t().
 *
 * @param {string} defaultKey i18n key of the client default, e.g. "print.title"
 * @param {*} adminValue Value from the map config (assumed Swedish)
 * @param {string} [fallback] Hard-coded default used if defaultKey has no
 *   Swedish string either (e.g. a plugin that isn't migrated yet)
 * @returns {string}
 */
export function configText(defaultKey, adminValue, fallback) {
  const hasAdminValue =
    typeof adminValue === "string"
      ? adminValue.trim().length > 0
      : adminValue !== undefined && adminValue !== null;

  const lng = i18n.resolvedLanguage || i18n.language;

  // Check the active language only: i18n.exists() would also match the sv fallback.
  if (
    lng !== SOURCE_LANGUAGE &&
    ![undefined, ""].includes(i18n.getResource(lng, "translation", defaultKey))
  ) {
    return i18n.t(defaultKey);
  }

  if (hasAdminValue) return adminValue;

  return ![undefined, ""].includes(
    i18n.getResource(SOURCE_LANGUAGE, "translation", defaultKey)
  )
    ? i18n.t(defaultKey, { lng: SOURCE_LANGUAGE })
    : fallback;
}

export default i18n;
