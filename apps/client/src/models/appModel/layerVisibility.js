import { setOLSubLayers } from "../../utils/groupLayers";

function parseLayerId(layerId) {
  const hasLabelSuffix = layerId.endsWith("_l");
  const baseId = hasLabelSuffix ? layerId.slice(0, -2) : layerId;
  return { baseId, hasLabelSuffix };
}

function findOLLayer(map, baseId) {
  return map.getAllLayers().find((l) => l.get("name") === baseId);
}

function computeLayerDiff(currentL, wantedL) {
  const wantedLayersMap = new Map();
  wantedL.forEach((layerId) => {
    const { baseId, hasLabelSuffix } = parseLayerId(layerId);
    wantedLayersMap.set(baseId, hasLabelSuffix);
  });

  const currentLayersMap = new Map();
  currentL.forEach((layerId) => {
    const { baseId, hasLabelSuffix } = parseLayerId(layerId);
    currentLayersMap.set(baseId, hasLabelSuffix);
  });

  const lToShow = [];
  const lToHide = [];
  const lToUpdateStyle = [];

  wantedLayersMap.forEach((wantedHasLabel, baseId) => {
    if (!currentLayersMap.has(baseId)) {
      lToShow.push({ baseId, hasLabelSuffix: wantedHasLabel });
    } else if (currentLayersMap.get(baseId) !== wantedHasLabel) {
      lToUpdateStyle.push({ baseId, hasLabelSuffix: wantedHasLabel });
    }
  });

  currentLayersMap.forEach((currentHasLabel, baseId) => {
    if (!wantedLayersMap.has(baseId)) {
      lToHide.push({ baseId, hasLabelSuffix: currentHasLabel });
    }
  });

  return { lToShow, lToHide, lToUpdateStyle };
}

function showLayers(map, lToShow, wantedGl) {
  lToShow.forEach(({ baseId, hasLabelSuffix }) => {
    const olLayer = findOLLayer(map, baseId);

    if (olLayer === undefined) {
      console.warn(
        `Attempt to show layer with id ${baseId} failed: layer not found in current map`
      );
    } else if (olLayer.get("layerType") === "group") {
      if (wantedGl[baseId]) {
        const subLayersToShow = wantedGl[baseId]?.split(",");
        setOLSubLayers(olLayer, subLayersToShow);
      }
      // On the other hand, if the layer to be shown does not exist in 'wantedGl',
      // it means that we should show ALL the sublayers.
      // For that we must publish the event slightly differently. (Also, see
      // where we subscribe to layerswitcher.showLayer for further understanding.)
      else {
        const allSubLayers = olLayer.get("allSubLayers");
        setOLSubLayers(olLayer, allSubLayers);
      }
      // That's it for group layer. The other layers, the "normal"
      // ones, are easier: just show them.
    } else {
      // Each layer has a listener that will take care of toggling
      // the checkbox in LayerSwitcher.
      olLayer.setVisible(true);

      if (hasLabelSuffix && olLayer.get("hasLabelStyle")) {
        olLayer.set("useLabelStyle", true);
      } else {
        olLayer.set("useLabelStyle", false);
      }
    }
  });
}

function hideLayers(map, globalObserver, lToHide) {
  lToHide.forEach(({ baseId }) => {
    const olLayer = findOLLayer(map, baseId);

    if (olLayer === undefined) {
      console.warn(
        `Attempt to hide layer with id ${baseId} failed: layer not found in current map`
      );
    } else if (olLayer.get("layerType") === "group") {
      // Tell the LayerSwitcher about it
      globalObserver.publish("layerswitcher.hideLayer", olLayer);
      olLayer.setVisible(false);
    } else {
      olLayer.setVisible(false);
    }
  });
}

