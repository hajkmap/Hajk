# Consolidated document loading for DocumentHandler

When a map's DocumentHandler tool references N documents, the Client UI traditionally issues **N parallel requests** to `GET /api/v2/informative/load/[folder/]name` — one per document. With consolidated loading enabled, the client instead makes a **single request** whose response contains all documents for the active map.

The backend decides which documents to bundle: it reads the map config (`App_Data/<map>.json`) and returns every document referenced by the DocumentHandler tool's menu. The client only passes the map name.

## How it works

| Component | Behavior |
| --- | --- |
| Admin UI | New checkbox **"Ladda alla dokument i en request"** in the DocumentHandler menu editor. Toggles the `consolidateDocumentLoading` option (default `false`) in the tool's `options` in the map config. |
| Backend | New endpoint `GET /api/v2/informative/loadall/:map` returns all documents of the map in one response. Requires `consolidateDocumentLoading: true` on the map's documenthandler tool, otherwise it returns 404. |
| Client | When the flag is enabled, the DocumentHandler model requests `loadall` once. On any failure it logs a warning and **falls back** to the legacy per-document requests, so behavior degrades gracefully. |

### Response shape

```json
{
  "documents": [
    {
      "folder": "",
      "name": "exempeldokument",
      "document": { "title": "...", "chapters": [ ... ] }
    },
    {
      "folder": "regler",
      "name": "byregler",
      "document": null,
      "error": {
        "code": "DOCUMENT_NOT_FOUND",
        "message": "Document \"regler/byregler.json\" was not found."
      }
    }
  ]
}
```

- Documents referenced from multiple menu items are **deduplicated** by filepath (`folder` + `name`); each unique file is loaded once and the client matches that entry by folder+name.
- A document that fails to load **does not fail the whole request**: the entry comes back with `document: null` and an `error: { code, message }` object (`DOCUMENT_NOT_FOUND`, `INVALID_DOCUMENT_PATH` for folder/document names that would escape `App_Data/documents`, or `DOCUMENT_LOAD_ERROR`), and the client renders the rest while surfacing the failure for the broken one.
- The endpoint is public (registered before admin restriction), same as the legacy `GET /informative/load/:name`.
- Implemented for API **v2** only (v1 is legacy).

### Behavior matrix

| Scenario | Requests |
| --- | --- |
| Flag off (default) | N × `GET /informative/load/[folder/]name` (unchanged) |
| Flag on, all documents exist | 1 × `GET /informative/loadall/:map` |
| Flag on, one document missing | 1 × request → the missing entry is returned with a structured `error`; the rest render normally |
| Consolidated request fails entirely (network, 404) | Client falls back to N per-document requests |
| Multiple documenthandler tools in one map | First one wins |

## Backend: App_Data file cache

Reading up to thousands of documents from disk on every request is expensive, so `informative/loadall/:map` (and the legacy `/informative/load/:name`) are served through an in-memory per-file cache in [`apps/backend/server/apis/v2/services/informative/documentCache.js`](../../../../../apps/backend/server/apis/v2/services/informative/documentCache.js):

- **Cache key** is the absolute file path; a read is only served from cache if the entry's `mtimeMs` still matches the file's current mtime, so a stale entry can never be returned.
- **Correctness does not depend on the watcher**: every read `stat`s the file and compares mtime. The chokidar watcher frees memory for changed/deleted files and covers file systems with coarse mtime resolution (some network shares) where a rewrite may not change mtime.
- **Files that fail to parse** (e.g. mid-write) are *not* cached, so the next read retries instead of serving a poisoned entry.
- **Watch failures** (inotify limit, permission, etc.) degrade to mtime-verification-only mode with a single warning — the endpoint keeps working.

### Environment flags

| Flag | Default | Effect |
| --- | --- | --- |
| `INFORMATIVE_CACHE_POLLING` | `false` | When `true`, forces the chokidar watcher into polling mode (`usePolling: true`, 2s interval). Useful on Linux when inotify limits are too low (see below). |
| `INFORMATIVE_CACHE_PRELOAD` | `false` | When `true`, warms the cache at startup (before the server starts listening) by reading every `App_Data/<map>.json` and `App_Data/documents/**` file once. Trades a slower boot for a fast first request. Per-file errors are logged and skipped — preload never blocks startup. |

Both are documented in [`apps/backend/.env.example`](../../../../../apps/backend/.env.example).

On Linux, chokidar uses inotify. If watches fail (`ENOSPC` / “file watchers reached”), either set `INFORMATIVE_CACHE_POLLING=true` or raise `fs.inotify.max_user_watches` (e.g. to `65536`).

## Enabling the feature

1. In the Admin UI, open the map's DocumentHandler tool → menu editor and tick **"Ladda alla dokument i en request"**, then save. The flag round-trips through the existing `mapconfig` save/load API.
2. Restart the backend if you changed any `INFORMATIVE_CACHE_*` env flags.

## Verifying

```bash
cd apps/backend
npm run dev
# Enable "consolidateDocumentLoading" in App_Data/<map>.json, then:
curl http://localhost:3002/api/v2/informative/loadall/<map>
```

- With the flag off, the same call returns 404 ("Consolidated document loading is not enabled").
- In the Client UI's network tab, an enabled map makes exactly one `/informative/loadall/...` request; a disabled map makes the traditional N requests.
- Editing a document file on disk is reflected on the next request without a restart (mtime check, plus watcher invalidation); removing one yields a per-entry error in the response while the rest still render.
