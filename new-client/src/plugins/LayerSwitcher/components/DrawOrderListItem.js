import React, { useEffect } from "react";

import {
  Box,
  Collapse,
  Icon,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Slider,
  Typography,
  Stack,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import DrawOrderListItemOptions from "./DrawOrderListItemOptions";

import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import WallpaperIcon from "@mui/icons-material/Wallpaper";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import OpacityOutlinedIcon from "@mui/icons-material/OpacityOutlined";

const LegendIcon = styled("img")(({ theme }) => ({
  width: theme.typography.pxToRem(18),
  height: theme.typography.pxToRem(18),
  marginRight: "5px",
}));

export default function DrawOrderListItem({
  layer,
  isBackgroundLayer,
  settingIsActive,
  settingClickCallback,
}) {
  // Keep the opacity in state
  const [opacity, setOpacity] = React.useState(layer.get("opacity"));

  // Handle opcaity slider changes
  const handleOpacitySliderChange = (e, newValue) => {
    layer.set("opacity", newValue);
  };

  // Callback for change:opacity listeners
  const setOpacityCallback = (e) => {
    setOpacity(e.target.get("opacity"));
  };

  // Setup listeners when component is mounted
  useEffect(() => {
    // Register a listener: when any layer's opacity changes make sure
    // to update opacity state. Not applicable for fakeMapLayers
    if (!layer.isFakeMapLayer) {
      layer.on("change:opacity", setOpacityCallback);
    }
    return function () {
      layer.un("change:opacity", setOpacityCallback);
    };
  }, [layer]);

  // Handles list item click
  const handleListItemClick = () => {
    if (layer.get("layerType") !== "system") {
      layer.set("visible", !layer.get("visible"));
    } else {
      layer.set("opacity", opacity === 0 ? 1 : 0);
    }
  };

  // Render method for legend icon
  const getIconFromLayer = () => {
    // Some layers can have a "infoclickIcon" property. If so, use it.
    const layerSpecificIcon =
      layer.get("layerInfo")?.infoclickIcon || layer.get("infoclickIcon");
    const layerLegendIcon =
      layer.get("layerInfo")?.legendIcon || layer.get("legendIcon");
    if (layerSpecificIcon !== undefined) {
      return <Icon>{layerSpecificIcon}</Icon>;
    } else if (layerLegendIcon !== undefined) {
      return <LegendIcon alt="Teckenförklaring" src={layerLegendIcon} />;
    } else if (layer.get("layerType") === "system") {
      return <BuildOutlinedIcon fontSize="small" sx={{ mr: "4px" }} />;
    }
    return null;
  };

  // Render method for checkbox icon
  const getLayerToggleIcon = () => {
    const icon =
      layer.get("visible") && opacity !== 0 ? (
        <CheckBoxIcon />
      ) : (
        <CheckBoxOutlineBlankIcon />
      );
    return icon;
  };

  // Toogles settings area
  const toggleSettings = () => {
    settingClickCallback(layer.ol_uid);
  };

  // Render method for settings area
  const settingsArea = () => {
    return (
      <Collapse
        in={settingIsActive}
        timeout="auto"
        unmountOnExit
        className="settingsCollapse"
      >
        <Box
          sx={{
            pl: 3,
            pr: 2,
            py: 1,
            backgroundColor: (theme) => theme.palette.grey[100],
          }}
        >
          <Stack direction="row" alignItems="center">
            <OpacityOutlinedIcon />
            <Typography sx={{ pl: "5px" }} variant="subtitle2">
              <b>Opacitet</b>
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={toggleSettings}>
              <Tooltip title="Stäng">
                <CloseOutlinedIcon />
              </Tooltip>
            </IconButton>
          </Stack>
          <Stack direction="row" width={"85%"}>
            <Slider
              aria-label="Layer opacity"
              value={opacity}
              onChange={handleOpacitySliderChange}
              min={0}
              max={1}
              step={0.01}
              valueLabelDisplay="on"
            />
          </Stack>
        </Box>
      </Collapse>
    );
  };

  return (
    <div>
      {isBackgroundLayer ? (
        <>
          <ListItem dense>
            <IconButton
              disableTouchRipple
              disableFocusRipple
              disableRipple
              inset="true"
              sx={{ cursor: "default" }}
            >
              {layer.isFakeMapLayer ? (
                <WallpaperIcon inset="true" />
              ) : (
                <PublicOutlinedIcon inset="true" />
              )}
            </IconButton>
            <ListItemText primary={layer.get("caption")} />
            <ListItemSecondaryAction hidden={layer.isFakeMapLayer}>
              <DrawOrderListItemOptions
                layer={layer}
                toggleSettings={toggleSettings}
              />
            </ListItemSecondaryAction>
          </ListItem>
          {settingsArea()}
        </>
      ) : (
        <>
          <ListItemButton
            disableRipple
            onClick={handleListItemClick}
            sx={{
              "&:hover .dragInidcatorIcon": {
                opacity: 1,
              },
            }}
            dense
          >
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
            <IconButton
              disableRipple
              sx={{
                pl: 0,
                pr: "5px",
              }}
            >
              {getLayerToggleIcon()}
            </IconButton>
            {getIconFromLayer()}
            <ListItemText primary={layer.get("caption")} />
            <ListItemSecondaryAction>
              <DrawOrderListItemOptions
                layer={layer}
                toggleSettings={toggleSettings}
              />
            </ListItemSecondaryAction>
          </ListItemButton>
          {settingsArea()}
        </>
      )}
    </div>
  );
}
