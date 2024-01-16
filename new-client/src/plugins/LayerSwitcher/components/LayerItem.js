import React, { useEffect, useState, useRef, useCallback } from "react";

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
  showSublayers,
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
  const theme = useTheme();

  const layerSwitcherConfig = app.config.mapConfig.tools.find(
    (tool) => tool.type === "layerswitcher"
  );

  const minMaxZoomAlertOnToggleOnly =
    layerSwitcherConfig?.options?.minMaxZoomAlertOnToggleOnly ?? false;

  const layerUsesMinMaxZoom = useCallback(() => {
    const lprops = layer.getProperties();
    const maxZ = lprops.maxZoom ?? 0;
    const minZ = lprops.minZoom ?? 0;
    return (maxZ > 0 && maxZ < Infinity) || (minZ > 0 && minZ < Infinity);
  }, [layer]);

  const addValue = useCallback(
    (value) => {
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
    },
    [minMaxZoomAlertOnToggleOnly, showSnackbarOnClick, addToSnackbar, layer]
  );

  const removeValue = useCallback(
    (value) => {
      removeFromSnackbar(layer.get("name"), value);
    },
    [removeFromSnackbar, layer]
  );

  /**
   * Handles the zoom end event and determines if the layer should be visible at the current zoom level.
   * @param {boolean} wasClicked - True if the zoom button was clicked, false otherwise.
   * @returns {boolean} - True if the layer is visible at the current zoom level, false otherwise.
   */
  const zoomEndHandler = useCallback(
    (click) => {
      const zoom = app.map.getView().getZoom();
      const lprops = layer.getProperties();
      const layerIsZoomVisible =
        zoom > lprops.minZoom && zoom <= lprops.maxZoom;

      const prevVisibleMinMaxZoomLayers =
        prevVisibleMinMaxZoomLayersRef.current;
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

      if (
        layerIsZoomVisible !== prevLayerIsZoomVisible.current ||
        isGroupLayer
      ) {
        if (!layerIsZoomVisible && (zoomVisible || !layer.get("visible"))) {
          setVisibleMinMaxZoomLayers(
            isGroupLayer ? visibleSubLayersCaption : [layer.get("caption")]
          );
        } else if (
          !layerIsZoomVisible &&
          layer.get("visible") &&
          isGroupLayer
        ) {
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
    },
    [
      app.map,
      layer,
      zoomVisible,
      visibleMinMaxZoomLayers,
      visibleSubLayersCaption,
      onSetZoomVisible,
    ]
  );

  const triggerZoomCheck = useCallback(
    (click, visible) => {
      if (!layerUsesMinMaxZoom()) return;

      zoomEndHandler(click, visible);

      if (visible === false) {
        removeValue(layer.get("caption"));
      }
    },
    [layer, layerUsesMinMaxZoom, zoomEndHandler, removeValue]
  );

  useEffect(() => {
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
  }, [
    app.globalObserver,
    app.map,
    layer,
    minMaxZoomAlertOnToggleOnly,
    subLayerClicked,
    visibleMinMaxZoomLayers.length,
    visibleSubLayers,
    wmsLayerLoadStatus,
    removeFromSnackbar,
    zoomEndListener,
    layerUsesMinMaxZoom,
    triggerZoomCheck,
    zoomEndHandler,
    addValue,
    removeValue,
  ]);

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
  }, [visibleMinMaxZoomLayers, isGroupHidden, addValue, removeValue]);

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
              <IconButton disableRipple size="small" sx={{ pl: 0 }}>
                {getLayerToggleIcon()}
              </IconButton>
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
