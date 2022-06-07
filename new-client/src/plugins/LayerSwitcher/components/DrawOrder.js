import React, { useCallback, useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Switch from "@mui/material/Switch";
import List from "@mui/material/List";
import { Button, ButtonGroup } from "@mui/material";
import DrawOrderListItem from "./DrawOrderListItem";
import Save from "@mui/icons-material/Save";
import { FolderOpen } from "@mui/icons-material";

function DrawOrder({ app, map }) {
  const { enqueueSnackbar } = useSnackbar();

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

  // Handler function for the show/hide system layers switch
  const handleSystemLayerSwitchChange = (e) => {
    const v = e.target.checked;
    if (v === true) {
      filterList.add("system");
      setFilterList(new Set(filterList));
    } else {
      filterList.delete("system");
      setFilterList(new Set(filterList));
    }
  };

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

  /**
   * Take care of saving active layers so that they can be restored layer.
   * For time being we're only saving in local storage, but this may change
   * in the future.
   * We take care of saving **all non-system layers**.
   * We save the opacity as well as the layers' internal order (by reading
   * the value of zIndex).
   */
  const handleSave = () => {
    // Grab layers to be saved by…
    const savedLayers = map
      .getAllLayers() //
      .filter((l) => l.getVisible() === true && l.get("layerType") !== "system") // …filtering out system layers.
      .map((l) => {
        // Create an array of objects. For each layer, we want to read its…
        return { i: l.get("name"), z: l.getZIndex(), o: l.getOpacity() }; // …name, zIndex and opacity.
      });

    // Let's create some metadata about our saved layers. User might want to know
    // how many layers are saved and when they were saved.
    // First, we try to get the map's name. We can't be certain that this exists (not
    // all maps have the userSpecificMaps property), so we must be careful.
    const mapName =
      Array.isArray(app.config.userSpecificMaps) &&
      app.config.userSpecificMaps.find(
        (m) => m.mapConfigurationName === app.config.activeMap
      )?.mapConfigurationTitle;

    // Next, let's put together the metadata object…
    const metadata = {
      savedAt: new Date(),
      numberOfLayers: savedLayers.length,
      ...(mapName && { mapName }), // …if we have a map name, let's add it too.
    };

    // Let's combine it all to an object that will be saved.
    const objectToSave = { savedLayers, metadata };

    localStorage.setItem(
      "plugin.layerswitcher.savedLayers",
      JSON.stringify(objectToSave) // Remember to stringify prior storing in local storage.
    );

    enqueueSnackbar(`${metadata.numberOfLayers} lager sparades utan problem`, {
      variant: "success",
    });
  };

  const handleRestore = () => {
    // Let's be safe about parsing JSON
    try {
      const { metadata, savedLayers } = JSON.parse(
        localStorage.getItem("plugin.layerswitcher.savedLayers")
      );

      map
        .getAllLayers() // Traverse all layers…
        .filter((l) => l.get("layerType") !== "system") // …ignore system layers.
        .forEach((l) => {
          // See if the current layer is in the list of saved layers.
          const match = savedLayers.find((rl) => rl.i === l.get("name"));
          // If yes…
          if (match) {
            // …read and set some options.
            l.setZIndex(match.z);
            l.setOpacity(match.o);
            l.setVisible(true);
          } else {
            // If not, ensure that the layer is hidden.
            l.setVisible(false);
          }
        });

      enqueueSnackbar(
        `${metadata.numberOfLayers} lager återställdes från tidigare session`,
        {
          variant: "success",
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box>
      <ButtonGroup
        variant="contained"
        aria-label="outlined primary button group"
      >
        <Button onClick={handleSave}>
          <Save />
        </Button>
        <Button onClick={handleRestore}>
          <FolderOpen />
        </Button>
      </ButtonGroup>
      <FormGroup sx={{ p: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={filterList.has("system")}
              onChange={handleSystemLayerSwitchChange}
            />
          }
          label="Visa systemlager (avancerat)"
        />
      </FormGroup>

      <List>
        {sortedLayers.map((l, i) => (
          <DrawOrderListItem
            key={i}
            changeOrder={handleLayerOrderChange}
            layer={l}
          />
        ))}
      </List>
    </Box>
  );
}

export default DrawOrder;
