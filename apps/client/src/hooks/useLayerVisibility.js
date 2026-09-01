import { useSyncExternalStore, useCallback } from "react";

/**
 * Subscribe to a layer's visibility and re-render automatically whenever it
 * changes, no matter who toggled it (LayerSwitcher, URL hash, another plugin or
 * the LayerControl API). Also accepts a LayerSwitcher tree-group folder id, in
 * which case the value is `true` only when every leaf layer is visible.
 *
 * @param {import("../models/LayerControlModel").default} layerControl
 * @param {string} id Layer id (OpenLayers `name`) or tree-group folder id.
 * @returns {boolean} Current visibility.
 */
export function useLayerVisibility(layerControl, id) {
  const subscribe = useCallback(
    (cb) => layerControl.subscribe(id, cb),
    [layerControl, id]
  );
  const getSnapshot = useCallback(
    () => layerControl.getVisibilitySnapshot(id),
    [layerControl, id]
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Richer, cached object snapshot for semi-checked group layers etc. The returned
 * object is referentially stable until one of its fields actually changes.
 *
 * For a layer id the shape is
 * `{ visible, visibleSubLayers, opacity }`; for a LayerSwitcher tree-group
 * folder id it is `{ visible, state: "all"|"some"|"none", visibleLayers }`.
 *
 * @param {import("../models/LayerControlModel").default} layerControl
 * @param {string} id Layer id (OpenLayers `name`) or tree-group folder id.
 * @returns {object}
 */
export function useLayerState(layerControl, id) {
  const subscribe = useCallback(
    (cb) => layerControl.subscribe(id, cb),
    [layerControl, id]
  );
  const getSnapshot = useCallback(
    () => layerControl.getLayerStateSnapshot(id),
    [layerControl, id]
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}
