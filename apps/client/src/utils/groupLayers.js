export const setOLSubLayers = (olLayer, visibleSubLayersArray) => {
  if (visibleSubLayersArray.length === 0) {
    // Fix underlying source
    olLayer.getSource().updateParams({
      // Ensure that the list of sublayers is emptied (otherwise they'd be
      // "remembered" the next time user toggles group)
      LAYERS: "",
      // Remove any filters
      CQL_FILTER: null,
    });

    // Hide the layer in OL
    olLayer.setVisible(false);
  } else {
    // Set LAYERS and STYLES so that the exact sublayers that are needed
    // will be visible
    olLayer.getSource().updateParams({
      // join(), so we always provide a string as value to LAYERS
      LAYERS: visibleSubLayersArray.join(),
      // Filter STYLES to only contain styles for currently visible layers,
      // and maintain the order from layersInfo (it's crucial that the order
      // of STYLES corresponds exactly to the order of LAYERS!)
      STYLES: Object.entries(olLayer.layersInfo)
        .filter((k) => visibleSubLayersArray.indexOf(k[0]) !== -1)
        .map((l) => l[1].style)
        .join(","),
      CQL_FILTER: null,
    });
    olLayer.set("subLayers", visibleSubLayersArray);
    olLayer.setVisible(true);
  }
};

export const getAllLayerIdsInGroup = (group) => {
  if (!group) {
    return [];
  }

  if (!group.children) {
    return [group.id];
  } else {
    return group.children.flatMap((c) => {
      return getAllLayerIdsInGroup(c);
    });
  }
};
