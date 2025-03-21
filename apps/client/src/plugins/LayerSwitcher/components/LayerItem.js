import React, { useEffect, useState, memo } from "react";

// Material UI components
import {
  Box,
  IconButton,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  useTheme,
} from "@mui/material";
import HajkToolTip from "components/HajkToolTip";

import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";

// Custom components
import LegendIcon from "./LegendIcon";
import LegendImage from "./LegendImage";

import { useMapZoom } from "../LayerSwitcherProvider";
import { useLayerSwitcherDispatch } from "../LayerSwitcherProvider";

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

const LayerToggleComponent = ({ toggleState }) => {
  return (
    <IconButton disableTouchRipple size="small" className="BUTTON333" sx={{}}>
      <CheckBoxOutlineBlankIcon />
      <Box
        sx={{
          position: "absolute",
          top: "calc(50%)",
          left: "50%",
          transition: "transform 200ms ease, opacity 200ms ease",
          transform:
            toggleState !== "unchecked"
              ? "translate(-50%, -50%)  scale(1.05)"
              : "translate(-50%, -50%) scale(0.0)",
          opacity: toggleState !== "unchecked" ? 1.0 : 0.0,
          lineHeight: 0,
        }}
      >
        <CheckBoxIcon
          sx={
            {
              semichecked: { fill: "gray" },
              checkedWithWarning: {
                fill: (theme) => theme.palette.warning.dark,
              },
            }[toggleState]
          }
        />
        {}
      </Box>
    </IconButton>
  );
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
    return <BuildOutlinedIcon sx={{ mr: "5px" }} />;
  }

  if (layerShouldShowLegendIcon(layerType, isFakeMapLayer)) {
    return null;
  }

  return (
    <HajkToolTip
      sx={{ pointerEvents: "none" }}
      placement="left"
      title={legendIsActive ? "Dölj teckenförklaring" : "Visa teckenförklaring"}
    >
      <IconButton
        className="BUTTON444"
        sx={{ p: 0.25, mt: 0.5, mr: "5px" }}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          toggleLegend();
        }}
      >
        <FormatListBulletedOutlinedIcon fontSize="small" />
      </IconButton>
    </HajkToolTip>
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
    return (
      wmsLayerLoadStatus === "loaderror" && (
        <HajkToolTip
          disableInteractive
          title="Lagret kunde inte laddas in. Kartservern svarar inte."
        >
          <IconButton
            disableRipple
            className="BUTTON555"
            sx={{
              p: "3px",
              backgroundColor:
                theme.palette.mode === "dark"
                  ? theme.palette.grey[800]
                  : theme.palette.grey[200],
            }}
          >
            <WarningAmberOutlinedIcon
              fontSize="small"
              sx={{ marginTop: "-1px", color: theme.palette.warning.main }}
            />
          </IconButton>
        </HajkToolTip>
      )
    );
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
      className="layer-item DIV111"
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
        className="BOX111"
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
          <IconButton
            disableTouchRipple
            sx={{
              px: 0,
              opacity: 0,
              transition: "opacity 200ms",
            }}
            className="dragInidcatorIcon BUTTON777"
          >
            <HajkToolTip placement="left" title="Dra för att ändra ritordning">
              <DragIndicatorOutlinedIcon fontSize={"small"} />
            </HajkToolTip>
          </IconButton>
        )}
        {expandableSection && expandableSection}
        <ListItemButton
          className="layer-item-button ListItemButton11111 BUTTON777"
          disableTouchRipple
          onClick={toggleable ? handleLayerItemClick : null}
          sx={{
            p: 0,
            ml: 0,
          }}
          dense
        >
          <Box
            className="BOX222"
            sx={{
              display: "flex",
              position: "relative",
              width: "100%",
              alignItems: "flex-start",
              py: 0.25, // jesade-vbg compact mode
              pr: 1,
              pl: "2px",
              borderBottom: (theme) => renderBorder(theme),
            }}
          >
            {toggleable && <LayerToggleComponent toggleState={toggleState} />}
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
              className="ListItemSecondaryAction"
              sx={{
                position: "absolute",
                right: "4px",
                top: "1px",
                transform: "none",
              }}
            >
              {renderStatusIcon()}
              {!toggleable && !draggable ? (
                <IconButton
                  size="small"
                  disableTouchRipple
                  className="BUTTON111"
                >
                  <HajkToolTip title="Bakgrundskartan ligger låst längst ner i ritordningen">
                    <LockOutlinedIcon />
                  </HajkToolTip>
                </IconButton>
              ) : null}
              {layerIsFakeMapLayer !== true && layerType !== "system" && (
                <IconButton
                  size="small"
                  onClick={(e) => showLayerDetails(e)}
                  className="BUTTON222"
                  sx={{
                    "&:hover .ls-arrow": {
                      transform: "translateX(3px)",
                    },
                  }}
                >
                  <KeyboardArrowRightOutlinedIcon
                    className="ls-arrow"
                    sx={{
                      transition: "transform 300ms ease",
                      color: (theme) => theme.palette.grey[500],
                    }}
                  ></KeyboardArrowRightOutlinedIcon>
                </IconButton>
              )}
            </ListItemSecondaryAction>
          </Box>
        </ListItemButton>
      </Box>
      <Box
        sx={{
          paddingLeft: expandableSection ? 3.75 : 0,
          // backgroundColor: "red",
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
