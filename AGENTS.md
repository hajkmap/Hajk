# AI Agent Instructions for Hajk

Hajk is an open-source web GIS solution based on React, Material UI, and OpenLayers. This guide outlines key architectural patterns and workflows to help AI agents effectively contribute to the codebase.

## Project Architecture

This is a monorepo with three independent apps — no root-level workspace tooling (no Lerna, yarn workspaces, etc.). Each app manages its own dependencies.

### Core Components

- **Client UI** (`apps/client/`): Web map frontend — React 19, Vite 7, OpenLayers 10, MUI v9. Port 3000.
- **Admin UI** (`apps/admin/`): Configuration UI for maps/layers — React 16, Create React App 3 (legacy), MUI v4, OpenLayers 5. Port 3001.
- **Backend** (`apps/backend/`): REST API server — Node.js ≥22 (ESM), Express 5. Port 3002.

### Tech Stack at a Glance

|           | Backend                 | Client              | Admin                 |
| --------- | ----------------------- | ------------------- | --------------------- |
| Framework | Express 5               | React 19            | React 16 (legacy)     |
| Build     | ES modules (no bundler) | Vite 7              | Create React App 3    |
| UI        | —                       | MUI v9              | MUI v4 + Ant Design 4 |
| Maps      | —                       | OpenLayers 10       | OpenLayers 5          |
| Language  | JavaScript (ESM)        | TypeScript (strict) | JavaScript            |
| Linting   | ESLint 9 + Prettier     | ESLint 9 + Prettier | Prettier only         |

### Critical Configuration Files

- `apps/client/public/appConfig.json`: Client runtime config (set `mapserviceBase` to backend URL)
- `apps/admin/public/config.json`: Admin runtime config (all URLs point to backend API)
- `apps/backend/.env`: Backend environment config (copy from `.env.example`)
- `apps/backend/App_Data/`: Map and layer configuration JSON files

## Development Workflow

### Setup Flow

1. Start backend first:

   ```bash
   cd apps/backend
   npm install
   npm run dev   # Runs on http://localhost:3002
                 # API Explorer: http://localhost:3002/api-explorer/
   ```

2. Configure and start client:

   ```bash
   # Ensure apps/client/public/appConfig.json has mapserviceBase: "http://localhost:3002/api/v2"
   cd apps/client
   npm install
   npm run dev   # Runs on http://localhost:3000
   ```

3. Configure and start admin (optional):

   ```bash
   # Ensure apps/admin/public/config.json URLs point to http://localhost:3002/api/v2/...
   cd apps/admin
   npm install
   npm start     # Runs on http://localhost:3001
   ```

### Build Commands

```bash
# Backend: compile to dist/
cd apps/backend && npm run compile && npm start

# Client: build to build/
cd apps/client && npm run build

# Admin: build to build/ (requires Node OpenSSL legacy provider — handled by npm scripts)
cd apps/admin && npm run build
```

### Git Workflow Conventions

1. Always branch from `develop`
2. Branch naming: `feature/ISSUE_NUM-description` (e.g., `feature/1234-blue-button`)
3. Update CHANGELOG.md under "Unreleased" with format:

   ```markdown
   - area: Description. [#issue-number](https://github.com/hajkmap/Hajk/issues/issue-number)
   ```

## Code Patterns

### Design Principles

- Use Material UI components following Material Design principles
- Follow ESLint & Prettier configurations — run `npm run lint:fix` before committing (backend and client)
- Prefer functional components with hooks over class components (client)
- Keep components focused and modular — aim for under 200 lines
- Use TypeScript interfaces for prop types (client)

### Toggling Layers (Client)

Use `LayerControlModel` (`apps/client/src/models/LayerControlModel.js`) for layer
visibility changes etc instead of reinventing something new.

- **Why**: it is the only place with the complete rules (WMS group sublayers, exclusive
  backgrounds, exclusive tree groups, tree-group folders) and it keeps the LayerSwitcher,
  URL hash and other plugins in sync. See its doc header for examples of every method.
- **Exclusive groups are radio**: the model enforces `exclusive: true` tree groups —
  showing a direct child (including via sublayer activation) auto-hides its siblings,
  and `showGroup()` on an exclusive folder shows only the first child. Do not build
  parallel radio logic in plugins; route through the model.
- Access via `props.app.appModel.layerControl` (plugins) or
  `window.hajkPublicApi.layerControl` (embedders, console).
- In React, read state with the `useLayerVisibility`/`useLayerState` hooks rather than
  local `useState`, so the UI follows toggles made elsewhere.
- Ids are OpenLayers `name`s; a tree-group folder id or `"groupId:subId"` also works.
  Import `BACKGROUND_LAYER_IDS` instead of hard-coding `"-1"`…`"-4"`.

### Translations / i18n (Client)

The client uses `i18next` + `react-i18next`. Swedish (`sv`) is the source and fallback language.
Never hard-code user-facing text in client code.

