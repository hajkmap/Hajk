# The InfoDialog plugin

InfoDialog renders one or more read-only dialog windows, each with a Markdown body. It is primarily used for help texts, announcements, or news — any content an admin wants to surface to the user on load or on demand.

## Example configuration

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
