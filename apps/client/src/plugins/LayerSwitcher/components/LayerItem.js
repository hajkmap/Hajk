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
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import WallpaperIcon from "@mui/icons-material/Wallpaper";
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
import { useLayerZoomWarningSnackbar } from "../useLayerZoomWarningSnackbar";

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

const LayerToggleComponent = ({ toggleIcon, toggleState }) => {
  if (toggleIcon) {
    return (
      <IconButton disableRipple size="small" sx={{ pl: 0 }}>
        {toggleIcon}
      </IconButton>
    );
  }
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

export default function LayerItem({
  layer,
  toggleIcon,
  clickCallback,
  isBackgroundLayer,
  draggable,
  toggleable,
  app,
  display,
  subLayersSection,
  visibleSubLayers,
  expandableSection,
  showSublayers,
}) {
  // WmsLayer load status, shows warning icon if !ok
  const [wmsLayerLoadStatus, setWmsLayerLoadStatus] = useState("ok");
  // State that toggles legend collapse
  const [legendIsActive, setLegendIsActive] = useState(false);

  const theme = useTheme();
  const mapZoom = useMapZoom();

  const layerId = layer.get("name");
  const caption = layer.get("caption");

  useEffect(() => {
    const handleLoadStatusChange = (d) => {
      if (wmsLayerLoadStatus !== "loaderror" && layer.get("name") === d.id) {
        setWmsLayerLoadStatus(d.status);
      }
    };

    // Subscribe to layer load status.
    const loadStatusSubscription = app.globalObserver.subscribe(
      "layerswitcher.wmsLayerLoadStatus",
      handleLoadStatusChange
    );

    // Cleanup function to unsubscribe when the component unmounts or if the relevant dependencies change.
    return () =>
      app.globalObserver.unsubscribe(
        "layerswitcher.wmsLayerLoadStatus",
        loadStatusSubscription
      );
  }, [app.globalObserver, layer, wmsLayerLoadStatus]);

  // Handles list item click
  const handleLayerItemClick = (e) => {
    // If a clickCallback is defined, call it.
    if (clickCallback) {
      clickCallback();
      return;
    }

    // Handle system layers by showing layer details directly
    if (layer.get("layerType") === "system") {
      showLayerDetails(e);
      return;
    }

    // Toggle visibility for non-system layers
    if (layer.get("layerType") !== "system") {
      // This check is technically redundant now but left for clarity
      layer.set("visible", !layer.get("visible"));
    }
  };

  // Render method for legend icon
  const getIconFromLayer = () => {
    const layerLegendIcon =
      layer.get("layerInfo")?.legendIcon || layer.get("legendIcon");
    if (layerLegendIcon !== undefined) {
      return <LegendIcon url={layerLegendIcon} />;
    } else if (layer.get("layerType") === "system") {
      return <BuildOutlinedIcon sx={{ mr: "5px" }} />;
    }
    return renderLegendIcon();
  };

  const renderLegendIcon = () => {
    if (
      layer.get("layerType") === "group" ||
      layer.get("layerType") === "base" ||
      layer.isFakeMapLayer ||
      layer.get("layerType") === "system"
    ) {
      return null;
    }
    return (
      <Tooltip
        placement="left"
        title={
          legendIsActive ? "Dölj teckenförklaring" : "Visa teckenförklaring"
        }
      >
        <IconButton
          sx={{ p: 0.25, mr: "5px" }}
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setLegendIsActive(!legendIsActive);
          }}
        >
          <FormatListBulletedOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  const layerIsToggled = layer.get("visible");
  const layerIsSemiToggled =
    layer.get("layerType") === "group" &&
    visibleSubLayers.length !== layer.subLayers.length;

  const layerMinZoom = layer.get("minZoom");
  const layerMaxZoom = layer.get("maxZoom");
  const layerIsVisibleAtZoom =
    mapZoom >= layerMinZoom && mapZoom <= layerMaxZoom;

  const toggleState = getLayerToggleState(
    layerIsToggled,
    layerIsSemiToggled,
    layerIsVisibleAtZoom
  );

  const layerMinMaxZoomAlertOnToggleOnly = layer.get(
    "minMaxZoomAlertOnToggleOnly"
  );
  // useLayerZoomWarningSnackbar(
  //   layerMinZoom,
  //   layerMaxZoom,
  //   layerIsToggled,
  //   layerMinMaxZoomAlertOnToggleOnly,
  //   layerId,
  //   caption
  // );

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
  const showLayerDetails = (e, specificLayer = layer) => {
    e.stopPropagation();
    app.globalObserver.publish("setLayerDetails", { layer: specificLayer });
  };

  const drawOrderItem = () => {
    if (draggable) {
      return true;
    }
    if (isBackgroundLayer && !toggleable) {
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
        marginLeft:
          expandableSection || isBackgroundLayer || draggable ? 0 : "31px",
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
            ml: isBackgroundLayer && !toggleable ? (draggable ? 0 : "20px") : 0,
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
            {toggleable && (
              <LayerToggleComponent
                toggleIcon={toggleIcon}
                toggleState={toggleState}
              />
            )}
            {isBackgroundLayer && !toggleable ? (
              layer.isFakeMapLayer ? (
                <WallpaperIcon sx={{ mr: "5px", ml: 0 }} />
              ) : (
                <PublicOutlinedIcon sx={{ mr: "5px", ml: 0 }} />
              )
            ) : (
              getIconFromLayer()
            )}
            <ListItemText
              primary={layer.get("caption")}
              primaryTypographyProps={{
                pr: 5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                variant: "body1",
                fontWeight:
                  layer.get("visible") && !draggable && !isBackgroundLayer
                    ? "bold"
                    : "inherit",
              }}
            />
            <ListItemSecondaryAction>
              {renderStatusIcon()}
              {isBackgroundLayer && !toggleable && !draggable ? (
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
              {layer.isFakeMapLayer !== true && (
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
      {layer.get("layerType") === "group" ||
      layer.get("layerType") === "base" ||
      layer.isFakeMapLayer ||
      layer.get("layerType") === "system" ? null : (
        <LegendImage
          layerItemDetails={{ layer: layer }}
          open={legendIsActive}
          subLayerIndex={null}
        ></LegendImage>
      )}
      {subLayersSection && subLayersSection}
    </div>
  );
}
