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
import LayerItemOptions from "./LayerItemOptions";
import LayerItemCollapse from "./LayerItemCollapse";

import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import WallpaperIcon from "@mui/icons-material/Wallpaper";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

export default function LayerItem({
  layer,
  toggleIcon,
  clickCallback,
  isBackgroundLayer,
  draggable,
  toggleable,
  app,
  chapters,
  onOpenChapter,
  options,
  subLayersSection,
  visibleSubLayers,
  expandableSection,
}) {
  // Keep the settingsarea active in state
  const [settingIsActive, setSettingIsActive] = useState(false);
  // WmsLayer load status, shows warning icon if !ok
  const [wmsLayerLoadStatus, setWmsLayerLoadStatus] = useState("ok");
  // State for layer zoom visibility
  const [zoomVisible, setZoomVisible] = useState(true);
  // Keep zoomend listener in state
  const [zoomEndListener, setZoomEndListener] = useState();

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
    return null;
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
  const renderStatusButton = () => {
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

  // Toogles settings area
  const toggleSettings = (e) => {
    e.stopPropagation();
    setSettingIsActive(!settingIsActive);
  };

  // Checks if layer is enabled for options
  const hasListItemOptions = () => {
    return layer.get("layerType") !== "system" && layer.isFakeMapLayer !== true;
  };

  const cqlFilterVisible = app.config.mapConfig.map?.cqlFilterVisible || false;

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
              !settingIsActive
                ? `${theme.spacing(0.2)} solid ${theme.palette.divider}`
                : `${theme.spacing(0.2)} solid transparent`,
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
          {isBackgroundLayer && draggable ? (
            layer.isFakeMapLayer ? (
              <WallpaperIcon sx={{ mr: "5px" }} />
            ) : (
              <PublicOutlinedIcon sx={{ mr: "5px" }} />
            )
          ) : (
            getIconFromLayer()
          )}
          <ListItemText primary={layer.get("caption")} />
          <ListItemSecondaryAction>
            {renderStatusButton()}
            {hasListItemOptions() && (
              <LayerItemOptions
                layer={layer}
                app={app}
                chapters={chapters}
                enqueueSnackbar={enqueueSnackbar}
                onOpenChapter={onOpenChapter}
              />
            )}
            {layer.isFakeMapLayer !== true &&
              layer.get("layerType") !== "system" && (
                <IconButton size="small" onClick={(e) => toggleSettings(e)}>
                  <ExpandMoreOutlinedIcon
                    sx={{
                      transform: settingIsActive ? "rotate(180deg)" : "",
                      transition: "transform 300ms ease",
                    }}
                  ></ExpandMoreOutlinedIcon>
                </IconButton>
              )}
          </ListItemSecondaryAction>
        </Box>
      </ListItemButton>
      {!layer.isFakeMapLayer && layer.get("layerType") !== "system" && (
        <LayerItemCollapse
          options={options}
          layer={layer}
          collapsed={settingIsActive}
          cqlFilterVisible={cqlFilterVisible}
          showOpacity={true}
          showLegend={layer.get("layerType") === "group" ? false : true}
        ></LayerItemCollapse>
      )}
      {subLayersSection && subLayersSection}
    </div>
  );
}
