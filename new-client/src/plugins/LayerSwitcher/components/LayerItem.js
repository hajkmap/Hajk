import React, { useEffect, useState, useRef } from "react";

// Material UI components
import {
  Box,
  IconButton,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
} from "@mui/material";

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

// Custom hooks
import useSnackbar from "../../../hooks/useSnackbar";

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
  visibleSubLayersCaption,
  onSetZoomVisible,
  subLayerClicked,
}) {
  // WmsLayer load status, shows warning icon if !ok
  const [wmsLayerLoadStatus, setWmsLayerLoadStatus] = useState("ok");
  // State for layer zoom visibility
  const [zoomVisible, setZoomVisible] = useState(true);
  // Keep zoomend listener in state
  const [zoomEndListener, setZoomEndListener] = useState();
  // State that toggles legend collapse
  const [legendIsActive, setLegendIsActive] = useState(false);
  const [visibleMinMaxZoomLayers, setVisibleMinMaxZoomLayers] = useState([]);
  const prevVisibleMinMaxZoomLayersRef = useRef([]);
  const prevLayerIsZoomVisible = useRef(null);
  const [isGroupHidden, setIsGroupHidden] = useState(false);
  const [showSnackbarOnClick, setShowSnackbarOnClick] = useState(false);

  const { addToSnackbar, removeFromSnackbar } = useSnackbar();

  const layerSwitcherConfig = app.config.mapConfig.tools.find(
    (tool) => tool.type === "layerswitcher"
  );
  const minMaxZoomAlertOnToggleOnly =
    layerSwitcherConfig?.options?.minMaxZoomAlertOnToggleOnly ?? false;

  useEffect(() => {
    if (layer.get("visible")) {
      triggerZoomCheck(false, true);
    }
    listenToZoomChange(layer.get("visible"));

    // Handler for zoom change event.
    const handleChange = () => {
      // Check if the layer is currently visible.
      if (layer.get("visible")) {
        // Trigger zoom check.
        triggerZoomCheck(false, true);
      }
    };

    if (
      (visibleSubLayers !== undefined &&
        !visibleSubLayers &&
        visibleMinMaxZoomLayers.length > 0) ||
      (layer.get("visible") !== undefined &&
        !layer.get("visible") &&
        visibleMinMaxZoomLayers.length > 0)
    ) {
      setIsGroupHidden(true);
    }

    const zoom = app.map.getView().getZoom();
    const lprops = layer.getProperties();
    const layerIsZoomVisible = zoom > lprops.minZoom && zoom <= lprops.maxZoom;
    if (
      !layerIsZoomVisible &&
      minMaxZoomAlertOnToggleOnly &&
      (subLayerClicked || layer.get("visible"))
    ) {
      setShowSnackbarOnClick(true);
    }

    // Subscribe to zoom changes.
    const zoomChangeSubscription = app.globalObserver.subscribe(
      "core.zoomEnd",
      handleChange
    );

    // Subscribe to layer load status.
    const loadStatusSubscription = app.globalObserver.subscribe(
      "layerswitcher.wmsLayerLoadStatus",
      (d) => {
        wmsLayerLoadStatus !== "loaderror" &&
          layer.get("name") === d.id &&
          setWmsLayerLoadStatus(d.status);
      }
    );

    // Call handleChange immediately.
    handleChange();

    // Clean up by unsubscribing when the component unmounts.
    return () => {
      app.globalObserver.unsubscribe("core.zoomEnd", zoomChangeSubscription);
      app.globalObserver.unsubscribe(
        "layerswitcher.wmsLayerLoadStatus",
        loadStatusSubscription
      );
    };
  }, [visibleSubLayers, layer.get("visible"), wmsLayerLoadStatus]);

  useEffect(() => {
    if (isGroupHidden) {
      visibleMinMaxZoomLayers.forEach((value) => {
        removeValue(value);
      });
      setIsGroupHidden(false);
    }

    const prevVisibleMinMaxZoomLayers = prevVisibleMinMaxZoomLayersRef.current;

    const addedValues = visibleMinMaxZoomLayers.filter(
      (value) => !prevVisibleMinMaxZoomLayers.includes(value)
    );

    const removedValues = prevVisibleMinMaxZoomLayers.filter(
      (value) => !visibleMinMaxZoomLayers.includes(value)
    );

    addedValues.forEach((value) => {
      addValue(value);
    });

    removedValues.forEach((value) => {
      removeValue(value);
    });

    prevVisibleMinMaxZoomLayersRef.current = visibleMinMaxZoomLayers;
  }, [visibleMinMaxZoomLayers, isGroupHidden]);

  const listenToZoomChange = (bListen) => {
    if (!layerUsesMinMaxZoom()) return;

    const eventName = "core.zoomEnd";
    if (bListen && !zoomEndListener) {
      setZoomEndListener(
        app.globalObserver.subscribe(eventName, zoomEndHandler)
      );
    } else {
      if (zoomEndListener) {
        app.globalObserver.unsubscribe(eventName, zoomEndListener);
        setZoomEndListener(null);
      }
    }
  };

  const triggerZoomCheck = (click, visible) => {
    if (!layerUsesMinMaxZoom()) return;

    zoomEndHandler(click, visible);

    if (visible === false) {
      // Remove the layer from the snackbar message.
      removeValue(layer.get("caption"));
    }
  };

  /**
   * Handles the zoom end event and determines if the layer should be visible at the current zoom level.
   * @param {boolean} wasClicked - True if the zoom button was clicked, false otherwise.
   * @returns {boolean} - True if the layer is visible at the current zoom level, false otherwise.
   */
  const zoomEndHandler = (click) => {
    const zoom = app.map.getView().getZoom();
    const lprops = layer.getProperties();
    const layerIsZoomVisible = zoom > lprops.minZoom && zoom <= lprops.maxZoom;

    const prevVisibleMinMaxZoomLayers = prevVisibleMinMaxZoomLayersRef.current;
    const isGroupLayer = Array.isArray(visibleSubLayersCaption);

    const arraysAreEqual = (a, b) => {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    };

    if (layerIsZoomVisible !== prevLayerIsZoomVisible.current || isGroupLayer) {
      if (!layerIsZoomVisible && (zoomVisible || !layer.get("visible"))) {
        setVisibleMinMaxZoomLayers(
          isGroupLayer ? visibleSubLayersCaption : [layer.get("caption")]
        );
      } else if (!layerIsZoomVisible && layer.get("visible") && isGroupLayer) {
        setVisibleMinMaxZoomLayers(
          isGroupLayer ? visibleSubLayersCaption : [layer.get("caption")]
        );
      } else if (
        !arraysAreEqual(visibleMinMaxZoomLayers, prevVisibleMinMaxZoomLayers)
      ) {
        setVisibleMinMaxZoomLayers([]);
      } else {
        setVisibleMinMaxZoomLayers([]);
      }

      if (isGroupLayer) {
        onSetZoomVisible(layerIsZoomVisible);
      }
      prevLayerIsZoomVisible.current = layerIsZoomVisible;
    }

    setZoomVisible(layerIsZoomVisible);
    return layerIsZoomVisible;
  };

  const addValue = (value) => {
    if (minMaxZoomAlertOnToggleOnly) {
      if (showSnackbarOnClick) {
        // Add layer caption and show snackbar message on click.
        addToSnackbar(layer.get("name"), value);
      } else {
        // Add layer caption to snackbar message, but don't show it.
        addToSnackbar(layer.get("name"), value, true);
      }
      setShowSnackbarOnClick(false);
    } else {
      addToSnackbar(layer.get("name"), value);
    }
  };

  const removeValue = (value) => {
    removeFromSnackbar(layer.get("name"), value);
  };

  const layerUsesMinMaxZoom = () => {
    const lprops = layer.getProperties();
    const maxZ = lprops.maxZoom ?? 0;
    const minZ = lprops.minZoom ?? 0;
    return (maxZ > 0 && maxZ < Infinity) || (minZ > 0 && minZ < Infinity);
  };

  // Handles list item click
  const handleLayerItemClick = () => {
    // If a clickCallback is defined, call it.
    if (clickCallback) {
      clickCallback();
      return;
    }
    triggerZoomCheck(true, !layer.get("visible"));

    if (layer.get("layerType") !== "system") {
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

  // Render method for checkbox icon
  const getLayerToggleIcon = () => {
    if (toggleIcon) {
      return toggleIcon;
    }
    return !layer.get("visible") ? (
      <CheckBoxOutlineBlankIcon />
    ) : layer.get("layerType") === "group" &&
      visibleSubLayers.length !== layer.subLayers.length ? (
      <CheckBoxIcon sx={{ fill: "gray" }} />
    ) : (
      <CheckBoxIcon
        sx={{
          fill: (theme) =>
            !zoomVisible && layer.get("visible") && !visibleSubLayers
              ? theme.palette.warning.dark
              : "",
        }}
      />
    );
  };

  /**
   * Render the load information component.
   * @instance
   * @return {external:ReactElement}
   */
  const renderStatusIcon = () => {
    return (
      wmsLayerLoadStatus === "loaderror" && (
        <IconButton disableRipple>
          <Tooltip
            disableInteractive
            title="Lagret kunde inte laddas in. Kartservern svarar inte."
          >
            <WarningAmberOutlinedIcon fontSize="small" />
          </Tooltip>
        </IconButton>
      )
    );
  };

  // Show layer details action
  const showLayerDetails = (e) => {
    e.stopPropagation();
    app.globalObserver.publish("setLayerDetails", { layer: layer });
  };

  return (
    <div className="layer-item" style={{ display: display }}>
      <ListItemButton
        disableRipple
        onClick={toggleable ? handleLayerItemClick : null}
        sx={{
          "&:hover .dragInidcatorIcon": {
            opacity: draggable ? 1 : 0,
          },
          p: 0,
          pl: draggable ? 2 : 1,
        }}
        dense
      >
        {draggable && (
          <IconButton
            edge="start"
            disableRipple
            sx={{
              px: 0,
              opacity: 0,
              transition: "opacity 200ms",
            }}
            className="dragInidcatorIcon"
          >
            <Tooltip title="Dra för att ändra ritordning">
              <DragIndicatorOutlinedIcon fontSize={"small"} />
            </Tooltip>
          </IconButton>
        )}
        {expandableSection && expandableSection}
        <Box
          sx={{
            display: "flex",
            position: "relative",
            width: "100%",
            alignItems: "center",
            py: 0.5,
            pr: 1,
            borderBottom: (theme) =>
              legendIsActive
                ? `${theme.spacing(0.2)} solid transparent`
                : `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
          }}
        >
          {toggleable && (
            <IconButton
              sx={{ pl: expandableSection ? 0 : "5px" }}
              disableRipple
              size="small"
            >
              {getLayerToggleIcon()}
            </IconButton>
          )}
          {isBackgroundLayer && !toggleable ? (
            layer.isFakeMapLayer ? (
              <WallpaperIcon sx={{ mr: "5px", ml: draggable ? 0 : "16px" }} />
            ) : (
              <PublicOutlinedIcon
                sx={{ mr: "5px", ml: draggable ? 0 : "16px" }}
              />
            )
          ) : (
            getIconFromLayer()
          )}
          <ListItemText
            primary={layer.get("caption")}
            primaryTypographyProps={{
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
            {layer.isFakeMapLayer !== true &&
              layer.get("layerType") !== "system" && (
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
      {layer.get("layerType") === "group" ||
      layer.get("layerType") === "base" ||
      layer.isFakeMapLayer ||
      layer.get("layerType") === "system" ? null : (
        <Box sx={{ pl: draggable ? 3.5 : 5.5 }}>
          <LegendImage
            layerItemDetails={{ layer: layer }}
            open={legendIsActive}
            subLayerIndex={null}
          ></LegendImage>
        </Box>
      )}
      {subLayersSection && subLayersSection}
    </div>
  );
}
