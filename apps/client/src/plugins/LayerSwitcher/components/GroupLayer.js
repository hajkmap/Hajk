import React, { useState } from "react";

import { Box, Collapse, IconButton } from "@mui/material";

import LayerItem from "./LayerItem";
import SubLayerItem from "./SubLayerItem";

import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";

import { useMapZoom } from "../LayerSwitcherProvider";
import { useLayerSwitcherDispatch } from "../LayerSwitcherProvider";

/* A grouplayer is a layer configured with multiple layers in admin, NOT a group in layerswitcher */

export default function GroupLayer({
  layerState,
  layerConfig,
  globalObserver,
  toggleable,
  draggable,
  display,
  filterSubLayers,
}) {
  const { layerIsToggled, visibleSubLayers } = layerState;

  const {
    layerId,
    // layerCaption,
    // layerType,
    layerMinZoom,
    layerMaxZoom,
    // numberOfSubLayers,
    layerInfo,
    // layerLegendIcon,
    allSubLayers,
  } = layerConfig;

  const [showSublayers, setShowSublayers] = useState(false);

  const layerSwitcherDispatch = useLayerSwitcherDispatch();

  const setSubLayerVisible = (subLayer) => {
    layerSwitcherDispatch.setSubLayerVisibility(layerId, subLayer, true);
  };

  const setSubLayerHidden = (subLayer) => {
    layerSwitcherDispatch.setSubLayerVisibility(layerId, subLayer, false);
  };

  const handleLayerItemClick = () => {
    if (layerIsToggled) {
      layerSwitcherDispatch.setLayerVisibility(layerId, false);
    } else {
      layerSwitcherDispatch.setLayerVisibility(layerId, true);
    }
  };

  const toggleSubLayer = (subLayer, visible) => {
    if (visible) {
      setSubLayerHidden(subLayer);
    } else {
      setSubLayerVisible(subLayer);
    }
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
    const foundSubLayer = filterSubLayers?.find((sl) => sl.id === subLayer);
    return foundSubLayer ? foundSubLayer.isFiltered : false;
  };

  const mapZoom = useMapZoom();

  const layerIsVisibleAtZoom =
    mapZoom >= layerMinZoom && mapZoom <= layerMaxZoom;

  return (
    <LayerItem
      display={display}
      layerState={layerState}
      layerConfig={layerConfig}
      globalObserver={globalObserver}
      showSublayers={showSublayers}
      draggable={draggable}
      toggleable={toggleable}
      clickCallback={handleLayerItemClick}
      visibleSubLayers={visibleSubLayers}
      expandableSection={
        layerInfo.hideExpandArrow !== true && (
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
              onClick={(_) => setShowSublayers(!showSublayers)}
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
        <Collapse in={showSublayers} unmountOnExit>
          <Box sx={{ marginLeft: 3 }}>
            {allSubLayers?.map((subLayer, index) => (
              <SubLayerItem
                style={{ displaye: showSublayer(subLayer) ? "block" : "none" }}
                key={subLayer}
                subLayer={subLayer}
                subLayerIndex={index}
                layerId={layerConfig.layerId}
                layersInfo={layerConfig.layerInfo.layersInfo}
                toggleable={toggleable}
                globalObserver={globalObserver}
                visible={visibleSubLayers.some((s) => s === subLayer)}
                toggleSubLayer={toggleSubLayer}
                zoomVisible={layerIsVisibleAtZoom}
              ></SubLayerItem>
            ))}
          </Box>
        </Collapse>
      }
    ></LayerItem>
  );
}
