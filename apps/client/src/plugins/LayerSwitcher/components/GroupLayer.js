import React, { useState, memo } from "react";

import { Box, Collapse, IconButton } from "@mui/material";

import LayerItem from "./LayerItem";
import SubLayerItem from "./SubLayerItem";

import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";

import { useMapZoom } from "../LayerSwitcherProvider";
import { useLayerSwitcherDispatch } from "../LayerSwitcherProvider";
import { getIsMobile } from "../LayerSwitcherUtils";

/* A grouplayer is a layer configured with multiple layers in admin, NOT a group in layerswitcher */

function GroupLayer({
  layerState,
  layerConfig,
  globalObserver,
  toggleable,
  draggable,
  display,
  filterHits,
  filterValue,
}) {
  const { layerIsToggled, visibleSubLayers } = layerState;

  const { layerId, layerMinZoom, layerMaxZoom, layerInfo, allSubLayers } =
    layerConfig;

  const [showSublayers, setShowSublayers] = useState(false);

  const layerSwitcherDispatch = useLayerSwitcherDispatch();

  const setSubLayerVisible = (subLayer) => {
    layerSwitcherDispatch.setSubLayerVisibility(layerId, subLayer, true);
  };

  const setSubLayerHidden = (subLayer) => {
    layerSwitcherDispatch.setSubLayerVisibility(layerId, subLayer, false);
  };

  const lowercaseFilterValue = filterValue?.toLocaleLowerCase();
  // Find out which (if any) sublayer is the filter hit
  const subLayersToShow = filterHits
    ? allSubLayers.filter((sl) => {
        const subLayerCaption = layerInfo?.layersInfo[sl]?.caption;
        return subLayerCaption
          ?.toLocaleLowerCase()
          ?.includes(lowercaseFilterValue);
      })
    : allSubLayers;

  // Is the filter hit on a sub layer or on the GroupLayer Captions?
  const isSubLayerFilterHit = filterHits && subLayersToShow.length > 0;

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

  const mapZoom = useMapZoom();

  const layerIsVisibleAtZoom =
    mapZoom >= layerMinZoom && mapZoom <= layerMaxZoom;

  // if `hideExpandArrow` option is set then no sublayers should be shown when
  // searching.
  const subLayerSectionOpen =
    layerInfo?.hideExpandArrow === true
      ? false
      : showSublayers || isSubLayerFilterHit;

  // If there is an active search we don't want to show the expand arrow since
  // it does not do anything.
  const showExpandArrow =
    layerInfo.hideExpandArrow !== true && !isSubLayerFilterHit;

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
        showExpandArrow && (
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignSelf: "stretch",
              alignItems: "flex-start",
            }}
          >
            <IconButton
              sx={{
                p: draggable ? 0 : "3px",
                pr: draggable ? 0 : "4px",
                mr: draggable ? "5px" : 0,
                mt: draggable ? "5px" : "3px",
                "& .ls-arrow": {
                  transform: showSublayers ? "rotate(90deg)" : "",
                  transition: "transform 300ms ease",
                },
                "&:hover .ls-arrow": {
                  transform: showSublayers
                    ? "rotate(90deg) translateX(-3px)"
                    : "translateX(3px)",
                },
              }}
              size="small"
              onClick={(_) => setShowSublayers(!showSublayers)}
            >
              <KeyboardArrowRightOutlinedIcon
                sx={{
                  mt: getIsMobile() ? "2px" : "0px", // jesade-vbg compact mode
                }}
                className="ls-arrow"
              ></KeyboardArrowRightOutlinedIcon>
            </IconButton>
          </Box>
        )
      }
      subLayersSection={
        <Collapse in={subLayerSectionOpen} unmountOnExit>
          <Box sx={{ marginLeft: 3 }}>
            {subLayersToShow?.map((subLayer) => (
              <SubLayerItem
                key={subLayer}
                subLayer={subLayer}
                layerId={layerConfig.layerId}
                layerConfig={layerConfig}
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

export default memo(GroupLayer);
