import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import DrawOrderListItem from "./DrawOrderListItem";
import DrawOrderOptions from "./DrawOrderOptions";
import { Chip, Divider } from "@mui/material";
import { t } from "i18next";

function DrawOrder({ app, map }) {
  // A Set that will hold type of OL layers that should be shown.
  // This is a user setting, changed by toggling a switch control.
  const [filterList, setFilterList] = useState(
    new Set(["layer", "group", "base"]) // Also "system" is available, but let's start without it
  );

  // A helper that grabs all visible OL layers, filters so that
  // only the selected layer types are shown and sorts them
  // in reverse numerical order (highest zIndex at top of the list).
  const getSortedLayers = useCallback(() => {
    return (
      map
        .getAllLayers()
        .filter((l) => {
          l.getZIndex() === undefined && l.setZIndex(-2);
          return (
            l.getVisible() === true &&
            Array.from(filterList).includes(l.get("layerType"))
          );
        })
        // Reversed numerical order
        .sort((a, b) => b.getZIndex() - a.getZIndex())
    );
  }, [filterList, map]);

  useEffect(() => {
    // Register a listener: when any layer's visibility changes make sure
    // to update the list.
    app.globalObserver.subscribe("core.layerVisibilityChanged", (l) => {
      setSortedLayers(getSortedLayers());
    });
  }, [app.globalObserver, getSortedLayers]);

  const [sortedLayers, setSortedLayers] = useState(getSortedLayers());

  // When values of the filterList set changes, let's update the list.
  useEffect(() => {
    setSortedLayers(getSortedLayers());
  }, [filterList, getSortedLayers]);

  // Main handler of this component. Takes care of layer zIndex ordering.
  const handleLayerOrderChange = (layer, direction) => {
    const oldZIndex = layer.getZIndex() || 0;

    // Setup two variables that will have different values depending on
    // whether we're moving the layer up or down the list.
    let layerToBypass,
      otherAffectedLayers = null;

    if (direction > 0) {
      // Increasing zIndex. We want to get everything above current layer and increase it too.
      otherAffectedLayers = getSortedLayers().filter(
        (l) => l.getZIndex() >= oldZIndex && layer !== l // Make sure to ignore current layer
      );

      // Abort if there are no layers above the current one
      if (otherAffectedLayers.length === 0) return;

      // Now we have a list of layers that are above the one we want to lift. Next thing to do
      // is grab the _last_ layer in this list. That will be the layer that we want to "go above".
      // The .pop() below does two things: it grabs the layer (so we can get it's zIndex) and it
      // removes it from the array of other affected layers. We don't want to increase this one
      // layer's zIndex (as opposed to everything else!).
      layerToBypass = otherAffectedLayers.pop();
    } else {
      // Decreasing zIndex. Grab all layers with zIndex below the current layer's.
      otherAffectedLayers = getSortedLayers().filter(
        (l) => l.getZIndex() <= oldZIndex && layer !== l // Make sure to ignore current layer
      );

      // Abort if there are no layers below the current one
      if (otherAffectedLayers.length === 0) return;

      // The first layer (directly below the moved one) should remain untouched. So we
      // use .shift() to removed it from the array of affected layers and save to a variable.
      // That variable will be used later on to determine the zIndex of this layer so that
      // the layer we're currently moving can bypass this one.
      layerToBypass = otherAffectedLayers.shift();
    }

    // otherAffectedLayers is an array of layers that are not in direct contact with the
    // layer being moved or the one below/above it. To ensure that their internal order
    // remains the same, we move them one step up/down (depending on the direction).
    otherAffectedLayers.forEach((la) =>
      la.setZIndex(la.getZIndex() + direction)
    );

    // Finally, the layer that is to be moved must get a new zIndex. That value is determined
    // by taking a look at the zIndex of the layer that we want to bypass and increased/decrease
    // by one step.
    layer.setZIndex(layerToBypass.getZIndex() + direction);

    // When we're done setting OL layers' zIndexes, we can update the state of our component,
    // so that the UI reflects the new order.
    setSortedLayers(getSortedLayers());
  };

  const getLabelFromNumber = () =>
    sortedLayers.length.toString() +
    " " +
    (sortedLayers.length === 1
      ? t("plugins.layerSwitcher.window.activeLayers.oneActiveLayer")
      : t("plugins.layerSwitcher.window.activeLayers.manyActiveLayers"));

  return (
    <Box>
      <DrawOrderOptions
        app={app}
        filterList={filterList}
        setFilterList={setFilterList}
        map={map}
      />
      <Divider sx={{ pt: 2 }}>
        <Chip label={getLabelFromNumber()} />
      </Divider>
      <List>
        {sortedLayers.map((l) => (
          <DrawOrderListItem
            key={l.ol_uid}
            changeOrder={handleLayerOrderChange}
            layer={l}
          />
        ))}
      </List>
    </Box>
  );
}

export default DrawOrder;
