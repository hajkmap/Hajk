import React, { useEffect, useState, memo } from "react";

// Material UI components
import {
  Box,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  useTheme,
} from "@mui/material";
import HajkToolTip from "components/HajkToolTip";

import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

// Custom components
import LegendIcon from "./LegendIcon";
import LegendImage from "./LegendImage";
import LsIconButton from "./LsIconButton";
import BtnShowDetails from "./BtnShowDetails";
import BtnLayerWarning from "./BtnLayerWarning";
import BtnShowLegend from "./BtnShowLegend";
import LsCheckBox from "./LsCheckBox";

import { useMapZoom } from "../LayerSwitcherProvider";
import { useLayerSwitcherDispatch } from "../LayerSwitcherProvider";
import { getIsMobile } from "../LayerSwitcherUtils";

const getLayerToggleState = (isToggled, isSemiToggled, isVisibleAtZoom) => {
  if (!isToggled) {
    return "unchecked";
  }
  if (!isVisibleAtZoom) {
    return "checkedWithWarning";
  }
  if (isSemiToggled) {
    return "semichecked";
  }
  if (isToggled) {
    return "checked";
  }
  return "unchecked";
};

const layerShouldShowLegendIcon = (layerType, isFakeMapLayer) =>
  layerType === "group" ||
  layerType === "base" ||
  isFakeMapLayer ||
  layerType === "system";

const LayerLegendIcon = ({
  legendIcon,
  layerType,
  isFakeMapLayer,
  legendIsActive,
  toggleLegend,
}) => {
  const layerLegendIcon = legendIcon;
  if (layerLegendIcon !== undefined) {
    return <LegendIcon url={layerLegendIcon} />;
  } else if (layerType === "system") {
    return (
      <BuildOutlinedIcon
        sx={{
          display: "block",
          mr: "5px",
          mt: "6px",
          width: "18px",
          height: "18px",
        }}
      />
    );
  }

  if (layerShouldShowLegendIcon(layerType, isFakeMapLayer)) {
    return null;
  }

  return (
    <BtnShowLegend
      legendIsActive={legendIsActive}
      onClick={() => toggleLegend()}
    />
  );
};

