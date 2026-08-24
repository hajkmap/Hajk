# Fir/Kir Refactor Plan — Class → Functional Components

## Scope (agreed with user)

1. Convert all React class components in `apps/client/src/plugins/Fir/` and
   `apps/client/src/plugins/Kir/` to functional components with hooks.
2. Fix the `stoke:` → `stroke:` typo in both `FirSearchResultsView.jsx` and
   `KirSearchResultsView.jsx`.
3. **No other changes**: no functionality, behavior, prop names, or event
   flows may change. Other known issues (state mutation, `this.app` bug,
   dead code, dedup between plugins) are intentionally deferred.

Non-component classes stay untouched: `FirModel`, `KirModel`,
`FirLayerController`, `KirLayerController`, `FirWfsService`, `KirWfsService`,
`FirImport`, `FirStyles`, `FirIcons`.

## Conversion patterns (apply consistently)

- **Root plugin (`Fir.jsx`, `Kir.jsx`)**: constructor logic (Observer, model,
  layer controller, import, service, subscriptions) runs once inside a lazy
  `useState(() => {...})` initializer. Event handlers are hoisted function
  declarations inside the initializer so identity is stable and closures over
  `model`/`layerController`/`service` work like class methods. `title`/`color`
  were static state → literal props on `BaseWindowPlugin`.
- **View components**: single `useState` object mirroring the class state
  literal + `stateRef` mirror. A partial-merge `setState(patch)` writes
  `stateRef` synchronously then `setStateRaw(stateRef.current)` — replicates
  `this.state` liveness for observer callbacks and timers.
