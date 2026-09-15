# The Announcement component

Announcement renders application-wide notifications as snackbars (toast messages) using [Notistack](https://notistack.com). Each message supports Markdown and HTML, can be scoped to specific maps, and can be limited to a date/time window.

Unlike the [InfoDialog plugin](../../plugins/InfoDialog/README.md), which is configured per map in the map config file, Announcement is configured once for the entire application in `apps/client/public/appConfig.json`.

## Example configuration

```jsonc
// appConfig.json
{
  "announcements": [
    {
      "id": 1,              // Required. Must be a unique numeric ID across all entries.
                            // Used to track which messages the user has already seen.
      "active": true,       // Required. Set to false to disable without deleting the entry.
      "text": "Hello from **Hajk**!", // Required. The message body. Supports Markdown and HTML.

      "type": "info",       // Notistack variant: "default" | "info" | "warning" | "success" | "error".
      "timeout": 5000,      // Milliseconds before auto-dismiss. Set to null (or omit) for a
                            // persistent snackbar with a manual close button.

      "maps": ["map_1", "map_2"], // Array of map config names to show this on. Omit the key (or use
                                  // the string "all") to show on every map.

      "showOnlyOnce": true, // If true, the message is suppressed after the first view.
                            // NOTE: this is stored globally in localStorage under the key
                            // "shownAnnouncementIds" (not per-map, unlike InfoDialog).

      "startTime": "2025-01-01",  // Optional. Earliest date/time to show this message.
      "stopTime": "2025-12-31",   // Optional. Date/time after which the message is hidden.
                                  // Both fields accept any string parsable by Date.parse().
                                  // Either can be omitted independently.
    },
    {
      // A persistent warning shown on all maps, with no date restrictions.
      "id": 2,
      "active": true,
      "text": "Scheduled maintenance on **Saturday 09:00–11:00**.",
      "type": "warning",
      "timeout": null,
      "startTime": "2025-05-24",
      "stopTime": "2025-05-25",
    },
  ],
}
```
