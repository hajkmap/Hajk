import React, { useState, useEffect } from "react";
import { useSnackbar } from "notistack";

import LayerItemOptions from "./LayerItemOptions";
import VectorFilter from "./VectorFilter";
import CQLFilter from "./CQLFilter";
import { useLayerSwitcherDispatch } from "../LayerSwitcherProvider";

import { Button, Box, Divider, Slider, Typography, Stack } from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import LayerItemInfo from "./LayerItemInfo";
import LegendImage from "./LegendImage";
import HajkToolTip from "components/HajkToolTip";
import LsIconButton from "./LsIconButton";

function LayerItemDetails({
  display,
  layerItemDetails,
  chapters,
  app,
  showOpacitySlider,
  showQuickAccess,
}) {
  const { enqueueSnackbar } = useSnackbar();
  // State that toggles legend collapse
  const [legendIsActive, setLegendIsActive] = useState(false);
  // Keep the layer opacity in state
  const [opacity, setOpacity] = useState(0);
  // Keep the layer quickAccess property in state
  const [quickAccess, setQuickAccess] = useState(false);

  // Because of a warning in dev console, we need special handling of tooltip for backbutton.
  // When a user clicks back, the tooltip of the button needs to be closed before this view hides.
  // TODO: Needs a better way to handle this
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const layerSwitcherDispatch = useLayerSwitcherDispatch();

  const layerSwitcherConfig = app.config.mapConfig.tools.find(
    (tool) => tool.type === "layerswitcher"
  );
  const cqlFilterVisible =
    layerSwitcherConfig?.options.cqlFilterVisible || false;
  const subLayerIndex =
    layerItemDetails?.subLayerIndex === undefined
      ? null
      : layerItemDetails?.subLayerIndex;
  const showOpacity = subLayerIndex !== null ? false : true;

  const layerInfo = layerItemDetails?.layer?.get("layerInfo");

  // Only show legend for actual OL layers.
  // This check is probably not needed but LayerItemDetails can be passed
  // several different things and we don't want to crash in any case.
  // Proper typing of the props would remove the need for this check.
  const showLegend = layerItemDetails?.layer?.get("layerType");

  const legendInfo = layerInfo?.legend;
  const legendUrl =
    showLegend && subLayerIndex === null
      ? legendInfo?.map((l) => l?.url)
      : Array.isArray(legendInfo) && legendInfo[subLayerIndex]?.url;

  // Handle opacity slider changes
  const handleOpacitySliderChange = (_, newValue) => {
    layerItemDetails.layer.set("opacity", newValue);
  };

  // Callback for change:opacity listeners
  const setOpacityCallback = (e) => {
    setOpacity(e.target.get("opacity"));
  };

  // Setup listeners when component is mounted
  useEffect(() => {
    if (layerItemDetails?.layer) {
      // Register a listener: when layer's opacity changes make sure
      // to update opacity state. Not applicable for fakeMapLayers
      if (!layerItemDetails?.layer?.isFakeMapLayer) {
        setOpacity(layerItemDetails?.layer?.get("opacity"));
        setQuickAccess(layerItemDetails?.layer?.get("quickAccess"));
        layerItemDetails?.layer?.on("change:opacity", setOpacityCallback);
      }
    }
    return function () {
      layerItemDetails?.layer?.un("change:opacity", setOpacityCallback);
    };
  }, [layerItemDetails]);

  // Format slider label
  const valueLabelFormat = (value) => {
    return `${Math.trunc(value * 100)} %`;
  };

  // Handles click on back button in header
  const handleBackButtonClick = () => {
    setTooltipOpen(false);
    setLegendIsActive(false);
    setTimeout(() => {
      app.globalObserver.publish("setLayerDetails", null);
    }, 100);
  };

  // Handles backbutton tooltip close event
  const handleClose = () => {
    setTooltipOpen(false);
  };

  // Handles backbutton tooltip open event
  const handleOpen = () => {
    setTooltipOpen(true);
  };

  // Checks if layer is enabled for options
  const hasListItemOptions = () => {
    return (
      layerItemDetails?.layer?.get("layerType") !== "system" &&
      layerItemDetails?.layer?.isFakeMapLayer !== true
    );
  };

  // Check that layer is elligible for quickAccess option
  const isQuickAccessEnabled = () => {
    return (
      layerItemDetails?.layer?.get("layerType") !== "base" &&
      layerItemDetails?.layer?.get("layerType") !== "system" && // Exclude system layers
      subLayerIndex === null &&
      showQuickAccess
    );
  };

  // Add a check for CQL filter visibility and exclude system layers
  const isCqlFilterEnabled = () => {
    return (
      cqlFilterVisible && layerItemDetails?.layer?.get("layerType") !== "system" // Exclude system layers
    );
  };

  // Handle quickacces action
  const handleQuickAccess = () => {
    let snackbarMessage = "";
    if (!quickAccess) {
      snackbarMessage = `${renderDetailTitle()} har nu lagts till i snabbåtkomst.`;
    } else {
      snackbarMessage = `${renderDetailTitle()} har nu tagits bort från snabbåtkomst.`;
    }
    enqueueSnackbar(snackbarMessage, {
      variant: "success",
      anchorOrigin: { vertical: "bottom", horizontal: "center" },
    });
    setQuickAccess(!quickAccess);

    // Set quicklayer access flag
    const layerId = layerItemDetails?.layer?.get("name");
    layerSwitcherDispatch.setLayerQuickAccess(layerId, !quickAccess);
  };

  // Render title
  const renderDetailTitle = () => {
    if (subLayerIndex !== null) {
      return layerItemDetails.layer.layersInfo[
        layerItemDetails.layer.subLayers[subLayerIndex]
      ].caption;
    } else {
      return layerItemDetails?.layer?.get("caption");
    }
  };

  return (
    <>
      {layerItemDetails && (
        <Box
          sx={{
            display: display ? "block" : "none",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgb(18,18,18)" : "#fff",
            position: "relative",
            overflowY: "auto",
            height: "inherit",
            minHeight: "15em",
            maxHeight: "inherit",
          }}
        >
          <Box
            sx={{
              p: 1,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "#373737"
                  : theme.palette.grey[100],
              borderBottom: (theme) =>
                `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
            }}
          >
            <Stack direction="row" alignItems="center">
              <HajkToolTip
                open={tooltipOpen}
                onClose={handleClose}
                onOpen={handleOpen}
                title="Tillbaka"
                TransitionProps={{ timeout: 0 }}
              >
                <LsIconButton onClick={handleBackButtonClick}>
                  <ArrowBackIcon />
                </LsIconButton>
              </HajkToolTip>
              <Box sx={{ flexGrow: 1, textAlign: "center" }}>
                <Typography variant="subtitle1">
                  {renderDetailTitle()}
                </Typography>
              </Box>
              {hasListItemOptions() && (
                <LayerItemOptions
                  layer={layerItemDetails.layer}
                  app={app}
                  subLayerIndex={subLayerIndex}
                  enqueueSnackbar={enqueueSnackbar}
                />
              )}
            </Stack>
          </Box>
          <Box
            sx={{
              p: 1,
            }}
          >
            <Stack direction="row" alignItems="center">
              <LsIconButton
                sx={{ cursor: "default" }}
                disableFocusRipple
                disableRipple
              >
                <InfoOutlinedIcon />
              </LsIconButton>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">Info</Typography>
              </Box>
              {showLegend && (
                <HajkToolTip
                  title={
                    legendIsActive
                      ? "Dölj teckenförklaring"
                      : "Visa teckenförklaring"
                  }
                >
                  <LsIconButton
                    onClick={() => setLegendIsActive(!legendIsActive)}
                  >
                    <FormatListBulletedOutlinedIcon fontSize="small" />
                  </LsIconButton>
                </HajkToolTip>
              )}
            </Stack>
            <Box
              sx={{
                py: 1,
                px: 2,
                borderBottom: (theme) =>
                  `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
              }}
            >
              <LayerItemInfo
                chapters={chapters}
                app={app}
                layer={layerItemDetails.layer}
              ></LayerItemInfo>
              <LegendImage src={legendUrl} open={legendIsActive}></LegendImage>
            </Box>
            <Stack direction="row" alignItems="center">
              <LsIconButton
                sx={{ cursor: "default" }}
                disableFocusRipple
                disableRipple
              >
                <SettingsOutlinedIcon />
              </LsIconButton>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">Inställningar</Typography>
              </Box>
            </Stack>
            {showOpacitySlider !== false && showOpacity ? (
              <Box
                sx={{
                  px: 2,
                  pr: 3,
                  pb: 2,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography
                    variant="subtitle2"
                    sx={{ flexGrow: 1, flexBasis: "25%" }}
                  >
                    Opacitet
                  </Typography>
                  <Slider
                    aria-label="Layer opacity"
                    value={opacity}
                    onChange={handleOpacitySliderChange}
                    getAriaValueText={valueLabelFormat}
                    valueLabelFormat={valueLabelFormat}
                    min={0}
                    max={1}
                    step={0.01}
                    valueLabelDisplay="auto"
                  />
                </Stack>
              </Box>
            ) : null}
            {isCqlFilterEnabled() && (
              <Box
                sx={{
                  px: 2,
                  pr: 2,
                  pb: 2,
                }}
              >
                <CQLFilter layer={layerItemDetails.layer} />
              </Box>
            )}
            {layerItemDetails?.layer?.getProperties().filterable && (
              <>
                <Divider />
                <Stack direction="row" alignItems="center">
                  <LsIconButton
                    sx={{ cursor: "default" }}
                    disableFocusRipple
                    disableRipple
                  >
                    <FilterAltOutlinedIcon />
                  </LsIconButton>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1">Filter</Typography>
                  </Box>
                </Stack>
                <Box
                  sx={{
                    px: 2,
                    pr: 2,
                    pb: 2,
                  }}
                >
                  <VectorFilter layer={layerItemDetails.layer} />
                </Box>
              </>
            )}
            {isQuickAccessEnabled() && (
              <Box
                sx={{
                  borderTop: (theme) =>
                    `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
                  p: 2,
                }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleQuickAccess}
                >
                  {!quickAccess ? (
                    <>
                      <StarOutlineOutlinedIcon sx={{ marginRight: 1 }} />
                      Lägg till i snabbåtkomst
                    </>
                  ) : (
                    <>
                      <DeleteOutlinedIcon sx={{ marginRight: 1 }} />
                      Ta bort från snabbåtkomst
                    </>
                  )}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </>
  );
}

export default LayerItemDetails;
