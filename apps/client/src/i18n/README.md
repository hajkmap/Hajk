# Translations (i18n)

The client uses [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/).
Swedish (`sv`) is the source language. If a string is missing in another language, the Swedish
string is shown instead.

## Where the strings live

There is one JSON file per language, grouped by area (a top-level key):

- **Core**: `src/i18n/<lang>.json`, e.g. `{ "common": { "close": "Stäng" }, "search": { … } }`
- **Plugins**: `src/plugins/<Plugin>/i18n/<lang>.json`, holding only the plugin's own area: the
  camelCased folder name, e.g. `{ "print": { … } }` for `Print`.

Keys are written `<area>.<camelCaseKey>`, e.g. `print.creatingImages`. Texts shared by several
components go in `common.*`. A plugin may use core areas (`common.*`, `search.*`…) but never
another plugin's area.

At startup, all core and plugin files are bundled and merged. If a plugin and core define the same
key, core wins.

## Using translations in code

Never hard-code user-facing text.

```jsx
// Function components
const { t } = useTranslation();
t("print.creatingImages");

// Class components and plain JS (models, OpenLayers styles…)
import i18n from "src/i18n";
i18n.t("print.creatingImages");
```

- **Interpolation**, not concatenation: `t("search.hits", { count })` with `"{{count}} träffar"`.
- **Plurals**: `_one`/`_other` suffixes, e.g. `"hits_one": "{{count}} träff"`,
  `"hits_other": "{{count}} träffar"`.
- **Rich text**: `<Trans i18nKey="…" components={{ strong: <strong /> }} />`.
- **Module-level constants**: use a getter, `get label() { return i18n.t("…"); }`, so the text is
  translated when it's read rather than at import time.
- **Admin-configurable texts**: text entered in Admin is assumed to be Swedish. Use
  `configText("<area>.<key>", options.x)` instead of `options.x || "Svensk standardtext"`. Under
  `sv` the admin text wins. Under other languages the translated default wins.

## Which language is shown

The language is picked once at startup, from the first of these that is available:

1. The `lang` URL parameter (query or hash), e.g. `?lang=en`
2. The user's saved choice (only if functional cookies are allowed)
3. `defaultLanguage` in `appConfig.json`
4. Swedish

A language is available if it has a JSON file and is listed in `availableLanguages` in
`appConfig.json` (default `["sv", "en"]`).

To switch language, call `hajkPublicApi.setLanguage("en")`. It saves the choice, writes `lang` to
the URL and reloads the page. Live switching isn't supported.

## Adding a language

No code changes are needed. For Norwegian (`no`), for example:

1. Create `src/i18n/no.json` containing `{}`.
2. Run `npm run i18n:extract`. This fills `src/i18n/no.json`, and creates `no.json` in every
   plugin's `i18n/` folder, with all keys and empty values.
3. Translate the values. Empty values fall back to Swedish, so you can do this gradually.
4. Add `"no"` to `availableLanguages` in `public/appConfig.json`:

   ```json
   "defaultLanguage": "sv",
   "availableLanguages": ["sv", "en", "no"]
   ```

5. Rebuild the client (`npm run build`). Translations are bundled, so they need a new build.

`npm run i18n:status` shows how much of each language is translated.

## Adding strings

1. Use the new key in code, e.g. `t("print.newThing")`.
2. Run `npm run i18n:extract`. It adds the key to every language file (core and plugins), removes
   keys that are no longer used and regenerates the key types.
3. Fill in the Swedish and English values (and any other languages).

Keys that only exist at runtime (e.g. `<plugin>.title`) must match `preservePatterns` in
`i18next.config.ts`, or extract will remove them.

### New plugins

Create `src/plugins/<Plugin>/i18n/sv.json` with `{ "<area>": {} }`, e.g. `{ "myPlugin": {} }` for
`MyPlugin`, then run `npm run i18n:extract`. This applies to third-party plugins too.

## Scripts

Run in `apps/client`:

| Script                  | What it does                                                    |
| ----------------------- | --------------------------------------------------------------- |
| `npm run i18n:extract`  | Syncs all language files with the keys used in code, and types. |
| `npm run i18n:status`   | Shows translation coverage per language.                        |
| `npm run i18n:lint`     | Reports hard-coded strings in JSX.                              |
| `npm run i18n:sv-check` | Lists other code containing å/ä/ö (likely untranslated text).   |
