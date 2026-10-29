# The InfoDialog plugin

InfoDialog renders one or more read-only dialog windows, each with a Markdown body. It is primarily used for help texts, announcements, or news — any content an admin wants to surface to the user on load or on demand.

## ⚠️ Configured by hand (no Admin UI)

Unlike most Hajk plugins, InfoDialog has **no settings page in Admin**. The reason is that `options` can be an **array** — one object per dialog — so a single plugin entry can serve any number of independent dialogs. Admin only supports one options object per plugin, so the configuration must be written directly in the map's JSON file.

### How to add it

1. Open the map config, e.g. `apps/backend/App_Data/map_1.json`.
2. Find the `tools` array (the list of plugin entries) and add an entry with `"type": "infodialog"`.
3. Put your dialogs in `options` — either an **array** (recommended, one object per dialog) or a single object.
4. Save the file and reload the client. If the backend caches map configs, restart it or clear the cache.

Each object in the array becomes its own dialog with its own button, content and visibility rules. The plugin-level `index` controls the sort order of the plugin entry itself.

> **Note:** Since Admin does not know about this plugin's options, take care when saving the map from Admin afterwards. Always check (e.g. with `git diff`) that your `infodialog` entry is intact.

## Options

Every object in `options` supports the following properties. All are optional unless stated.

| Option                         | Type              | Default                           | Description                                                                                                                                                                                    |
| ------------------------------ | ----------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                         | string            | –                                 | Unique key per instance. **Required when using several dialogs**, as it is used for the localStorage key (`infodialog.<name>`) and for the show/close events (see below).                      |
| `title`                        | string            | `"Informationsdialog"`            | Label on the Drawer/Widget/Control button.                                                                                                                                                     |
| `description`                  | string            | `"Visa en informativ dialogruta"` | Subtitle on the Widget card, tooltip on the Control button.                                                                                                                                    |
| `target`                       | string            | –                                 | Button placement: `"toolbar"` (Drawer only), `"left"`, `"right"` (Widget), `"control"` (Control button) or `"hidden"` (no button; open it from elsewhere, e.g. via event or `visibleAtStart`). |
| `icon`                         | string            | InfoTwoTone                       | [Material icon](https://fonts.google.com/icons) ligature name, e.g. `"helpcenter"`.                                                                                                            |
| `headerText`                   | string            | –                                 | Title at the top of the dialog. Omit to hide the title bar.                                                                                                                                    |
| `text`                         | string            | –                                 | Dialog body, GitHub-flavoured Markdown. Use `\n` for line breaks in JSON.                                                                                                                      |
| `allowDangerousHtml`           | boolean           | `false`                           | Allow raw HTML inside the Markdown body. Only enable for trusted content.                                                                                                                      |
| `useLegacyNonMarkdownRenderer` | boolean           | `false`                           | Bypass ReactMarkdown and render `text` as HTML.                                                                                                                                                |
| `buttonText`                   | string            | –                                 | Label of the primary (close) button.                                                                                                                                                           |
| `primaryButtonVariant`         | string            | `"text"`                          | MUI button variant for the close button, e.g. `"contained"`.                                                                                                                                   |
| `abortText`                    | string            | –                                 | Renders a second button. Mainly useful in programmatic use with callbacks.                                                                                                                     |
| `prompt`                       | boolean           | `false`                           | Adds a text input to the dialog. Mainly for programmatic use.                                                                                                                                  |
| `visibleAtStart`               | boolean           | `false`                           | Open automatically when the map loads. Never auto-opens in `clean` mode.                                                                                                                       |
| `showOnlyOnce`                 | boolean           | `false`                           | With `visibleAtStart`: only auto-open the first time (stored per browser).                                                                                                                     |
| `lastModified`                 | string (ISO 8601) | –                                 | With `visibleAtStart`: auto-open again whenever this timestamp is newer than when the user last saw the dialog. **Takes precedence over `showOnlyOnce`.**                                      |
| `visibleForGroups`             | string[]          | `[]`                              | Restrict to these Active Directory groups. Empty = everyone.                                                                                                                                   |

### Translations

The texts `title`, `description`, `headerText`, `text`, `buttonText` and `abortText` can be
translated per dialog, using the dialog's `name`. Add the keys to
`src/plugins/InfoDialog/i18n/<lng>.json` under `infoDialog.dialogs.<name>`:

```json
{
  "infoDialog": {
    "dialogs": {
      "help": { "title": "Show help", "buttonText": "Close" }
    }
  }
}
```

The texts in the map config are assumed to be Swedish. Under `sv` they're always shown. Under other
languages the translation is shown if there is one, otherwise the text from the map config. Dialogs
without a `name` are never translated. Names are chosen per installation, so these keys belong in
your installation's translation files (the ones shipped match the demo config,
`simpleMapAndLayersConfig.json`).

