import React, { useCallback, useEffect, useState } from "react";
import { Container, Draggable } from "react-smooth-dnd";

import {
  IconButton,
  Box,
  FormGroup,
  FormControlLabel,
  List,
  Switch,
  Tooltip,
  Collapse,
  Typography,
  Stack,
} from "@mui/material";

import LayerItem from "./LayerItem";
import BackgroundLayer from "./BackgroundLayer";
import GroupLayer from "./GroupLayer";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

function DrawOrder({ display, app, map, localObserver, options }) {
  // A Set that will hold type of OL layers that should be shown.
  // This is a user setting, changed by toggling a switch control.
  const [filterList, setFilterList] = useState(
    ["layer", "group", "base"] // Also "system" is available, but let's start without it
  );
  // State that contains the layers that are currently visible
  const [sortedLayers, setSortedLayers] = useState([]);
  // State that toggles info collapse
  const [infoIsActive, setInfoIsActive] = useState(false);
  // State that keeps track if system filter is active
  const [systemFilterActive, setSystemFilterActive] = useState(false);

  // A helper that grabs all OL layers with state visible, filters so that
  // only the selected layer types are shown and sorts them
  // in reverse numerical order (highest zIndex at top of the list).
  const getSortedLayers = useCallback(() => {
    // Get all visible layers
    let visibleLayers = map.getAllLayers().filter((l) => {
      l.getZIndex() === undefined && l.setZIndex(-2);
      return (
        l.get("visible") === true && filterList.includes(l.get("layerType"))
      );
    });

    // Return layers in reversed numerical order
    return visibleLayers.sort((a, b) => b.getZIndex() - a.getZIndex());
  }, [filterList, map]);

  // A helper that grabs all OL layers, filters on selected layer types.
  // This is needed for the z-index ordering to be correct with all layers added to map
  const getAllLayers = useCallback(() => {
    return (
      map
        .getAllLayers()
        .filter((l) => {
          l.getZIndex() === undefined && l.setZIndex(-2);
          return filterList.includes(l.get("layerType"));
        })
        // Reversed numerical order
        .sort((a, b) => b.getZIndex() - a.getZIndex())
    );
  }, [filterList, map]);

  // When values of display changes to true, let's update the list
  useEffect(() => {
    let visibilityChangedSubscription;

    if (display) {
      // Subscribe to the layerVisibilityChanged event when display sets to true
      visibilityChangedSubscription = app.globalObserver.subscribe(
        "core.layerVisibilityChanged",
        (l) => {
          // Update list of layers
          setSortedLayers(getSortedLayers());
        }
      );

      // Update list of layers when display sets to true
      setSortedLayers(getSortedLayers());
    }

    // Unsubscribe from the layerVisibilityChanged event
    return function () {
      if (visibilityChangedSubscription) {
        visibilityChangedSubscription.unsubscribe();
      }
    };
  }, [display, getSortedLayers, app.globalObserver]);

  // When values of the filterList set changes, let's update the list
  useEffect(() => {
    // Update list of layers
    setSortedLayers(getSortedLayers());
  }, [filterList, app.globalObserver, getSortedLayers]);

  // Handler that takes care of the layer zIndex ordering.
  const onDrop = (dropResult) => {
    const layer = dropResult.payload;
    const { removedIndex, addedIndex } = dropResult;
    // The layers original z-index
    const oldZIndex = layer.getZIndex() || 0;
    // Setup two variables that will have different values depending on
    // whether we're moving the layer up or down the list.
    let otherAffectedLayers = null;

    // Fail check
    if (addedIndex === null || removedIndex === null) return; // No reorder

    // Determine the direction of the reorder
    const direction = removedIndex - addedIndex;

    if (direction === 0) return; // No reorder

    if (direction > 0) {
      // Increasing zIndex. We want to get every layer with higher zindex than current layer and increase it too.
      otherAffectedLayers = getAllLayers().filter(
        (l) => l.getZIndex() >= oldZIndex && layer !== l // Make sure to ignore current layer
      );
      // Get the layer that current layer need to replace zindex with
      const layerToReplaceZindexWith = getSortedLayers()[addedIndex];
      const newZIndex = layerToReplaceZindexWith.getZIndex() || 0;

      // Remove layers from otherAffectedLayers that are not affected by the zindex change
      otherAffectedLayers = otherAffectedLayers.filter(
        (l) => l.getZIndex() <= newZIndex
      );

      // Decrease otherAffectedLayers with one zIndex.
      otherAffectedLayers.forEach((l) => l.setZIndex(l.getZIndex() - 1));
      // Finally, the layer that is to be moved must get a new zIndex.
      layer.setZIndex(newZIndex);
    } else {
      // Decreasing zIndex. Grab all layers with zIndex below the current layer's.
      otherAffectedLayers = getAllLayers().filter(
        (l) => l.getZIndex() <= oldZIndex && layer !== l // Make sure to ignore current layer
      );

      // Get the layer that current layer need to replace zindex with
      const layerToReplaceZindexWith = getSortedLayers()[addedIndex];
      const newZIndex = layerToReplaceZindexWith.getZIndex() || 0;

      // Remove layers from otherAffectedLayers that are not affected by the zindex change
      otherAffectedLayers = otherAffectedLayers.filter(
        (l) => l.getZIndex() >= newZIndex
      );

      // Increase otherAffectedLayers with one zIndex.
      otherAffectedLayers.forEach((la) => la.setZIndex(la.getZIndex() + 1));
      // Finally, the layer that is to be moved must get a new zIndex.
      layer.setZIndex(newZIndex);
    }

    // When we're done setting OL layers' zIndexes, we can update the state of our component,
    // so that the UI reflects the new order.
    setSortedLayers(getSortedLayers());
  };

  // Handles click on info button in header
  const handleInfoButtonClick = () => {
    setInfoIsActive(!infoIsActive);
  };

  const getGhostParent = () => {
    // Because parent element is transformed we need to render the "ghost" element in body instead of parent
    return document.body;
  };

  // Sets system filter
  const setSystemFilter = () => {
    if (filterList.includes("system")) {
      // Remove "system" from filerList
      const newFilterList = filterList.filter((item) => item !== "system");
      setFilterList(newFilterList);
    } else {
      // Add "system" to filerList
      setFilterList((filterList) => [...filterList, "system"]);
    }
    // Change systemFilterActive state
    setSystemFilterActive(!systemFilterActive);
  };

  const renderLockedBaseLayerItem = () => {
    if (!options.lockDrawOrderBaselayer) return null;
    const l = sortedLayers.find((l) => l.get("layerType") === "base");
    if (!l) return null;
    return (
      <BackgroundLayer
        key={l.isFakeMapLayer ? l.get("caption") : l.ol_uid}
        layer={l}
        app={app}
        globalObserver={app.globalObserver}
        draggable={!options.lockDrawOrderBaselayer}
        toggleable={false}
      />
    );
  };

  return (
    <Box sx={{ display: display ? "block" : "none" }}>
      <Box
        sx={{
          pr: 2,
          pl: 2,
          py: 1,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#373737" : theme.palette.grey[100],
          borderBottom: (theme) =>
            `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" alignItems="center">
          {options.enableSystemLayersSwitch && (
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemFilterActive}
                    onChange={setSystemFilter}
                  />
                }
                label="Systemlager"
              />
            </FormGroup>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={handleInfoButtonClick}>
            <Tooltip title={infoIsActive ? "Dölj info" : "Visa info"}>
              <InfoOutlinedIcon />
            </Tooltip>
          </IconButton>
        </Stack>
        <Collapse
          in={infoIsActive}
          timeout="auto"
          unmountOnExit
          className="infoCollapse"
        >
          <Box sx={{ p: 1, pt: 0 }}>
            <hr></hr>
            <Typography variant="subtitle2">
              {options.drawOrderViewInfoText}
            </Typography>
          </Box>
        </Collapse>
      </Box>
      <List sx={{ pt: 0 }}>
        <Container
          lockAxis="y"
          getChildPayload={(i) => sortedLayers[i]}
          animationDuration={500}
          onDrop={onDrop}
          getGhostParent={getGhostParent}
        >
          {sortedLayers.map((l) => {
            if (
              l.get("layerType") === "base" &&
              options.lockDrawOrderBaselayer
            ) {
              return null;
            } else {
              const layerState = {
                layerIsToggled: l.get("visible"),
                visibleSubLayers: l.get("subLayers"),
              };

              const layerConfig = {
                layerId: l.get("name"),
                layerCaption: l.get("caption"),
                layerType: l.get("layerType"),

                // layerIsFakeMapLayer: l.isFakeMapLayer,
                layerIsFakeMapLayer: false, // TODO Check this mapLayer.isFakeMapLayer,
                allSubLayers: l.get("subLayers"),
                layerMinZoom: l.get("minZoom"),
                layerMaxZoom: l.get("maxZoom"),
                numberOfSubLayers: l.subLayers.length,
                layerInfo: l.get("layerInfo"),
                layerLegendIcon: l.get("legendIcon"),
              };

              return (
                <Draggable key={"draggable" + l.ol_uid}>
                  {l.get("layerType") === "base" ? (
                    <BackgroundLayer
                      key={l.isFakeMapLayer ? l.get("caption") : l.ol_uid}
                      layer={l}
                      app={app}
                      draggable={!options.lockDrawOrderBaselayer}
                      toggleable={false}
                    />
                  ) : l.get("layerType") === "group" ? (
                    <GroupLayer
                      key={l.ol_uid}
                      layerState={layerState}
                      layerConfig={layerConfig}
                      globalObserver={app.globalObserver}
                      toggleable={false}
                      draggable={true}
                    />
                  ) : (
                    <LayerItem
                      key={l.ol_uid}
                      layerState={layerState}
                      layerConfig={layerConfig}
                      draggable={true}
                      toggleable={false}
                      globalObserver={app.globalObserver}
                    />
                  )}
                </Draggable>
              );
            }
          })}
        </Container>
        {renderLockedBaseLayerItem()}
      </List>
    </Box>
  );
}

export default DrawOrder;
