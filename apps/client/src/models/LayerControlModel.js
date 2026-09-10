import { unByKey } from "ol/Observable";
import { setOLSubLayers } from "../utils/groupLayers";
import { BACKGROUND_LAYER_IDS } from "../constants/backgroundLayers";

/**
 * @summary Centralized, reusable API for toggling layers by id.
 *
 * @description The LayerSwitcher UI mirrors OpenLayers state via `propertychange`
 * listeners, so any code that calls `olLayer.setVisible()` / `setOLSubLayers()`
 * makes the corresponding checkbox update automatically. This model extracts the
 * complete toggling rules (normal, WMS group + sublayers, base/background and
 * LayerSwitcher tree-group folders) that previously lived only inside the
 * LayerSwitcher React context and the URL-hash handler, into one place that can
 * be consumed from anywhere (plugins, embedders via `window.hajkPublicApi`, and
 * React via the `useLayerVisibility`/`useLayerState` hooks).
 *
 * KNOWN LIMITATIONS / GAPS (please keep this list up to date):
 * 1. Base/background layers have only partial support. See `showLayer`/`hideLayer`
 *    `"base"` handling below (notably hide does not auto-select another bg).
 * 2. The built-in "special" background layers (white `"-1"`, black `"-2"`, OSM
 *    `"-3"`) ARE real OpenLayers layers and CAN be toggled through this API (see
 *    `showBackgroundWhite`/`showBackgroundBlack`/`showBackgroundOSM` for named
 *    shortcuts). The white/black ones render via
 *    the `div#map` background color rather than tiles; that repaint is performed
 *    by the BackgroundSwitcher when it observes the visibility change.
 * 3. This model lives for the whole app lifetime (instantiated once via
 *    `AppModel.addLayerControl()`), so the layer-collection `add`/`remove`
 *    listeners registered in the constructor are intentionally never torn down.
 *    There is no `dispose()`. If this ever becomes a per-map/disposable object,
 *    add teardown for those listeners.
 */

const findGroupInConfig = (groups, groupId) => {
  if (!Array.isArray(groups)) {
    return null;
  }
  for (const group of groups) {
    if (!group) {
      continue;
    }
    if (group.id === groupId) {
      return group;
    }
    const found = findGroupInConfig(group.groups, groupId);
    if (found) {
      return found;
    }
  }
  return null;
};

const collectLayerIdsFromGroup = (group) => {
  if (!group) {
    return [];
  }
  const ids = [];
  (group.layers ?? []).forEach((l) => {
    if (l?.id !== undefined) {
      ids.push(l.id);
    }
  });
  (group.groups ?? []).forEach((g) => {
    ids.push(...collectLayerIdsFromGroup(g));
  });
  return ids;
};