### Choosing how often a dialog shows at start

| Goal                          | Settings                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Show on every load            | `visibleAtStart: true`                                                                   |
| Show once per user            | `visibleAtStart: true`, `showOnlyOnce: true`                                             |
| Re-show when content changes  | `visibleAtStart: true`, `lastModified: "<new timestamp>"` — bump it when you edit `text` |
| Only on demand (button click) | `visibleAtStart: false`                                                                  |

## Opening a dialog from code

Each instance listens to global events named after its identifier, `infodialog.<name>` (or just `infodialog` if no `name` is set):

```js
app.globalObserver.publish("infodialog.help.showWindow");
app.globalObserver.publish("infodialog.help.closeWindow");
```

## Example configuration

A complete `tools` entry with two dialogs. The comments are for explanation only — **JSON does not allow comments**, so remove them before saving.

```jsonc
{
  "type": "infodialog",
  "index": 3,
  "options": [
    {
      // --- Identity ---
      "name": "help", // Unique key for this instance. Required when using multiple
      // dialogs, so each one gets its own localStorage entry.
      "title": "Visa hjälp", // Label on the Drawer/Widget/Control button.
      "description": "Öppna hjälp", // Subtitle on the Widget card and tooltip on the Control button.
      // Defaults to "Visa en informativ dialogruta" if omitted.

      // --- Placement ---
      "target": "right", // Where the button appears: "left" | "right" | "control" | "hidden".
      "icon": "helpcenter", // MUI icon ligature string, or omit to use the default InfoTwoTone icon.

      // --- Dialog content ---
      "headerText": "Hjälp", // Title shown at the top of the dialog. Omit to hide the title bar.
      "text": "# Välkommen\n\nMarkdown stöds fullt ut.", // The dialog body. Supports GitHub-flavoured Markdown.
      "allowDangerousHtml": false, // Set to true to allow raw HTML tags inside the Markdown body.
      "useLegacyNonMarkdownRenderer": false, // Set to true to bypass ReactMarkdown and use dangerouslySetInnerHTML.

      // --- Buttons ---
      "buttonText": "Stäng", // Label for the primary close button.
      "primaryButtonVariant": "contained", // MUI button variant for the close button. Omit for default ("text").
      "abortText": "Avbryt", // Optional: renders a second button that calls the onAbort callback.
      // Useful when InfoDialog is used programmatically with a callback.
      "prompt": false, // Set to true to add a text-input field inside the dialog.
      // The entered value is passed back via the onClose/onAbort callbacks.

      // --- Visibility ---
      "visibleAtStart": true, // Show the dialog automatically when the map loads.
      "showOnlyOnce": true, // Combined with visibleAtStart: suppress auto-show after the first time.
      // The flag is stored per-map in localStorage.
      // "lastModified": "2025-06-17T12:00:00Z", // ISO timestamp. When set, takes precedence over
      // showOnlyOnce: the dialog re-appears whenever this
      // timestamp is newer than when the user last saw it.
      "visibleForGroups": [], // Restrict to specific Active Directory groups. Empty = visible to all.
    },
    {
      // A second instance — announcements that re-appear whenever the content is updated.
      "name": "announcements",
      "title": "Visa nyheter",
      "target": "right",
      "icon": "announcement",
      "headerText": "Nyheter i Hajk",
      "text": "Release notes go here…",
      "allowDangerousHtml": true,
      "useLegacyNonMarkdownRenderer": false,
      "buttonText": "Ok, uppfattat!",
      "visibleAtStart": true,
      "lastModified": "2025-06-17T12:00:00Z", // Bump this timestamp to re-show the dialog to all users.
      "visibleForGroups": [],
    },
  ],
}
```