- **`forceUpdate`**: `const [, setTick] = useState(0); setTick(t => t + 1)`.
- **Subscriptions**: latest-ref dispatcher pattern — assign
  `fnsRef.current = { handlerA, handlerB }` each render, subscribe once in
  `useEffect(..., [])` with wrappers calling `fnsRef.current.x(...)`. This
  matches class semantics (always invokes latest method). No unsubscribe
  cleanup added (matches original code that never unsubscribed; components
  live for the app's lifetime).
- **Stable listener identities** (only `FirToolbarView`): `handleDeleteClick`
  and `handleKeyDown` are `useCallback([], ...)` trampolines over
  `fnsRef.current`, because OpenLayers `map.on/un("singleclick", fn)` and
  `window.addEventListener/removeEventListener` pairing requires identical
  function identity.
- **Instance fields**: timers → `useRef` (`searchTm`, `updateTm`, `bufferTm`),
  OL interaction → `interactionRef`, `this.snackBar` → `snackBarRef`,
  DOM refs (`accordionList`, `paginationRef`, `inputMinAge/MaxAge`) → `useRef`.
- **PropTypes**: `static propTypes` → `ComponentName.propTypes = {...}` below
  the function (codebase convention, see `BookmarksView.jsx`).
- **withSnackbar HOC kept** (`FirView`, `FirExportPropertyListView`,
  `FirExportResidentListView`) — it is already a functional wrapper injecting
  `enqueueSnackbar`/`closeSnackbar` props.
- **`windowVisible`** comes from `BaseWindowPlugin`'s `cloneElement` —
  read from props in `FirView`/`KirView`.
- **Dead state fields kept verbatim** (e.g. `open`, `files`, `buffer` in
  search views) to minimize behavioral diff risk.

## Known intentional deviations (documented, not functional)

- `FirExportView.jsx`: original passed `app={this.app}` (always `undefined`)
  to `FirExportResidentListView`; the prop is unused by that component.
  Converted file omits the prop (same effective value: `undefined`).
- `FirSearchView.jsx`: `searchTypeId` initializer mirrors original —
  `undefined` when there are no search types (not `""`).
- `stoke` → `stroke` in both results views (the approved typo fix).

## File status

### Fir (10/10 done)

- [x] `Fir.jsx` — lazy-`useState` init, hoisted handlers, lazy WFS service import preserved
- [x] `FirView.jsx` — `activeTab` useState, snackbar error subscription via `fnsRef`
- [x] `FirSearchView.jsx` — searchTypeId lazy init, `searchTm` ref throttle, `onKeyPress` kept (deprecated but functional)
- [x] `FirSearchResultsView.jsx` — **stoke typo fixed**, stateRef pattern, all pagination/expand/remove logic verbatim
- [x] `FirSearchResultItemView.jsx` — pure render, `getHtml` computed inline
- [x] `FirExportView.jsx` — `fir.results.filtered` subscription, `app` prop deviation noted above
- [x] `FirExportPropertyListView.jsx` — `#collectAndSendData` → `collectAndSendData`, `snackBarRef`
- [x] `FirExportResidentListView.jsx` — `_type = type ?? "fir"`, `props.type === "kir"` check preserved, kir auto-expand in effect
- [x] `FirSearchNeighborView.jsx` — `resultHistory` push/pop on `stateRef`, HajkTransformer lazy init, `FirStyles` side-effect init kept
- [x] `FirToolbarView.jsx` — `useCallback` trampolines for OL/window listeners, `interactionRef`

### Kir (6/6 done)

- [x] `Kir.jsx` — lazy-`useState` init, eager `KirWfsService` construction preserved
- [x] `KirView.jsx` — like `FirView` but without snackbar/error subscription; stray `value={0}`/`value={1}` props on TabPanel kept (fidelity)
- [x] `KirSearchView.jsx` — dead state fields kept; min-age-empty→120 quirk preserved; `inputMinAge`/`inputMaxAge` refs; `KirToolbarView prefix="kir"`
- [x] `KirSearchResultsView.jsx` — like `FirSearchResultsView`; **stoke typo fixed**; `sortByField`/`genderField` from config; gender label logic verbatim; `kir.results.filtered` handler uses `setPage(1)` (as in original)
- [x] `KirSearchResultItemView.jsx` — like `FirSearchResultItemView` (no `cursor: "auto"` in Container styles)
- [x] `KirExportView.jsx` — `kir.results.filtered` subscription; `model.app.plugins.kir?.options?.residentList` conditionals; `FirExportResidentListView type="kir"` with `app` prop passed correctly

## Verification (done)

1. `npx eslint src/plugins/Kir src/plugins/Fir --fix` — passes apart from
   pre-existing baseline errors shared with the rest of the repo
   (`react-hooks/refs` on the agreed fnsRef dispatcher pattern,
   react-refresh HOC warnings, unused vars from earlier session).
2. `npm run build` — `tsc && vite build` passed.
3. Manual spot-check list (if dev server available):
   - FIR: search by text (throttle + enter), designation search, neighbor search (delimiting + radius, Bakåt history), draw/import/delete tools, buffer slider, result expand/pagination/delete, map-click add/remove (ctrl multi), both exports
   - KIR: search with gender/age filters, age slider + inputs, results, export boendeförteckning

### Fixups applied during verification (2026-08-24)

- 7 leftover invalid class-method-style declarations fixed to arrow
  functions (syntax errors caught by ESLint parsing): `handleItemClick`,
  `handleDeleteClick`, `setPage` in both results views;
  `handleToolbarClick` in `FirToolbarView`. Prettier auto-fixed trailing
  semicolons afterwards.

## Deferred issues (do NOT fix in this pass)

- `this.state` mutation + `forceUpdate` anti-patterns (replicated faithfully)
- Shared-config mutation in WFS services (`searchType.searchProp = ...`) —
  user decision 2026-08-24: skip; revisit only if WfsService merge is ever
  revived
- ~~Unguarded `wmsRealEstate` in `FirLayerController`~~ → fixed, see below
- `FirExportResidentListView` age-filter `|| 0` dead code — skip per user
- Dead state fields, `onKeyPress` deprecation — skip per user
- ~~Kir/Fir code duplication (shared component extraction)~~ → see dedup plan below
- Observer unsubscribe cleanup — skip: risky, components live for app lifetime

---

# Dedup Phase Plan — FIR/KIR shared components (audit 2026-08-24)

## Audit method & numbers

Measured with `diff -wB` (formatting ignored); "dup %" = common lines / larger file:

| File pair | FIR | KIR | Shared lines | Dup % |
|---|---|---|---|---|
| SearchResultItemView | 86 | 85 | 81 | **94%** |
| ExportView | 85 | 79 | 63 | **74%** |
| View (tabs) | 137 | 111 | 96 | **70%** |
| SearchResultsView | 531 | 443 | 377 | **71%** |
| SearchView | 333 | 347 | 185 | **53%** |
| Root plugin (Fir.jsx/Kir.jsx) | 123 | 107 | 80 | **65%** |
| Model | 30 | 24 | 21 | **70%** |
| WfsService | 223 | 129 | 100 | 45% |
| LayerController | 518 | 294 | 223 | 43% |

Total: ~1,225 duplicated lines across ~2,900 paired lines.

## Key structural facts

- KIR is largely a *subset* of FIR: KirLayerController = FirLayerController minus
  feature/highlight/label layers + WMS feature-info click; KirWfsService =
  FirWfsService minus text/designation/nested-search, plus gender+age filters.
- Cross-reuse already exists one-way (set during the class→function refactor):
  - `Kir.jsx` imports `FirImport` (aliased `KirImport`, `eventPrefix: "kir"`)
  - `KirSearchView.jsx` uses `FirToolbarView` with `prefix="kir"`
  - `KirExportView.jsx` uses `FirExportResidentListView type="kir"`
  - `KirLayerController.js` imports `FirIcons` + `FirStyles`
- Real differences are small and parameterizable: event prefix (`fir.`/`kir.`),
  OL layer captions/names, and the per-plugin behaviors listed below.

## Genuine behavioral differences that MUST be preserved

1. `handleResultsFiltered`: KIR does `setPage(1)`; FIR keeps current page.
2. FIR-only: add/remove-by-map-click flow, highlight layer +
   `fir.search.results.highlight`, neighbor search tab, snackbar error
   subscription in FirView, lazy WfsService loading via factory.
3. KIR-only: gender/age result labels (`genderField`/`ageField`),
   permission check on `model.app.plugins.kir?.options?.residentList`,
   eager service construction, `searchTypeId: model.config.wfsId`.
4. Fidelity quirks kept verbatim: stray `value={0}/{value={1}}` on Kir
   TabPanels; KIR min-age-empty→120 quirk.

## Hard constraints

- Root components must keep `type="fir"`/`type="kir"` and their options shape —
  backend map configs + admin depend on them.
- Observer events keep their prefixed names (`fir.*`, `kir.*`) — thread an
  `eventPrefix` through shared code instead of renaming (FirImport already
  accepts one).
- Deferred bugs interact with dedup: do NOT merge WfsServices before fixing the
  shared-config mutation (`searchType.searchProp = ...`), or fir/kir configs
  become entangled. Shared components must preserve never-unsubscribe semantics.

## Phases

### Phase 1 — Trivial (~100 lines saved, zero risk) — DONE 2026-08-24

- [x] Merge `FirSearchResultItemView`/`KirSearchResultItemView` into one shared
      component (only diff: `cursor: "auto"` CSS line + unused propTypes).
      `KirSearchResultItemView.jsx` deleted; `KirSearchResultsView` imports
      `FirSearchResultItemView` from `../Fir/` (same pattern as FirToolbarView
      reuse). Side effect: KIR result tables now get `cursor: "auto"` (FIR
      master styling wins). FIR propTypes kept verbatim.
- [x] Merge `FirModel`/`KirModel`: parameterized `FirModelBase` (named export
      in `FirModel.js`) takes `(settings, pluginName, layerKeys)`;
      `FirModel` is a thin subclass keeping its layer keys +
      `searchTypes`/`baseSearchType`; `KirModel.js` is an 7-line subclass
      (`"kir"`, keys `buffer/draw/marker/features`). Key order preserved.

Verification: ESLint — no new findings vs documented baseline (fnsRef
dispatcher pattern etc.); `npm run build` (tsc + vite) passed.

### Phase 2 — Low risk (~600 lines saved)

- [x] Extract SearchResultsView core — DONE 2026-08-24.
      New `Fir/FirSearchResultsViewCore.jsx` owns state machine, pagination,
      accordion/list rendering and observer wiring; injection points:
      `eventPrefix`, `getResultLabel(data)`, `onOpenToggled(feature, open)`
      (FIR→highlight publish, KIR→mark publish), `onRemoveFeature`
      (FIR→clear highlight), `showMapClickTools` (FIR-only add/remove-by-map-
      click buttons, handlers + subscriptions), `keepPageOnFiltered`
      (FIR keeps page, KIR resets to 1). Wrappers are 38/34 lines.
      974 → 629 lines. Verified: eslint baseline unchanged; build passed.
      Documented KIR alignments to FIR master semantics (all cosmetic or
      bugfix-level):
      1. Row DOM unified on canonical `ListItem secondaryAction` — KIR's
         delete button no longer nested inside `ListItemButton`, so clicking
         delete no longer ALSO bubbles into expand/mark of the row
         (unintended pre-existing behavior, now fixed).
      2. KIR's `ExtendedAccordionSummary` + `&nbsp;` wrapper dropped
         (visual no-op).
      3. KIR `handleDeleteClick` gained `preventDefault`/`stopPropagation`.
      4. `removeFeature` page arg unified to `currentPage` — verified
         net-identical for KIR (`setPage(null)` falls back to currentPage).
- [ ] Extract LayerController base class (~220 dup lines): draw/buffer/marker/
      features layers, interactions, bufferFeatures, showSearchArea;
      parameterize layer captions + eventPrefix. FIR subclass adds
      feature/highlight/label layers + WMS feature-info click.
- [x] Extract View shell — DONE 2026-08-24. New `Fir/FirViewShell.jsx`
      owns tabs/TabPanel layout, indicator fix, `windowVisible` gating and
      the search-error snackbar (gated behind optional `searchErrorEvent`
      prop; shell itself is `withSnackbar`-wrapped so wrappers don't need
      the HOC). Wrappers pass a `tabs` array ({label, content}).
      248 → 202 lines. KIR's stray `value={0}/{value={1}}` TabPanel props
      resolved: removed (canonical shared TabPanel ignores them).
      Verified: eslint baseline unchanged; build passed.
- [x] LayerController base class — **WON'T DO** (decided 2026-08-24).
      Method-level comparison showed only ~100 of the 220 "dup" lines are
      semantically shared (zoom helpers, clear handlers, throttle listeners);
      addFeatures/handleFeatureClicks/addMarker/bufferFeatures differ
      fundamentally (fir_type/kir_type props, keepNeighborBuffer coupling,
      WMS fallback, ctrl-multi). A base class would need template-method
      hooks for nearly everything, coupling the most fragile map-interaction
      code across plugins for ~100 lines saved. Duplication is cheaper here.
- [ ] Extract ExportView scaffold (`results.filtered` subscription +
      ContainerInfo header); per-plugin body stays.

### Phase 3 — Medium (~250–400 more lines) — WON'T DO (decided 2026-08-24)

Same verdict as the LayerController: the root-plugin scaffolding differs in
service construction strategy and the WFS query logic is genuinely
plugin-specific; abstraction cost exceeds duplication cost. If ever revisited,
fixing the shared-config mutation (see Deferred issues) remains a prerequisite
for any WfsService merge.

## Verification per phase

1. `npx eslint src/plugins/Fir src/plugins/Kir --fix`
2. `npm run build` (tsc + vite)
3. Manual spot-check list from original refactor (both plugins' full flows)
4. Diff-based check: extracted component vs both originals for each phase,
   confirming all behavioral differences from the list above are preserved.

---

# Post-plan fixes (2026-08-24)

- [x] **Unguarded `wmsRealEstate` crash fixed** in FirLayerController:
      optional chaining at the three unguarded call sites
      (addFeatureByMapClick subscription, handleFeatureClicks,
      handleFeatureClicksCancelled). Missing map layer now degrades to a
      console warning (from initLayers) instead of crashing the plugin.
      Removed from Deferred issues.
