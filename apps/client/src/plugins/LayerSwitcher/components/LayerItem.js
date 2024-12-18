import React, { useEffect, useState } from "react";

// Material UI components
import {
  Box,
  IconButton,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
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
    <IconButton disableRipple size="small" sx={{ pl: 0 }}>
      {
        {
          checked: <CheckBoxIcon />,
          semichecked: <CheckBoxIcon sx={{ fill: "gray" }} />,
          unchecked: <CheckBoxOutlineBlankIcon />,
          checkedWithWarning: (
            <CheckBoxIcon
              sx={{ fill: (theme) => theme.palette.warning.dark }}
            />
          ),
        }[toggleState]
      }
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
    <Tooltip
      placement="left"
      title={legendIsActive ? "Dölj teckenförklaring" : "Visa teckenförklaring"}
    >
      <IconButton
        sx={{ p: 0.25, mr: "5px" }}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          toggleLegend();
        }}
      >
        <FormatListBulletedOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default function LayerItem({
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

  const { layerIsToggled } = layerState;

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
    wmsLoadError,
    filterValue,
  } = layerConfig;

  const legendIcon = layerInfo?.legendIcon || layerLegendIcon;

  // console.log("loadStatus", layerCaption, wmsLoadError);
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
        <IconButton disableRipple>
          <HajkToolTip
            disableInteractive
            title="Lagret kunde inte laddas in. Kartservern svarar inte."
          >
            <WarningAmberOutlinedIcon fontSize="small" />
          </HajkToolTip>
        </IconButton>
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
            disableRipple
            sx={{
              px: 0,
              opacity: 0,
              transition: "opacity 200ms",
            }}
            className="dragInidcatorIcon"
          >
            <Tooltip placement="left" title="Dra för att ändra ritordning">
              <DragIndicatorOutlinedIcon fontSize={"small"} />
            </Tooltip>
          </IconButton>
        )}
        {expandableSection && expandableSection}
        <ListItemButton
          disableRipple
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
              alignItems: "center",
              py: 0.5,
              pr: 1,
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
            <ListItemSecondaryAction>
              {renderStatusIcon()}
              {!toggleable && !draggable ? (
                <IconButton
                  size="small"
                  disableTouchRipple
                  disableFocusRipple
                  disableRipple
                >
                  <Tooltip title="Bakgrundskartan ligger låst längst ner i ritordningen">
                    <LockOutlinedIcon />
                  </Tooltip>
                </IconButton>
              ) : null}
              {layerIsFakeMapLayer !== true && (
                <IconButton size="small" onClick={(e) => showLayerDetails(e)}>
                  <KeyboardArrowRightOutlinedIcon
                    sx={{
                      color: (theme) => theme.palette.grey[500],
                    }}
                  ></KeyboardArrowRightOutlinedIcon>
                </IconButton>
              )}
            </ListItemSecondaryAction>
          </Box>
        </ListItemButton>
      </Box>
      {layerShouldShowLegendIcon(layerType, layerIsFakeMapLayer) ? null : (
        <LegendImage
          comment="TODO Fix the mess below"
          src={Array.isArray(layerInfo.legend) && layerInfo.legend[0]?.url}
          open={legendIsActive}
        ></LegendImage>
      )}
      {subLayersSection && subLayersSection}
    </div>
  );
}