const arraysEqual = (a = [], b = []) => {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

/**
 * ============================================================================
 * EXAMPLES — all public methods (assume `const lc = appModel.layerControl` or
 * `window.hajkPublicApi.layerControl`). A layer id === OpenLayers `name`.
 * ============================================================================
 *
 * // Lookup
 * lc.getLayer("id");                               // -> ol layer | undefined
 *
 * // Single layer (normal, WMS group, or base/background).
 * // show/hide/toggle/set/...IsVisible accept a layer id, a tree-group folder
 * // id, or a "groupId:subId" sublayer address.
 * lc.showLayer("id");
 * lc.showLayer("id", { subLayers: ["a", "b"] });   // WMS group: show a subset
 * lc.showLayer("id", { useLabelStyle: true });     // layers with a label style
 * lc.hideLayer("id");
 * lc.toggleLayer("id");
 * lc.setLayerVisibility("id", true);               // boolean form of show/hide
 * lc.layerIsVisible("id");                         // -> boolean
 * lc.showBackground("baseId");                     // any base layer (warns if not base)
 * lc.showBackgroundWhite();                        // built-in white background
 * lc.showBackgroundBlack();                        // built-in black background
 * lc.showBackgroundOSM();                          // built-in OSM background
 *
 * // Sublayers of a WMS group layer (the nested checkboxes)
 * lc.showSubLayer("groupId", "subId");
 * lc.hideSubLayer("groupId", "subId");
 * lc.toggleSubLayer("groupId", "subId");
 * lc.setSubLayerVisibility("groupId", "subId", true);
 * lc.setSubLayers("groupId", ["subA", "subB"]);    // exact visible set
 * lc.subLayerIsVisible("groupId", "subId");        // -> boolean
 * // ...or via the single-layer API: lc.toggleLayer("groupId:subId")
 *
 * // LayerSwitcher tree-group folders (operate on every leaf layer)
 * lc.showGroup("folderId");
 * lc.hideGroup("folderId");
 * lc.toggleGroup("folderId");
 * lc.setGroupVisibility("folderId", true);
 * lc.groupIsVisible("folderId");                   // -> boolean (all leaves visible)
 *
 * // Reactive primitives (back the useLayerVisibility / useLayerState hooks)
 * const off = lc.subscribe("id", () => {});        // -> unsubscribe fn
 * lc.getVisibilitySnapshot("id");                  // -> boolean (stable)
 * lc.getLayerStateSnapshot("id");                  // -> cached state object
 */
class LayerControlModel {
  #map;
  #globalObserver;
  #layerSwitcherConfig;
  // Cache for getLayerStateSnapshot: a stable object reference per layer id, so
  // React's useSyncExternalStore does not over-render or loop. We only replace
  // the cached reference when one of the tracked fields actually changes.
  #stateCache;
  // O(1) id -> OpenLayers layer index. With 700+ layers a naive
  // `map.getAllLayers().find()` on every lookup (run from getSnapshot on every
  // React render) would be O(n) plus a fresh array allocation each call. The
  // index keeps lookups constant-time with no allocation and makes misses
  // (e.g. tree-group folder ids) O(1) too. Kept in sync via layer add/remove.
  #layerIndex;

  constructor({ map, globalObserver, layerSwitcherConfig }) {
    this.#map = map;
    this.#globalObserver = globalObserver;
    this.#layerSwitcherConfig = layerSwitcherConfig;
    this.#stateCache = new Map();

    this.#layerIndex = new Map();
    this.#map.getAllLayers().forEach((l) => this.#indexLayer(l));

    // Keep the index fresh if layers are added/removed at runtime. Hajk adds its
    // named layers flat to the map root, so the top-level collection covers them.
    const collection = this.#map.getLayers();
    collection.on("add", (e) => this.#indexLayer(e.element));
    collection.on("remove", (e) => {
      const name = e.element?.get("name");
      if (name !== undefined) {
        this.#layerIndex.delete(name);
      }
    });
  }

  #indexLayer(layer) {
    const name = layer?.get("name");
    if (name !== undefined) {
      this.#layerIndex.set(name, layer);
    }
  }

  /**
   * Canonical layer lookup: layer id === OpenLayers `name` property.
   * @param {string} id
   * @returns {import("ol/layer/Layer").default | undefined}
   */
  getLayer(id) {
    return this.#layerIndex.get(id);
  }

  /**
   * Parse a composite `"groupId:subLayerId"` address so that the top-level
   * `showLayer`/`hideLayer`/`toggleLayer`/`layerIsVisible` API can target a
   * single sublayer of a WMS group layer (e.g.
   * `toggleLayer("70d0ft:trafiksamordning_linje_paborjad")`).
   *
   * Returns the parts only when this really looks like a sublayer address:
   * the whole id is NOT itself a real layer (so real layer names that happen to
   * contain a ":" keep working unchanged) and the part before the first ":"
   * resolves to a WMS group layer. Otherwise returns `null` and the id is
   * treated as an ordinary layer / tree-group folder id.
   * @param {string} id
   * @returns {{ groupId: string, subLayerId: string } | null}
   */
  #resolveSubLayerTarget(id) {
    if (typeof id !== "string") {
      return null;
    }
    const idx = id.indexOf(":");
    if (idx === -1) {
      return null;
    }
    // A real layer whose name happens to contain ":" takes precedence.
    if (this.getLayer(id) !== undefined) {
      return null;
    }
    const groupId = id.slice(0, idx);
    const subLayerId = id.slice(idx + 1);
    if (!groupId || !subLayerId) {
      return null;
    }
    const group = this.getLayer(groupId);
    if (group === undefined || group.get("layerType") !== "group") {
      return null;
    }
    return { groupId, subLayerId };
  }

  /**
   * Resolve the leaf layer ids of a LayerSwitcher tree-group folder. The config
   * tree can reference layers that were never added to OpenLayers (unsupported
   * type or missing/broken `layersConfig` — the LayerSwitcher drops these too),
   * so we filter down to ids that actually resolve to an OL layer. Returns `[]`
   * (not `null`) for a folder whose leaves are all missing, so callers can still
   * tell it apart from a non-folder id.
   * @param {string} id
   * @returns {string[] | null} The existing leaf ids, or `null` if `id` is not a
   * folder.
   */
  #getGroupLayerIds(id) {
    const group = findGroupInConfig(
      this.#layerSwitcherConfig?.options?.groups,
      id
    );
    if (!group) {
      return null;
    }
    return collectLayerIdsFromGroup(group).filter(
      (leafId) => this.getLayer(leafId) !== undefined
    );
  }

  /**
   * @param {string} id A layer id, a LayerSwitcher tree-group folder id, or a
   * `"groupId:subLayerId"` sublayer address.
   * @returns {boolean} For a layer: whether it is visible. For a group folder:
   * whether all of its leaf layers are visible. For a sublayer address: whether
   * that sublayer is visible.
   */
  layerIsVisible(id) {
    const sub = this.#resolveSubLayerTarget(id);
    if (sub) {
      return this.subLayerIsVisible(sub.groupId, sub.subLayerId);
    }

    const olLayer = this.getLayer(id);
    if (olLayer === undefined) {
      // Not a real layer — maybe a LayerSwitcher tree-group folder.
      if (this.#getGroupLayerIds(id) !== null) {
        return this.groupIsVisible(id);
      }
      return false;
    }
    return olLayer.get("visible") === true;
  }

  /**
   * Show a layer by id. Dispatches on the layer's `layerType`. If `id` is a
   * LayerSwitcher tree-group folder instead of a real layer, this delegates to
   * `showGroup(id)`. A `"groupId:subLayerId"` address delegates to
   * `showSubLayer(groupId, subLayerId)`.
   * @param {string} id
   * @param {{ subLayers?: string[], useLabelStyle?: boolean }} [options]
   */
  showLayer(id, { subLayers, useLabelStyle } = {}) {
    const sub = this.#resolveSubLayerTarget(id);
    if (sub) {
      this.showSubLayer(sub.groupId, sub.subLayerId);
      return;
    }

    const olLayer = this.getLayer(id);
    if (olLayer === undefined) {
      // Not a real layer — maybe it's a LayerSwitcher tree-group folder.
      if (this.#getGroupLayerIds(id) !== null) {
        this.showGroup(id);
        return;
      }
      console.warn(
        `Attempt to show layer with id ${id} failed: layer not found in current map`
      );
      return;
    }

    switch (olLayer.get("layerType")) {
      case "group": {
        // WMS group layers must go through setOLSubLayers so that the WMS
        // LAYERS/STYLES/CQL_FILTER params are updated correctly.
        // GOTCHA: passing `subLayers: []` here will actually HIDE the layer,
        // because setOLSubLayers([]) calls setVisible(false). This is consistent
        // with "show exactly these sublayers (= none)", but is surprising for a
        // method named showLayer — use hideLayer(id) to hide instead.
        const subs = subLayers ?? olLayer.get("allSubLayers") ?? [];
        olLayer.set("subLayers", subs);
        setOLSubLayers(olLayer, subs);
        break;
      }
      case "base": {
        // Base layers are exclusive (radio behavior).
        this.#map
          .getAllLayers()
          .filter((l) => l.get("layerType") === "base" && l !== olLayer)
          .forEach((l) => l.setVisible(false));
        olLayer.setVisible(true);
        // BackgroundSwitcher / BackgroundLayer sync via this globalObserver
        // event, not just change:visible.
        this.#globalObserver?.publish(
          "layerswitcher.backgroundLayerChanged",
          id
        );
        // The white/black `div#map` background repaint is handled by the
        // BackgroundSwitcher, which observes the layer's visibility change
        // (`core.layerVisibilityChanged`, published by the special background
        // layers) and repaints accordingly — so toggling a base layer through
        // this API gets the same visual result as a click in the UI.
        break;
      }
      case "system": {
        console.warn(
          `Refusing to show layer with id ${id}: system layers are managed by their plugin.`
        );
        break;
      }
      default: {
        olLayer.setVisible(true);
        if (useLabelStyle !== undefined && olLayer.get("hasLabelStyle")) {
          olLayer.set("useLabelStyle", !!useLabelStyle);
        }
      }
    }
  }

  /**
   * Hide a layer by id. Dispatches on the layer's `layerType`. If `id` is a
   * LayerSwitcher tree-group folder instead of a real layer, this delegates to
   * `hideGroup(id)`. A `"groupId:subLayerId"` address delegates to
   * `hideSubLayer(groupId, subLayerId)`.
   * @param {string} id
   */
  hideLayer(id) {
    const sub = this.#resolveSubLayerTarget(id);
    if (sub) {
      this.hideSubLayer(sub.groupId, sub.subLayerId);
      return;
    }

    const olLayer = this.getLayer(id);
    if (olLayer === undefined) {
      // Not a real layer — maybe it's a LayerSwitcher tree-group folder.
      if (this.#getGroupLayerIds(id) !== null) {
        this.hideGroup(id);
        return;
      }
      console.warn(
        `Attempt to hide layer with id ${id} failed: layer not found in current map`
      );
      return;
    }

    switch (olLayer.get("layerType")) {
      case "group": {
        olLayer.set("subLayers", []);
        setOLSubLayers(olLayer, []);
        break;
      }
      case "system": {
        console.warn(
          `Refusing to hide layer with id ${id}: system layers are managed by their plugin.`
        );
        break;
      }
      // "base" and default ("layer") share the same hide behavior.
      // ASYMMETRY/GAP for "base": unlike showLayer, hiding a base layer does NOT
      // activate another background and does NOT publish
      // "layerswitcher.backgroundLayerChanged". Since base layers are exclusive
      // (radio), this can leave the map with no background and the
      // BackgroundSwitcher radio out of sync. Hiding a base layer is generally
      // not a meaningful operation — prefer showLayer(otherBaseId) to switch.
      default: {
        olLayer.setVisible(false);
      }
    }
  }

  /**
   * Toggle a layer's visibility by id. Also accepts a LayerSwitcher tree-group
   * folder id, or a `"groupId:subLayerId"` sublayer address (e.g.
   * `toggleLayer("70d0ft:trafiksamordning_linje_paborjad")`) — these route
   * through `layerIsVisible` + `showLayer`/`hideLayer` automatically.
   * @param {string} id
   * @param {{ subLayers?: string[], useLabelStyle?: boolean }} [options]
   */
  toggleLayer(id, options) {
    if (this.layerIsVisible(id)) {
      this.hideLayer(id);
    } else {
      this.showLayer(id, options);
    }
  }

  /**
   * Set a layer's visibility by id (the boolean form of `showLayer`/`hideLayer`).
   * Accepts the same ids as `showLayer` (layer, tree-group folder, or
   * `"groupId:subLayerId"` sublayer address).
   * @param {string} id
   * @param {boolean} visible
   * @param {{ subLayers?: string[], useLabelStyle?: boolean }} [options] Forwarded
   * to `showLayer` when `visible` is true.
   */
  setLayerVisibility(id, visible, options) {
    if (visible) {
      this.showLayer(id, options);
    } else {
      this.hideLayer(id);
    }
  }

  /**
   * Show a background (base) layer by id, e.g. a configured server background.
   * Warns and does nothing if the id is not a `layerType === "base"` layer, so
   * callers can't accidentally route a normal/group layer through here. For the
   * three built-in special backgrounds there are also the named shortcuts
   * `showBackgroundWhite`/`showBackgroundBlack`/`showBackgroundOSM`.
   * @param {string} id
   */
  showBackground(id) {
    const olLayer = this.getLayer(id);
    if (olLayer === undefined) {
      console.warn(
        `Attempt to show background with id ${id} failed: layer not found in current map`
      );
      return;
    }
    if (olLayer.get("layerType") !== "base") {
      console.warn(
        `Attempt to show background with id ${id} failed: layer is not a background (layerType "${olLayer.get(
          "layerType"
        )}"). Use showLayer() for non-background layers.`
      );
      return;
    }
    this.showLayer(id);
  }

  /**
   * Convenience shortcut for the built-in white background layer, so callers
   * don't have to know the magic `-1` id. Delegates to `showLayer`, so the
   * exclusive base-layer behavior, the LayerSwitcher radio sync and the
   * `div#map` background repaint all apply.
   */
  showBackgroundWhite() {
    this.showLayer(BACKGROUND_LAYER_IDS.WHITE);
  }

  /**
   * Convenience shortcut for the built-in black background layer (magic id
   * `-2`). See `showBackgroundWhite` for details.
   */
  showBackgroundBlack() {
    this.showLayer(BACKGROUND_LAYER_IDS.BLACK);
  }

  /**
   * Convenience shortcut for the built-in OpenStreetMap background layer (magic
   * id `-3`). See `showBackgroundWhite` for details.
   */
  showBackgroundOSM() {
    this.showLayer(BACKGROUND_LAYER_IDS.OSM);
  }

  /**
   * Set the exact set of visible sublayers for a WMS group layer. The provided
   * ids are sorted to match the configured `allSubLayers` order.
   * @param {string} id
   * @param {string[]} subLayerIds
   */
  setSubLayers(id, subLayerIds = []) {
    const olLayer = this.getLayer(id);
    if (olLayer === undefined) {
      console.warn(
        `Attempt to set sublayers for ${id} failed: layer not found in current map`
      );
      return;
    }
    const allSubLayers = olLayer.get("allSubLayers") ?? [];
    const wanted = new Set(subLayerIds);
    // Keep the order consistent regardless of toggle order.
    const sorted = allSubLayers.filter((l) => wanted.has(l));
    olLayer.set("subLayers", sorted);
    setOLSubLayers(olLayer, sorted);
  }

  /**
   * Show a single sublayer of a WMS group layer.
   * @param {string} id
   * @param {string} subLayerId
   */
  showSubLayer(id, subLayerId) {
    const olLayer = this.getLayer(id);
    if (olLayer === undefined) {
      console.warn(
        `Attempt to show sublayer ${subLayerId} of ${id} failed: layer not found in current map`
      );
      return;
    }
    const current = olLayer.get("visible")
      ? new Set(olLayer.get("subLayers"))
      : new Set();
    current.add(subLayerId);
    this.setSubLayers(id, [...current]);
  }

  /**
   * Hide a single sublayer of a WMS group layer.
   * @param {string} id
   * @param {string} subLayerId
   */
  hideSubLayer(id, subLayerId) {
    const olLayer = this.getLayer(id);
    if (olLayer === undefined) {
      console.warn(
        `Attempt to hide sublayer ${subLayerId} of ${id} failed: layer not found in current map`
      );
      return;
    }
    const current = olLayer.get("visible")
      ? new Set(olLayer.get("subLayers"))
      : new Set();
    current.delete(subLayerId);
    this.setSubLayers(id, [...current]);
  }

  /**
   * Whether a single sublayer of a WMS group layer is currently visible. A
   * sublayer counts as visible only when the parent group layer itself is
   * visible and the sublayer is part of its current `subLayers` selection.
   * @param {string} id The parent WMS group layer id.
   * @param {string} subLayerId
   * @returns {boolean}
   */
  subLayerIsVisible(id, subLayerId) {
    const olLayer = this.getLayer(id);
    if (olLayer === undefined || !olLayer.get("visible")) {
      return false;
    }
    return (olLayer.get("subLayers") ?? []).includes(subLayerId);
  }

  /**
   * Toggle a single sublayer of a WMS group layer. This is the sublayer
   * equivalent of `toggleLayer`: use it for the nested checkboxes ("Påbörjad"
   * etc.) under a group layer. Note that a sublayer is NOT a standalone
   * OpenLayers layer, so `toggleLayer(subLayerId)` will not work — the sublayer
   * must always be addressed via its parent group layer id.
   * @param {string} id The parent WMS group layer id.
   * @param {string} subLayerId
   */
  toggleSubLayer(id, subLayerId) {
    if (this.subLayerIsVisible(id, subLayerId)) {
      this.hideSubLayer(id, subLayerId);
    } else {
      this.showSubLayer(id, subLayerId);
    }
  }

  /**
   * Set a single sublayer's visibility (the boolean form of
   * `showSubLayer`/`hideSubLayer`).
   * @param {string} id The parent WMS group layer id.
   * @param {string} subLayerId
   * @param {boolean} visible
   */
  setSubLayerVisibility(id, subLayerId, visible) {
    if (visible) {
      this.showSubLayer(id, subLayerId);
    } else {
      this.hideSubLayer(id, subLayerId);
    }
  }

  /**
   * Whether a LayerSwitcher tree-group folder is fully visible, i.e. every one
   * of its leaf layers is visible. (Equivalent to `layerIsVisible(folderId)`.)
   * @param {string} groupId
   * @returns {boolean}
   */
  groupIsVisible(groupId) {
    const ids = this.#getGroupLayerIds(groupId);
    if (ids === null || ids.length === 0) {
      return false;
    }
    return ids.every((id) => this.layerIsVisible(id));
  }

  /**
   * Show every leaf layer under a LayerSwitcher tree-group folder.
   * @param {string} groupId
   */
  showGroup(groupId) {
    this.setGroupVisibility(groupId, true);
  }

  /**
   * Hide every leaf layer under a LayerSwitcher tree-group folder.
   * @param {string} groupId
   */
  hideGroup(groupId) {
    this.setGroupVisibility(groupId, false);
  }

  /**
   * Toggle a LayerSwitcher tree-group folder: hide every leaf layer if the
   * folder is fully visible, otherwise show every leaf layer.
   * @param {string} groupId
   */
  toggleGroup(groupId) {
    this.setGroupVisibility(groupId, !this.groupIsVisible(groupId));
  }

  /**
   * Set visibility for every leaf layer under a LayerSwitcher tree-group folder.
   * @param {string} groupId
   * @param {boolean} visible
   */
  setGroupVisibility(groupId, visible) {
    const ids = this.#getGroupLayerIds(groupId);

    if (ids === null || ids.length === 0) {
      console.warn(
        `Attempt to set group visibility for ${groupId} failed: no layers found for group`
      );
      return;
    }

    ids.forEach((id) => {
      const olLayer = this.getLayer(id);
      if (olLayer === undefined) {
        console.warn(
          `Attempt to set group visibility for layer ${id} failed: layer not found in current map`
        );
        return;
      }

      if (visible && olLayer.get("layerType") === "group") {
        // Re-show workaround for WMS group layers inside a folder, so they
        // render correctly when the whole folder is toggled on.
        const allSubLayers = olLayer.get("allSubLayers") ?? [];
        if (olLayer.get("visible")) {
          olLayer.setVisible(false);
        }
        olLayer.set("subLayers", allSubLayers);
        setOLSubLayers(olLayer, allSubLayers);
        setTimeout(() => {
          olLayer.setVisible(true);
        }, 0);
      } else if (visible) {
        this.showLayer(id);
      } else {
        this.hideLayer(id);
      }
    });
  }

  /**
   * Attach the appropriate OL listeners to a single layer and return their keys.
   * @param {import("ol/layer/Layer").default} olLayer
   * @param {() => void} callback
   * @returns {import("ol/events").EventsKey[]}
   */
  #listenToLayer(olLayer, callback) {
    const keys = [olLayer.on("change:visible", () => callback())];
    if (olLayer.get("layerType") === "group") {
      // Group layers also change their partial/semi-checked state via subLayers.
      keys.push(olLayer.on("change:subLayers", () => callback()));
    }
    return keys;
  }

  /**
   * Subscribe to visibility changes for a layer id, a LayerSwitcher tree-group
   * folder id (in which case it listens to every leaf layer), or a
   * `"groupId:subLayerId"` sublayer address (in which case it listens to the
   * parent group layer). Returns an unsubscribe function. Backs React's
   * useSyncExternalStore.
   * @param {string} id
   * @param {() => void} callback
   * @returns {() => void} unsubscribe
   */
  subscribe(id, callback) {
    const sub = this.#resolveSubLayerTarget(id);
    if (sub) {
      // A sublayer's state lives on its parent group layer (change:subLayers /
      // change:visible), so listen there.
      const group = this.getLayer(sub.groupId);
      const keys = group ? this.#listenToLayer(group, callback) : [];
      return () => unByKey(keys);
    }

    const olLayer = this.getLayer(id);

    if (olLayer === undefined) {
      // Not a real layer — maybe it's a tree-group folder. Listen to all leaves.
      const leafIds = this.#getGroupLayerIds(id);
      if (leafIds !== null) {
        const keys = leafIds.flatMap((leafId) => {
          const leaf = this.getLayer(leafId);
          return leaf ? this.#listenToLayer(leaf, callback) : [];
        });
        return () => unByKey(keys);
      }

      // The layer may not exist yet; fall back to the globalObserver event
      // until it does.
      // GAP: this fallback only reacts to visibility (`core.layerVisibilityChanged`),
      // NOT to sublayer changes. So if a WMS group layer is added AFTER this
      // subscription is set up, its partial/semi-checked (subLayers) changes
      // won't trigger a re-render. In practice all named layers are added during
      // AppModel.addLayers() — before any React subscription — so this path is
      // effectively never hit; revisit if layers start being added lazily.
      const handle = this.#globalObserver?.subscribe(
        "core.layerVisibilityChanged",
        (e) => {
          if (e?.target?.get?.("name") === id) {
            callback();
          }
        }
      );
      return () => handle?.unsubscribe?.();
    }

    const keys = this.#listenToLayer(olLayer, callback);
    return () => unByKey(keys);
  }

  /**
   * Boolean visibility snapshot. Primitives are always referentially stable, so
   * this is safe for useSyncExternalStore.
   * @param {string} id
   * @returns {boolean}
   */
  getVisibilitySnapshot(id) {
    return this.layerIsVisible(id);
  }

  /**
   * Richer, cached object snapshot. Returns a stable reference that only changes
   * when a tracked field actually changes, so it is safe for useSyncExternalStore.
   *
   * For a layer id:
   *   `{ visible: boolean, visibleSubLayers: string[], opacity: number }`
   * For a LayerSwitcher tree-group folder id:
   *   `{ visible: boolean, state: "all"|"some"|"none", visibleLayers: string[] }`
   *   where `visible` is true only when every leaf layer is visible.
   * For a `"groupId:subLayerId"` sublayer address:
   *   `{ visible: boolean, visibleSubLayers: string[], opacity: number }`
   *   where `visible` reflects that one sublayer and the other fields reflect
   *   the parent group layer.
   * @param {string} id
   * @returns {object}
   */
  getLayerStateSnapshot(id) {
    const sub = this.#resolveSubLayerTarget(id);
    if (sub) {
      return this.#getSubLayerStateSnapshot(id, sub.groupId, sub.subLayerId);
    }

    const olLayer = this.getLayer(id);

    if (olLayer === undefined) {
      const leafIds = this.#getGroupLayerIds(id);
      if (leafIds !== null) {
        return this.#getGroupStateSnapshot(id, leafIds);
      }
    }

    const next = {
      visible: olLayer?.get("visible") === true,
      visibleSubLayers: olLayer?.get("visible")
        ? (olLayer.get("subLayers") ?? [])
        : [],
      opacity: olLayer?.get("opacity"),
    };

    const prev = this.#stateCache.get(id);
    if (
      prev &&
      prev.visible === next.visible &&
      prev.opacity === next.opacity &&
      arraysEqual(prev.visibleSubLayers, next.visibleSubLayers)
    ) {
      return prev;
    }

    this.#stateCache.set(id, next);
    return next;
  }

  /**
   * Cached snapshot for a single sublayer of a WMS group layer.
   * @param {string} cacheId The composite id used as the cache key.
   * @param {string} groupId
   * @param {string} subLayerId
   * @returns {{ visible: boolean, visibleSubLayers: string[], opacity: number }}
   */
  #getSubLayerStateSnapshot(cacheId, groupId, subLayerId) {
    const group = this.getLayer(groupId);
    const next = {
      visible: this.subLayerIsVisible(groupId, subLayerId),
      visibleSubLayers: group?.get("visible")
        ? (group.get("subLayers") ?? [])
        : [],
      opacity: group?.get("opacity"),
    };

    const prev = this.#stateCache.get(cacheId);
    if (
      prev &&
      prev.visible === next.visible &&
      prev.opacity === next.opacity &&
      arraysEqual(prev.visibleSubLayers, next.visibleSubLayers)
    ) {
      return prev;
    }

    this.#stateCache.set(cacheId, next);
    return next;
  }

  /**
   * Cached aggregated snapshot for a tree-group folder.
   * @param {string} id
   * @param {string[]} leafIds
   * @returns {{ visible: boolean, state: "all"|"some"|"none", visibleLayers: string[] }}
   */
  #getGroupStateSnapshot(id, leafIds) {
    const visibleLayers = leafIds.filter((leafId) =>
      this.layerIsVisible(leafId)
    );
    const count = visibleLayers.length;
    const total = leafIds.length;
    const state = count === 0 ? "none" : count === total ? "all" : "some";

    const next = {
      visible: total > 0 && count === total,
      state,
      visibleLayers,
    };

    const prev = this.#stateCache.get(id);
    if (
      prev &&
      prev.visible === next.visible &&
      prev.state === next.state &&
      arraysEqual(prev.visibleLayers, next.visibleLayers)
    ) {
      return prev;
    }

    this.#stateCache.set(id, next);
    return next;
  }
}

export default LayerControlModel;
