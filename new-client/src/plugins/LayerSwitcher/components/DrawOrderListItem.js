import React, { useEffect } from "react";

import {
  Box,
  Collapse,
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
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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
  // Keep the opacity in state…
  const [opacity, setOpacity] = React.useState(layer.get("opacity"));
  // …and let a useEffect manage the actual OL layer's opacity.
  useEffect(() => {
    layer.set("opacity", opacity);
  }, [layer, opacity]);

  const handleOpacitySliderChange = (e, newValue) => {
    setOpacity(newValue);
  };

  const handleListItemClick = () => {
    layer.set("visible", !layer.get("visible"));
  };

  const renderLegendIcon = () => {
    const layerInfo = layer.get("layerInfo");
    return layerInfo.legendIcon ? (
      <LegendIcon alt="Teckenförklaring" src={layerInfo.legendIcon} />
    ) : null;
  };

  const getLayerToggleIcon = () => {
    const icon =
      layer.get("visible") && opacity !== 0 ? (
        <CheckBoxIcon />
      ) : (
        <CheckBoxOutlineBlankIcon />
      );
    return icon;
  };

  const toggleSettings = (e) => {
    e.preventDefault();
    e.stopPropagation();
    settingClickCallback(layer.ol_uid);
  };

  return (
    <div>
      {isBackgroundLayer ? (
        <ListItem dense>
          <IconButton
            disableTouchRipple
            disableFocusRipple
            disableRipple
            inset="true"
          >
            <PublicOutlinedIcon inset="true" />
          </IconButton>
          <ListItemText primary={layer.get("caption")} />
        </ListItem>
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
            {renderLegendIcon()}
            <ListItemText primary={layer.get("caption")} />
            <ListItemSecondaryAction>
              <IconButton onClick={toggleSettings}>
                <SettingsOutlinedIcon
                  sx={{
                    transform: settingIsActive ? "rotate(180deg)" : "",
                    transition: "transform 300ms ease",
                  }}
                />
              </IconButton>
              <DrawOrderListItemOptions layer={layer} />
            </ListItemSecondaryAction>
          </ListItemButton>
          <Collapse
            in={settingIsActive}
            timeout="auto"
            unmountOnExit
            className="settingsCollapse"
          >
            <Box sx={{ p: 3 }}>
              <Stack direction="row" spacing={2}>
                <Typography>Opacitet</Typography>
                <Slider
                  aria-label="Layer opacity"
                  value={opacity}
                  onChange={handleOpacitySliderChange}
                  size="small"
                  min={0}
                  max={1}
                  step={0.01}
                />
              </Stack>
            </Box>
          </Collapse>
        </>
      )}
    </div>
  );
}
