import React, { useEffect, useState } from "react";
import { useSnackbar } from "notistack";

import {
  Box,
  IconButton,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
} from "@mui/material";

import LegendIcon from "./LegendIcon";
import LegendImage from "./LegendImage";

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

export default function LayerItem({
  layer,
  toggleIcon,
  clickCallback,
  isBackgroundLayer,
  draggable,
  toggleable,
  app,
  subLayersSection,
  visibleSubLayers,
  expandableSection,
}) {
  // WmsLayer load status, shows warning icon if !ok
  const [wmsLayerLoadStatus, setWmsLayerLoadStatus] = useState("ok");
  // State for layer zoom visibility
  const [zoomVisible, setZoomVisible] = useState(true);
  // Keep zoomend listener in state
  const [zoomEndListener, setZoomEndListener] = useState();
  // State that toggles legend collapse
  const [legendIsActive, setLegendIsActive] = useState(false);

  // We're gonna need to access the snackbar methods. Let's use the provided hook.
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();

  // When component is successfully mounted into the DOM.
  useEffect(() => {
    if (layer.get("visible")) {
      triggerZoomCheck(false, true);
    }
    listenToZoomChange(layer.get("visible"));

    // Set load status by subscribing to a global event. Expect ID (int) of layer
    // and status (string "ok"|"loaderror"). Also, once status was set to "loaderror",
    // don't change it back to "ok": we'll get a response for each tile, so most of
    // the tiles might be "ok", but if only one of the tiles has "loaderror", we
    // consider that the layer has failed loading and want to inform the user.
    app.globalObserver.subscribe("layerswitcher.wmsLayerLoadStatus", (d) => {
      wmsLayerLoadStatus !== "loaderror" &&
        layer.get("name") === d.id &&
        setWmsLayerLoadStatus(d.status);
    });
  }, []);

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

    zoomEndHandler(click);

    if (visible === false) {
      closeSnackbar();
    }
  };

  const zoomEndHandler = (click) => {
    const zoom = app.map.getView().getZoom();
    const lprops = layer.getProperties();
    const layerIsZoomVisible = zoom > lprops.minZoom && zoom <= lprops.maxZoom;

    let showSnack = false;

    if (layer.get("minMaxZoomAlertOnToggleOnly") === true) {
      if (!layer.get("visible") && !layerIsZoomVisible && click === true) {
        showSnack = true;
      }
    } else {
      if (!layerIsZoomVisible && (zoomVisible || !layer.get("visible"))) {
        showSnack = true;
      }
    }

    if (showSnack === true) {
      showZoomSnack();
    }

    setZoomVisible(layerIsZoomVisible);
    return layerIsZoomVisible;
  };

  const showZoomSnack = () => {
    enqueueSnackbar(
      `Lagret "${layer.get("caption")}" visas endast vid specifika skalor.`,
      {
        variant: "warning",
        preventDuplicate: true,
      }
    );
  };

  const layerUsesMinMaxZoom = () => {
    const lprops = layer.getProperties();
    const maxZ = lprops.maxZoom ?? 0;
    const minZ = lprops.minZoom ?? 0;
    // When reading min/max-Zoom from layer, its not consistent with the
    // initial values from config. Suddenly Infinity is used.
    return (maxZ > 0 && maxZ < Infinity) || (minZ > 0 && minZ < Infinity);
  };

  // Handles list item click
  const handleLayerItemClick = () => {
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
            !zoomVisible && layer.get("visible")
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
    <div className="layer-item">
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
          <ListItemText primary={layer.get("caption")} />
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
        <Box sx={{ pl: draggable ? 4 : 6 }}>
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
