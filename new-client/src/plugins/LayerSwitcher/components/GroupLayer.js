import React, { useEffect, useState, useCallback } from "react";

import { Box, Collapse, IconButton } from "@mui/material";

import LayerItem from "./LayerItem";
import SubLayerItem from "./SubLayerItem";

import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";

// Custom hooks
import useSnackbar from "../../../hooks/useSnackbar";

/* A grouplayer is a layer configured with multiple layers in admin, NOT a group in layerswitcher */

export default function GroupLayer({
  layer,
  app,
  observer,
  toggleable,
  draggable,
  quickAccessLayer,
  display,
  filterValue,
  groupLayer,
}) {
  // Keep the subLayers area active in state
  const [showSublayers, setShowSublayers] = useState(false);
  // Keep visible sublayers in state
  const [visibleSubLayers, setVisibleSubLayers] = useState(
    layer.get("visible")
      ? quickAccessLayer || draggable
        ? layer.get("subLayers")
        : layer.visibleAtStartSubLayers?.length > 0
        ? layer.visibleAtStartSubLayers
        : layer.subLayers
      : []
  );
  const [zoomVisible, setZoomVisible] = useState(true);
  const [subLayerClicked, setSubLayerClicked] = useState(false);

  const { removeFromSnackbar } = useSnackbar();

  // Special case for removing layer captions from snackbar message when being toggled
  // through the LayerGroup component.
  useEffect(() => {
    if (visibleSubLayers.length === 0) {
      const removeLayerCaptions = layer.subLayers.map(
        (subLayer) => layer.layersInfo[subLayer]?.caption || ""
      );
      // Remove layer caption from snackbar message.
      removeFromSnackbar(removeLayerCaptions);
    }
  }, [visibleSubLayers]);

  const setGroupHidden = useCallback(
    (l) => {
      if (l.get("name") === layer.get("name")) {
        // Update OL layer sublayers property
        layer.set("subLayers", []);
        // Update visibleSubLayers state
        setVisibleSubLayers([]);
      }
    },
    [layer]
  );

  const setSubLayers = (visibleSubLayersArray) => {
    // Check if layer is visible
    let layerVisibility = layer.get("visible");
    // If layer is not visible and remaining visible subLayers exists, layer should turn visible
    if (!layerVisibility && visibleSubLayersArray.length > 0) {
      layerVisibility = true;
    }

    // If remaining visible subLayers are zero, layer should turn not visible
    if (visibleSubLayersArray.length === 0) {
      layerVisibility = false;
    }

    // If remaining visible subLayers exists, set layer visibility and set visibleSubLayers state
    if (visibleSubLayersArray.length >= 1) {
      layer.setVisible(layerVisibility);
      layer.set("subLayers", visibleSubLayersArray);
    } else {
      // Otherwise, set OL layer subLayers property to empty array
      layer.set("subLayers", []);
    }
  };

  const setSubLayerVisible = (subLayer) => {
    // Clone visibleSubLayers state
    let visibleSubLayersArray = [...visibleSubLayers];
    // Push subLayer to visibleSubLayersArray and set component state
    visibleSubLayersArray.push(subLayer);
    setSubLayers(visibleSubLayersArray);
  };

  // Gets added subLayers and removes the one that user clicked on, then passes the array to setSubLayers
  const setSubLayerHidden = (subLayer) => {
    // Clone visibleSubLayers state
    let visibleSubLayersArray = [...visibleSubLayers];
    // Get remaining visible subLayers
    visibleSubLayersArray = visibleSubLayersArray.filter(
      (visibleSubLayer) => visibleSubLayer !== subLayer
    );
    setSubLayers(visibleSubLayersArray);
  };

  const setGroupVisible = useCallback(
    (la) => {
      let l,
        subLayersToShow = null;

      // If the incoming parameter is an object that contains additional subLayersToShow,
      // let's filter out the necessary objects from it
      if (la.hasOwnProperty("layer") && la.hasOwnProperty("subLayersToShow")) {
        subLayersToShow = la.subLayersToShow;
        l = la.layer;
      } else {
        // In this case the incoming parameter is the actual OL Layer and there is
        // no need to further filter. Just set subLayers to everything that's in this
        // layer, and the incoming object itself as the working 'l' variable.
        subLayersToShow = layer.subLayers;
        l = la;
      }

      // Now we can be sure that we have the working 'l' variable and can compare
      // it to the 'layer' object in current props. Note that this is necessary, as
      // every single LayerGroupItem is subscribing to the event that calls this method,
      // so without this check we'd end up running this for every LayerGroupItem, which
      // is not intended.
      if (l === layer) {
        // Show the OL layer
        layer.setVisible(true);
        // Update OL layer subLayers property
        layer.set("subLayers", subLayersToShow);
        // Update visibleSubLayers state
        setVisibleSubLayers(subLayersToShow);
      }
    },
    [layer]
  );

  // Register subscriptions for groupLayer.
  useEffect(() => {
    const subLayerChangedSubscription = app.globalObserver.subscribe(
      "core.layerSubLayersChanged",
      (l) => {
        if (l.target.get("name") === layer.get("name")) {
          setVisibleSubLayers(l.target.get("subLayers"));
        }
      }
    );

    const layerswitcherHideLayerSubscription = app.globalObserver.subscribe(
      "layerswitcher.hideLayer",
      setGroupHidden
    );
    const layerswitcherShowLayerSubscription = app.globalObserver.subscribe(
      "layerswitcher.showLayer",
      setGroupVisible
    );
    const hideLayerSubscription = observer.subscribe(
      "hideLayer",
      setGroupHidden
    );
    const showLayerSubscription = observer.subscribe(
      "showLayer",
      setGroupVisible
    );

    // Unsubscribe when component unmounts
    return () => {
      layerswitcherHideLayerSubscription.unsubscribe();
      layerswitcherShowLayerSubscription.unsubscribe();
      hideLayerSubscription.unsubscribe();
      showLayerSubscription.unsubscribe();
      subLayerChangedSubscription.unsubscribe();
    };
  }, [app.globalObserver, observer, setGroupHidden, setGroupVisible, layer]);

  // When visibleSubLayers state changes, update layer params
  useEffect(() => {
    const visibleSubLayersArray = [...visibleSubLayers];
    if (visibleSubLayersArray.length === 0) {
      // Fix underlying source
      layer.getSource().updateParams({
        // Ensure that the list of sublayers is emptied (otherwise they'd be
        // "remembered" the next time user toggles group)
        LAYERS: "",
        // Remove any filters
        CQL_FILTER: null,
      });

      // Hide the layer in OL
      layer.setVisible(false);
      // layer.set("subLayers", []);
    } else {
      // Set LAYERS and STYLES so that the exact sublayers that are needed
      // will be visible
      layer.getSource().updateParams({
        // join(), so we always provide a string as value to LAYERS
        LAYERS: visibleSubLayersArray.join(),
        // Filter STYLES to only contain styles for currently visible layers,
        // and maintain the order from layersInfo (it's crucial that the order
        // of STYLES corresponds exactly to the order of LAYERS!)
        STYLES: Object.entries(layer.layersInfo)
          .filter((k) => visibleSubLayersArray.indexOf(k[0]) !== -1)
          .map((l) => l[1].style)
          .join(","),
        CQL_FILTER: null,
      });
    }
  }, [visibleSubLayers, layer]);

  // Handles list item click
  const handleLayerItemClick = () => {
    if (layer.get("visible")) {
      const removeLayerCaptions = layer.subLayers.map(
        (subLayer) => layer.layersInfo[subLayer]?.caption || ""
      );

      // Remove layer caption from snackbar message.
      removeFromSnackbar(removeLayerCaptions);
      // Hide the layer.
      setGroupHidden(layer);
    } else {
      // Show the layer.
      setGroupVisible(layer);
    }
  };

  // Toggles a subLayer
  const toggleSubLayer = (subLayer, visible) => {
    if (visible) {
      setSubLayerHidden(subLayer);
    } else {
      setSubLayerVisible(subLayer);
    }
    setSubLayerClicked(!visible);
  };

  // Toggles sublayers section
  const toggleShowSublayers = (e) => {
    e.stopPropagation();
    setShowSublayers(!showSublayers);
  };

  // Determines visibility of subLayer
  // If the groupLayer is not toggleable
  // then the sublayer should only be visible if it's included in visibleSubLayers
  const showSublayer = (subLayer) => {
    if (toggleable) {
      return isSubLayerFiltered(subLayer);
    } else if (visibleSubLayers.includes(subLayer)) {
      return true;
    }
    return false;
  };

  const isSubLayerFiltered = (subLayer) => {
    const foundSubLayer = groupLayer.subLayers.find((sl) => sl.id === subLayer);
    return foundSubLayer ? foundSubLayer.isFiltered : false;
  };

  return (
    <LayerItem
      display={display}
      layer={layer}
      app={app}
      showSublayers={showSublayers}
      draggable={draggable}
      toggleable={toggleable}
      clickCallback={handleLayerItemClick}
      visibleSubLayers={visibleSubLayers}
      visibleSubLayersCaption={visibleSubLayers.map(
        (subLayer) => layer.layersInfo[subLayer]?.caption || ""
      )}
      onSetZoomVisible={setZoomVisible}
      subLayerClicked={subLayerClicked}
      toggleSubLayer={toggleSubLayer}
      expandableSection={
        layer.get("layerInfo").hideExpandArrow !== true && (
          <Box>
            <IconButton
              sx={{
                p: draggable ? 0 : "3px",
                pr: draggable ? 0 : "4px",
                top: "50%",
                mt: "-25px",
                mr: draggable ? "5px" : 0,
              }}
              size="small"
              onClick={(e) => toggleShowSublayers(e)}
            >
              <KeyboardArrowRightOutlinedIcon
                sx={{
                  transform: showSublayers ? "rotate(90deg)" : "",
                  transition: "transform 300ms ease",
                }}
              ></KeyboardArrowRightOutlinedIcon>
            </IconButton>
          </Box>
        )
      }
      subLayersSection={
        <Collapse in={showSublayers}>
          <Box sx={{ marginLeft: 3 }}>
            {layer.subLayers.map((subLayer, index) => (
              <SubLayerItem
                display={showSublayer(subLayer) ? "block" : "none"}
                key={subLayer}
                subLayer={subLayer}
                subLayerIndex={index}
                layer={layer}
                toggleable={toggleable}
                app={app}
                visible={visibleSubLayers.some((s) => s === subLayer)}
                toggleSubLayer={toggleSubLayer}
                zoomVisible={zoomVisible}
              ></SubLayerItem>
            ))}
          </Box>
        </Collapse>
      }
    ></LayerItem>
  );
}
