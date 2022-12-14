import React, { useCallback, useEffect, useState } from "react";
import { Container, Draggable } from "react-smooth-dnd";

import {
  IconButton,
  AppBar,
  Toolbar,
  Box,
  List,
  ListSubheader,
} from "@mui/material";

import DrawOrderListItem from "./DrawOrderListItem";
import DrawOrderOptions from "./DrawOrderOptions";

import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

function DrawOrder({ app, map }) {
  // A Set that will hold type of OL layers that should be shown.
  // This is a user setting, changed by toggling a switch control.
  const [filterList, setFilterList] = useState(
    new Set(["layer", "group", "base"]) // Also "system" is available, but let's start without it
  );

  // This handles the collapsible settings area for each list item, makes sure that only one settings area can be opened
  const [activeSetting, setActiveSetting] = useState();
  const toggleSettings = (layerId) => {
    setActiveSetting(activeSetting === layerId ? "" : layerId);
  };

  // A helper that grabs all OL layers with state active, filters so that
  // only the selected layer types are shown and sorts them
  // in reverse numerical order (highest zIndex at top of the list).
  const getSortedLayers = useCallback(() => {
    return (
      map
        .getAllLayers()
        .filter((l) => {
          l.getZIndex() === undefined && l.setZIndex(-2);
          return (
            l.get("active") === true &&
            Array.from(filterList).includes(l.get("layerType"))
          );
        })
        // Reversed numerical order
        .sort((a, b) => b.getZIndex() - a.getZIndex())
    );
  }, [filterList, map]);

  // State that contains the layers that are currently active
  const [sortedLayers, setSortedLayers] = useState(getSortedLayers());

  // A helper that grabs all OL layers, filters on selected layer types. This is needed for the z-index ordering to be correct with all layers in map
  const getAllLayers = useCallback(() => {
    return (
      map
        .getAllLayers()
        .filter((l) => {
          l.getZIndex() === undefined && l.setZIndex(-2);
          return Array.from(filterList).includes(l.get("layerType"));
        })
        // Reversed numerical order
        .sort((a, b) => b.getZIndex() - a.getZIndex())
    );
  }, [filterList, map]);

  useEffect(() => {
    // Register a listener: when any layer's visibility changes make sure
    // to update the list.
    const visibilityChangedSubscription = app.globalObserver.subscribe(
      "core.layerVisibilityChanged",
      (l) => {
        setSortedLayers(getSortedLayers());
      }
    );

    // Register a listener: when any layer's active state changes make sure
    // to update the list.
    const activeChangedSubscription = app.globalObserver.subscribe(
      "core.layerActiveChanged",
      (l) => {
        setSortedLayers(getSortedLayers());
      }
    );

    // Unsubscribe when component unmounts
    return function () {
      visibilityChangedSubscription.unsubscribe();
      activeChangedSubscription.unsubscribe();
    };
  }, []);

  // When values of the filterList set changes, let's update the list.
  useEffect(() => {
    setSortedLayers(getSortedLayers());
  }, [filterList, getSortedLayers]);

  // Handler that takes care of the layer zIndex ordering.
  const onDrop = (dropResult) => {
    const layer = dropResult.payload;
    const { removedIndex, addedIndex } = dropResult;
    // The layers original z-index
    const oldZIndex = layer.getZIndex() || 0;
    // Setup two variables that will have different values depending on
    // whether we're moving the layer up or down the list.
    let otherAffectedLayers = null;

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

  const handleVisibilityButtonClick = () => {
    getSortedLayers()
      .filter((l) => l.get("layerType") !== "base")
      .forEach((l) => {
        l.set("visible", false);
      });
  };

  const handleDeleteButtonClick = () => {
    getSortedLayers()
      .filter((l) => l.get("layerType") !== "base")
      .forEach((l) => {
        l.set("visible", false);
        l.set("active", false);
      });
  };

  const getGhostParent = () => {
    // Because parent element is transformed we need to render the "ghost" element in body instead of parent
    return document.body;
  };

  return (
    <Box>
      <AppBar position="relative" color="secondary">
        <Toolbar variant="dense">
          <IconButton edge="start" onClick={handleVisibilityButtonClick}>
            <VisibilityOffOutlinedIcon />
          </IconButton>
          <IconButton onClick={handleDeleteButtonClick}>
            <DeleteOutlinedIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton>
            <SourceOutlinedIcon />
          </IconButton>
          <DrawOrderOptions
            app={app}
            filterList={filterList}
            setFilterList={setFilterList}
            map={map}
          />
        </Toolbar>
      </AppBar>
      <List>
        <Container
          lockAxis="y"
          getChildPayload={(i) => sortedLayers[i]}
          animationDuration={500}
          onDrop={onDrop}
          getGhostParent={getGhostParent}
          nonDragAreaSelector=".settingsCollapse"
        >
          {sortedLayers
            .filter((l) => l.get("layerType") !== "base")
            .map((l) => (
              <Draggable key={"draggable" + l.ol_uid}>
                <DrawOrderListItem
                  key={l.ol_uid}
                  layer={l}
                  isBackgroundLayer={false}
                  settingIsActive={activeSetting === l.ol_uid}
                  settingClickCallback={toggleSettings}
                />
              </Draggable>
            ))}
        </Container>
        <ListSubheader
          sx={{
            backgroundColor: "#f5f5f5",
            fontWeight: "bold",
            lineHeight: "32px",
          }}
        >
          Bakgrund
        </ListSubheader>
        {sortedLayers
          .filter((l) => l.get("layerType") === "base")
          .map((l) => (
            <DrawOrderListItem
              key={l.ol_uid}
              layer={l}
              isBackgroundLayer={true}
              settingActive={activeSetting === l.ol_uid}
              settingCallback={toggleSettings}
            />
          ))}
      </List>
    </Box>
  );
}

export default DrawOrder;
