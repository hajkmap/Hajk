import React, { useCallback, useEffect, useState } from "react";
import { Container, Draggable } from "react-smooth-dnd";

import {
  IconButton,
  Box,
  List,
  ListSubheader,
  Tooltip,
  Collapse,
  Typography,
  Stack,
} from "@mui/material";

import DrawOrderListItem from "./DrawOrderListItem";
import DrawOrderOptions from "./DrawOrderOptions";

import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

function DrawOrder({ display, app, map, onLayerChange }) {
  // A Set that will hold type of OL layers that should be shown.
  // This is a user setting, changed by toggling a switch control.
  const [filterList, setFilterList] = useState(
    ["layer", "group", "base"] // Also "system" is available, but let's start without it
  );
  // This handles the collapsible settings area for each list item, makes sure that only one settings area can be opened
  const [activeSetting, setActiveSetting] = useState();
  // State that contains the layers that are currently active
  const [sortedLayers, setSortedLayers] = useState([]);
  // State that toggles functionality of the set visibility tool
  const [layerVisibleToggle, setLayerVisibleToggle] = useState(true);
  // State that toggles info collapse
  const [infoIsActive, setInfoIsActive] = useState(false);
  // State that keeps track if system filter is active
  const [systemFilterActive, setSystemFilterActive] = useState(false);

  // Toggles the settings area
  const toggleSettings = (layerId) => {
    setActiveSetting(activeSetting === layerId ? "" : layerId);
  };

  // A helper that grabs all OL layers with state active, filters so that
  // only the selected layer types are shown and sorts them
  // in reverse numerical order (highest zIndex at top of the list).
  const getSortedLayers = useCallback(() => {
    // Get all active layers
    let activeLayers = map.getAllLayers().filter((l) => {
      l.getZIndex() === undefined && l.setZIndex(-2);
      return (
        l.get("active") === true && filterList.includes(l.get("layerType"))
      );
    });

    // Check if a baselayer is active
    const hasActiveBackground = activeLayers.some(
      (l) => l.get("layerType") === "base"
    );
    // If not, white or black background is active and we have to manually add it to the array of active layers
    if (!hasActiveBackground) {
      activeLayers.push({
        isFakeMapLayer: true,
        properties: {
          caption:
            document.getElementById("map").style.backgroundColor ===
            "rgb(0, 0, 0)"
              ? "Svart"
              : "Vit",
          layerType: "base",
        },
        get(key) {
          return this.properties[key];
        },
        set(key, value) {
          this.properties[key] = value;
        },
        getZIndex() {
          return -2;
        },
      });
    }

    // Special handling of "system" layers. System layers do not have "active" state,
    // their active state are handled by visibility
    if (filterList.includes("system")) {
      const systemLayers = map.getAllLayers().filter((l) => {
        l.getZIndex() === undefined && l.setZIndex(-2);
        return l.get("visible") === true && l.get("layerType") === "system";
      });
      // Add to activeLayers list
      activeLayers = activeLayers.concat(systemLayers);
    }

    // Return active layers in reversed numerical order
    return activeLayers.sort((a, b) => b.getZIndex() - a.getZIndex());
  }, [filterList, map]);

  // A helper that grabs all OL layers, filters on selected layer types.
  // This is needed for the z-index ordering to be correct with all layers in map
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

  // When values of the sortedLayers set changes, let's update the counter for active layers.
  // And set the visibilityTools state depending on if there's at least one layer visible
  useEffect(() => {
    onLayerChange(
      sortedLayers.filter((l) => {
        return l.get("layerType") !== "base";
      }).length
    );

    const checkVisibilityCount = () => {
      const visibleLayers = sortedLayers.filter((l) => {
        return (
          l.get("visible") === true &&
          l.get("layerType") !== "system" &&
          l.get("layerType") !== "base"
        );
      });

      const visibleSystemLayers = sortedLayers.filter((l) => {
        return l.get("opacity") !== 0 && l.get("layerType") === "system";
      });
      return visibleSystemLayers.length + visibleLayers.length;
    };

    const visibleLayers = checkVisibilityCount();
    setLayerVisibleToggle(visibleLayers === 0 ? false : true);
  }, [sortedLayers, onLayerChange]);

  // When values of the filterList set changes, let's update the list and subscribe to events
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
    // Update list of layers
    setSortedLayers(getSortedLayers());
    // Unsubscribe when component unmounts
    return function () {
      visibilityChangedSubscription.unsubscribe();
      activeChangedSubscription.unsubscribe();
    };
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

  // Handles click on visibility button in header
  const handleVisibilityButtonClick = () => {
    sortedLayers.forEach((l) => {
      if (l.get("layerType") === "group" || l.get("layerType") === "layer") {
        // For layers of type "layer" and "group", set visible property
        l.set("visible", layerVisibleToggle ? false : true);
      } else if (l.get("layerType") === "system") {
        // For layers of type "system", set opacity property
        l.set("opacity", layerVisibleToggle ? 0 : 1);
      }
      // Do not affect layers of type "base"
    });
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

  // Render method for background layers
  const renderBackgroundLayer = () => {
    const backgroundLayer = sortedLayers.find(
      (l) => l.get("layerType") === "base"
    );

    if (!backgroundLayer) {
      return;
    }

    const key = backgroundLayer.isFakeMapLayer
      ? backgroundLayer.get("caption")
      : backgroundLayer.ol_uid;

    return (
      <DrawOrderListItem
        key={key}
        layer={backgroundLayer}
        isBackgroundLayer={true}
        settingIsActive={activeSetting === key}
        settingClickCallback={toggleSettings}
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
          backgroundColor: (theme) => theme.palette.grey[100],
        }}
      >
        <Stack direction="row" alignItems="center">
          <Tooltip
            title={`${layerVisibleToggle ? "Släck" : "Tänd"} alla lager`}
          >
            <IconButton onClick={handleVisibilityButtonClick}>
              {layerVisibleToggle ? (
                <VisibilityOffOutlinedIcon />
              ) : (
                <VisibilityOutlinedIcon />
              )}
            </IconButton>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={handleInfoButtonClick}>
            <Tooltip title={infoIsActive ? "Dölj info" : "Visa info"}>
              <InfoOutlinedIcon />
            </Tooltip>
          </IconButton>
          <DrawOrderOptions
            app={app}
            setSystemFilter={setSystemFilter}
            systemFilterActive={systemFilterActive}
            map={map}
          />
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
              Lorem ipsum is placeholder text commonly used in the graphic,
              print, and publishing industries for previewing layouts and visual
              mockups.
            </Typography>
          </Box>
        </Collapse>
      </Box>
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
        {renderBackgroundLayer()}
      </List>
    </Box>
  );
}

export default DrawOrder;