function LayerItem({
  layerState,
  layerConfig,
  clickCallback,
  draggable,
  toggleable,
  globalObserver,
  display,
  visibleSubLayers,
  expandableSection,
  showSublayers,
  subLayersSection,
}) {
  // WmsLayer load status, shows warning icon if !ok
  const [wmsLayerLoadStatus, setWmsLayerLoadStatus] = useState("ok");
  // State that toggles legend collapse
  const [legendIsActive, setLegendIsActive] = useState(false);
  const theme = useTheme();

  const mapZoom = useMapZoom();

  const { layerIsToggled } = layerState ?? {};

  const {
    layerId,
    layerCaption,
    layerType,

    layerIsFakeMapLayer,
    layerMinZoom,
    layerMaxZoom,
    allSubLayers,
    layerInfo,
    layerLegendIcon,
  } = layerConfig ?? {};

  const legendIcon = layerInfo?.legendIcon || layerLegendIcon;

  useEffect(() => {
    const handleLoadStatusChange = (d) => {
      if (wmsLayerLoadStatus !== "loaderror" && layerId === d.id) {
        setWmsLayerLoadStatus(d.status);
      }
    };

    // Subscribe to layer load status.
    const loadStatusSubscription = globalObserver.subscribe(
      "layerswitcher.wmsLayerLoadStatus",
      handleLoadStatusChange
    );

    // Cleanup function to unsubscribe when the component unmounts or if the relevant dependencies change.
    return () =>
      globalObserver.unsubscribe(
        "layerswitcher.wmsLayerLoadStatus",
        loadStatusSubscription
      );
  }, [globalObserver, layerId, wmsLayerLoadStatus]);

  const layerSwitcherDispatch = useLayerSwitcherDispatch();

  // Handles list item click
  const handleLayerItemClick = (e) => {
    // If a clickCallback is defined, call it.
    if (clickCallback) {
      clickCallback();
      return;
    }

    // Handle system layers by showing layer details directly
    if (layerType === "system") {
      showLayerDetails(e);
      return;
    }

    // Toggle visibility for non-system layers
    // This check is technically redundant now but left for clarity
    if (layerType !== "system") {
      layerSwitcherDispatch.setLayerVisibility(layerId, !layerIsToggled);
    }
  };

  const layerIsSemiToggled =
    layerType === "groupLayer" &&
    visibleSubLayers.length !== allSubLayers.length;

  const layerIsVisibleAtZoom =
    mapZoom >= layerMinZoom && mapZoom <= layerMaxZoom;

  const toggleState = getLayerToggleState(
    layerIsToggled,
    layerIsSemiToggled,
    layerIsVisibleAtZoom
  );

  /**
   * Render the load information component.
   * @instance
   * @return {external:ReactElement}
   */
  const renderStatusIcon = () => {
    return wmsLayerLoadStatus === "loaderror" && <BtnLayerWarning />;
  };

  // Show layer details action
  const showLayerDetails = (e) => {
    e.stopPropagation();
    globalObserver.publish("setLayerDetails", { layerId });
  };

  const drawOrderItem = () => {
    if (draggable) {
      return true;
    }
    return false;
  };

  const renderBorder = (theme) => {
    if (drawOrderItem()) {
      return "none";
    }
    if (legendIsActive) {
      return `${theme.spacing(0.2)} solid transparent`;
    }
    return `${theme.spacing(0.2)} solid ${theme.palette.divider}`;
  };

  const legendUrls =
    Array.isArray(layerInfo?.legend) && layerInfo?.legend.map((l) => l?.url);

  return (
    <div
      className="layer-item"
      style={{
        display: display,
        marginLeft: expandableSection || draggable ? 0 : "31px",
        borderBottom:
          legendIsActive || (drawOrderItem() && showSublayers)
            ? `${theme.spacing(0.2)} solid ${theme.palette.divider}`
            : "none",
      }}
    >
      <Box
        sx={{
          position: "relative",
          alignItems: "flex-start",
          borderBottom: (theme) =>
            drawOrderItem() && showSublayers
              ? "none"
              : drawOrderItem() && !legendIsActive
                ? `${theme.spacing(0.2)} solid ${theme.palette.divider}`
                : "none",
          display: "flex",
          "&:hover .dragInidcatorIcon": {
            opacity: draggable ? 1 : 0,
          },
        }}
      >
        {draggable && (
          <LsIconButton
            disableRipple
            sx={{
              px: 0,
              pt: "7px",
              opacity: 0,
              transition: "opacity 200ms",
            }}
            className="dragInidcatorIcon"
          >
            <HajkToolTip placement="left" title="Dra för att ändra ritordning">
              <DragIndicatorOutlinedIcon
                sx={{ pt: "1px" }}
                fontSize={"small"}
              />
            </HajkToolTip>
          </LsIconButton>
        )}
        {expandableSection && expandableSection}
        <ListItemButton
          disableTouchRipple
          onClick={toggleable ? handleLayerItemClick : null}
          sx={{
            p: 0,
            ml: 0,
          }}
          dense
        >
          <Box
            sx={{
              display: "flex",
              position: "relative",
              width: "100%",
              alignItems: "flex-start",
              py: getIsMobile() ? 0.5 : 0.25, // jesade-vbg compact mode, changed from py: 0.5
              pr: 1,
              pl: "2px",
              borderBottom: (theme) => renderBorder(theme),
            }}
          >
            {toggleable && <LsCheckBox toggleState={toggleState} />}
            <LayerLegendIcon
              legendIcon={legendIcon}
              layerType={layerType}
              isFakeMapLayer={layerIsFakeMapLayer}
              legendIsActive={legendIsActive}
              toggleLegend={() => setLegendIsActive(!legendIsActive)}
            />
            <ListItemText
              primary={layerCaption}
              primaryTypographyProps={{
                pr: 5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                variant: "body1",
                fontWeight: layerIsToggled && !draggable ? "bold" : "inherit",
              }}
            />
            <ListItemSecondaryAction
              sx={{
                position: "absolute",
                right: "4px",
                top: "1px",
                transform: "none",
              }}
            >
              {renderStatusIcon()}
              {!toggleable && !draggable ? (
                <LsIconButton size="small">
                  <HajkToolTip title="Bakgrundskartan ligger låst längst ner i ritordningen">
                    <LockOutlinedIcon />
                  </HajkToolTip>
                </LsIconButton>
              ) : null}
              {layerIsFakeMapLayer !== true && layerType !== "system" && (
                <BtnShowDetails onClick={(e) => showLayerDetails(e)} />
              )}
            </ListItemSecondaryAction>
          </Box>
        </ListItemButton>
      </Box>
      <Box
        sx={{
          paddingLeft: expandableSection ? "30px" : 0,
          ".ls-draworder-tab-view &": {
            // special styling for draw order tab
            paddingLeft: expandableSection ? "30px" : "20px",
          },
        }}
      >
        {layerShouldShowLegendIcon(layerType, layerIsFakeMapLayer) ? null : (
          <LegendImage src={legendUrls} open={legendIsActive}></LegendImage>
        )}
      </Box>

      {subLayersSection && subLayersSection}
    </div>
  );
}

export default memo(LayerItem);