- **Files**: one file per language (`sv.json`, `en.json`), all in the default namespace, grouped by
  area. Keys are `<area>.<camelCaseKey>`, e.g. `print.creatingImages`; shared texts go in `common.*`.
  - Core: `apps/client/src/i18n/<lng>.json` (`{ "common": {…}, "search": {…} }`).
  - Plugins: `src/plugins/<Plugin>/i18n/<lng>.json`, holding only the plugin's own area, the camelCased
    folder name (`{ "print": {…} }` for `Print`). This applies to core and third-party plugins alike.
  - A plugin may use its own area and core areas (`common.*`, `search.*`…), but never another
    plugin's area: move shared text to `common.*`, or give the plugin its own copy. `i18n:extract`
    fails on such borrowing (the borrowed key would land in the wrong file as `""`).
- **Usage**:
  - Function components: `const { t } = useTranslation(); t("print.creatingImages")` is preferred
    in new code, but `i18n.t()` (below) works too.
  - Class components and plain JS (models, OpenLayers styles…): `import i18n from "src/i18n"; i18n.t("…")`.
    The language never changes without a reload, so there's no need to wrap classes in `withTranslation()`.
  - Rich text: `<Trans i18nKey="…" components={{ strong: <strong /> }} />` with `"<strong>…</strong>"` in the value.
  - Module-level constants (option lists, tooltips…): make the text a getter,
    `get label() { return i18n.t("…"); }`, so it's translated when read rather than at import time.
  - Never compare against or store translated text. Keep ids/values separate from what's displayed.
- **Interpolation, never concatenation**: `t("search.hits", { count })` with
  `"hits": "{{count}} träffar"`, not `count + " träffar"`.
- **Plurals**: `_one`/`_other` suffixes, selected by `count`:
  `"hits_one": "{{count}} träff", "hits_other": "{{count}} träffar"` → `t("search.hits", { count: 3 })`.
- **Workflow** (in `apps/client`): add keys in code, run `npm run i18n:extract` (syncs the core and every
  plugin's `sv.json`/`en.json`, regenerates key types), fill in the Swedish and English values. `npm run i18n:lint` reports hard-coded
  JSX strings, `npm run i18n:sv-check` lists other code with å/ä/ö, `npm run i18n:status` shows coverage.
  Keys that only exist at runtime (e.g. `<plugin>.title`) must match `preservePatterns` in
  `i18next.config.ts`, or extract will remove them.
- **New languages**: create `src/i18n/<lng>.json` with `{}` and run `npm run i18n:extract`, which fills it
  (and every plugin's `<lng>.json`) with empty keys. Then add `<lng>` to `availableLanguages` in `appConfig.json`.
  Empty values fall back to Swedish. No code changes needed.
- **New plugins** (including third-party ones) create `src/plugins/<Plugin>/i18n/sv.json` with
  `{ "<area>": {} }` before running extract. Plugin files are merged in at startup, and core keys win on conflicts.
- **Language switching reloads the page**: `hajkPublicApi.setLanguage(lng)` saves the choice, writes `lang`
  to the URL and reloads. Computing text once (constructor state, models, OL styles) is therefore fine.
- **Admin-entered text is assumed to be Swedish.** Wherever the client has a default for an
  admin-configurable text, use `configText("<area>.<key>", options.x)` from `src/i18n` instead of
  `options.x || "Svensk standardtext"`. Under `sv` the admin text wins; under other languages the
  translated default wins. Plugin `title`/`description` are handled in `BaseWindowPlugin`
  (keys `<pluginType>.title`/`.description`, e.g. `layerSwitcher.title`).

### Common Integration Points

- Backend API paths:
  - Client UI consumes: `/api/v2/`
  - Admin UI consumes: `/api/v2/mapconfig/` for admin operations
  - ActiveDirectory auth (when enabled) affects `/config` vs `/mapconfig` responses
  - API Error Handling: The backend uses `handleStandardResponse` to standardize API outputs. Custom errors should extend `Error` and define a `statusCode` property to control the HTTP response.

### Noteworthy Quirks

- **Admin is legacy**: React 16, MUI v4, TypeScript 3.9, no ESLint. Avoid major refactors unless specifically tasked.
- **Admin OpenSSL**: Uses `--openssl-legacy-provider` flag due to old dependency versions — don't remove it.
- **Client prebuild**: `npm run dev` and `npm run build` run `prebuild.js` first, which injects git hash and build date into `.env.local`.
- **Backend is ESM**: Uses ES module syntax throughout — no CommonJS `require()`.

### Debugging Tips

- Backend debug mode: `npm run dev:debug` (Node.js inspector on default port)
- Client: Vite HMR — check browser console and Vite terminal output
- Admin: Create React App dev server
- Check `mapserviceBase` in `appConfig.json` when Client APIs aren't responding
- Use React DevTools for component inspection
- OpenLayers map debugging: `window.olMap.getLayers().getArray()`

## Key Files for Context

- `apps/client/src/` - Main client application code
- `apps/client/src/plugins/` - Tool plugins (28+)
- `apps/client/src/models/LayerControlModel.js` - Centralized layer visibility API (see above)
- `apps/admin/src/` - Admin interface code
- `apps/backend/server/` - Backend server implementation
- `apps/backend/App_Data/*.json` - Map configuration files

## Common Workflows

### Adding New Features

1. Determine if changes needed in client, admin, or backend (often all three)
2. Update appropriate configuration files
3. Follow Material Design patterns for UI components
4. Add appropriate tests
5. Update CHANGELOG.md