function syncPartiallyToggledSublayers(map, wantedGl, currentGl) {
  // One more special case must be taken care of. lToShow and lToHide can be empty
  // if user toggled only a sublayer WITHIN a group layer. In that case we
  // won't need to change visibility for any OL layers, but we must still fix the group
  // layer's components' visibility.
  // We start by looping the wantedGl and comparing to currentGl.
  for (const key of Object.keys(wantedGl)) {
    // If the currently visible groups object has the layer's key…
    // …and it's value differs from the wantedGl's corresponding value…
    if (Object.hasOwn(currentGl, key) && currentGl[key] !== wantedGl[key]) {
      const olLayer = findOLLayer(map, key);
      if (olLayer) {
        const subLayersToShow = wantedGl[key]?.split(",");
        setOLSubLayers(olLayer, subLayersToShow);
      }
    }
  }
}

function syncFullyToggledGroupLayers(map, wantedL, wantedGl) {
  // Super-special case:
  // If a partly-toggled group layer becomes fully toggled it will
  // not show up as a diff in wanted vs current layers. Neither will
  // we see anything in 'wantedGl' (it will be empty, as that's what we
  // expect for fully toggled group layers [no sub-selection]).
  // So what can we do?
  // One solution is to loop through our visible layers (again). Any of them
  // that are of type 'groupLayer', and where a wantedGl key is missing should
  // be toggled on completely.
  wantedL.forEach((layerId) => {
    const { baseId } = parseLayerId(layerId);
    const olLayer = map
      .getAllLayers()
      .find(
        (l) => l.get("name") === baseId && l.get("layerType") === "group"
      );

    if (olLayer !== undefined) {
      // Determine how we should call the layerswitcher.showLayer event.
      // A: No sublayers specified for layer in 'wantedGl'. That means show ALL sublayers.
      // B: Sublayers found in 'wantedGl'. Set visibility accordingly.
      if (wantedGl[baseId] === undefined) {
        const allSubLayers = olLayer.get("allSubLayers");
        setOLSubLayers(olLayer, allSubLayers);
      } else {
        const subLayersToShow = wantedGl[baseId]?.split(",");
        setOLSubLayers(olLayer, subLayersToShow);
      }
    }
  });
}

/**
 * @param {object} appModel - The AppModel instance
 * @param {string} layers - Comma-separated list of layers to be shown
 * @param {string} groupLayers - A stringified JSON object specifying sublayer visibility.
 */
export function setLayerVisibilityFromParams(appModel, layers = null, groupLayers = "{}") {
  // Grab the wanted values from params
  const l = layers;
  const gl = groupLayers ?? "{}"; // Default to a stringified empty object, as that's what we'll compare against

  // Find out what's currently visible
  const visibleLayers = appModel.anchorModel.getVisibleLayers();
  const partlyToggledGroupLayers =
    appModel.anchorModel.getPartlyToggledGroupLayers();

  // Compare these two — early-exit gate: do nothing if state hasn't changed
  if (
    l === visibleLayers &&
    JSON.stringify(partlyToggledGroupLayers) === gl
  ) {
    // console.log("No changes");
  } else {
    const wantedL = l.split(",");
    const wantedGl = JSON.parse(gl);
    const currentL = visibleLayers.split(",");
    const currentGl = partlyToggledGroupLayers;

    const { lToShow, lToHide, lToUpdateStyle } = computeLayerDiff(
      currentL,
      wantedL
    );

    // Update label styles for layers that are already visible
    lToUpdateStyle.forEach(({ baseId, hasLabelSuffix }) => {
      const olLayer = findOLLayer(appModel.map, baseId);

      if (olLayer === undefined) {
        console.warn(
          `Attempt to update layer style for ${baseId} failed: layer not found in current map`
        );
      } else {
        if (hasLabelSuffix && olLayer.get("hasLabelStyle")) {
          olLayer.set("useLabelStyle", true);
        } else {
          olLayer.set("useLabelStyle", false);
        }
      }
    });

    showLayers(appModel.map, lToShow, wantedGl);

    hideLayers(appModel.map, appModel.globalObserver, lToHide);

    syncPartiallyToggledSublayers(appModel.map, wantedGl, currentGl);

    syncFullyToggledGroupLayers(appModel.map, wantedL, wantedGl);
  }
}
