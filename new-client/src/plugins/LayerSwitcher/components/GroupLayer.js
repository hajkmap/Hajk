import React, { useEffect, useState } from "react";

import { Box, Collapse, IconButton } from "@mui/material";

import LayerItem from "./LayerItem";
import SubLayerItem from "./SubLayerItem";

import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";

/* A grouplayer is a layer configured with multiple layers in admin, NOT a group in layerswitcher */

export default function GroupLayer({
  layer,
  app,
  model,
  toggleable,
  options,
  draggable,
}) {
  // Keep the subLayers area active in state
  const [showSublayers, setShowSublayers] = useState(false);
  // Keep visible sublayers in state
  const [visibleSubLayers, setVisibleSubLayers] = useState(
    layer.get("visible")
      ? layer.visibleAtStartSubLayers?.length > 0
        ? layer.visibleAtStartSubLayers
        : layer.subLayers
      : []
  );

  // When component is successfully mounted into the DOM.
  useEffect(() => {
    model.globalObserver.subscribe("layerswitcher.hideLayer", setGroupHidden);
    model.globalObserver.subscribe("layerswitcher.showLayer", setGroupVisible);
    model.observer.subscribe("hideLayer", setGroupHidden);
    model.observer.subscribe("showLayer", setGroupVisible);
  }, []);

  // Handles list item click
  const handleLayerItemClick = () => {
    if (layer.get("visible")) {
      setGroupHidden(layer);
    } else {
      setGroupVisible(layer);
    }
  };

  const setGroupHidden = (l) => {
    if (l.get("name") === layer.get("name")) {
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

      // Update UI state
      setVisibleSubLayers([]);
    }
  };

  const setGroupVisible = (la) => {
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

      // Set LAYERS and STYLES so that the exact sublayers that are needed
      // will be visible
      layer.getSource().updateParams({
        // join(), so we always provide a string as value to LAYERS
        LAYERS: subLayersToShow.join(),
        CQL_FILTER: null,
        // Extract .style property from each sub layer.
        // Join them into a string that will be used to
        // reset STYLES param for the GET request.
        STYLES: Object.entries(layer.layersInfo)
          .filter((k) => subLayersToShow.indexOf(k[0]) !== -1)
          .map((l) => l[1].style)
          .join(","),
      });

      setVisibleSubLayers(subLayersToShow);
    }
  };

  const toggleSubLayer = (subLayer) => {
    let visibleSubLayersArray = [...visibleSubLayers];
    const isVisible = visibleSubLayersArray.some(
      (visibleSubLayer) => visibleSubLayer === subLayer
    );

    let layerVisibility = layer.get("visible");

    if (isVisible) {
      visibleSubLayersArray = visibleSubLayersArray.filter(
        (visibleSubLayer) => visibleSubLayer !== subLayer
      );
    } else {
      visibleSubLayersArray.push(subLayer);
    }

    if (!layerVisibility && visibleSubLayersArray.length > 0) {
      layerVisibility = true;
    }

    if (visibleSubLayersArray.length === 0) {
      layerVisibility = false;
    }

    if (visibleSubLayersArray.length >= 1) {
      // Create an Array to be used as STYLES param, it should only contain selected sublayers' styles
      let visibleSubLayersStyles = [];
      visibleSubLayersArray.forEach((subLayer) => {
        visibleSubLayersStyles.push(layer.layersInfo[subLayer].style);
      });

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
      layer.setVisible(layerVisibility);
      setVisibleSubLayers(visibleSubLayersArray);
    } else {
      setGroupHidden(layer);
    }
  };

  // Toogles sublayers section
  const toggleShowSublayers = (e) => {
    e.stopPropagation();
    setShowSublayers(!showSublayers);
  };

  return (
    <LayerItem
      layer={layer}
      app={app}
      draggable={draggable}
      toggleable={toggleable}
      clickCallback={handleLayerItemClick}
      visibleSubLayers={visibleSubLayers}
      expandableSection={
        layer.get("layerInfo").hideExpandArrow !== true && (
          <IconButton
            sx={{ p: draggable ? 0 : "5px", mr: draggable ? "5px" : 0 }}
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
        )
      }
      subLayersSection={
        <Collapse in={showSublayers}>
          <Box sx={{ marginLeft: "40px" }}>
            {layer.subLayers.map((subLayer, index) => (
              <SubLayerItem
                key={subLayer}
                options={options}
                subLayer={subLayer}
                subLayerIndex={index}
                layer={layer}
                toggleable={toggleable}
                app={app}
                visible={visibleSubLayers.some((s) => s === subLayer)}
                toggleSubLayer={toggleSubLayer}
              ></SubLayerItem>
            ))}
          </Box>
        </Collapse>
      }
    ></LayerItem>
  );
}
