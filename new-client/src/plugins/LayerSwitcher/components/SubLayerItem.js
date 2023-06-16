import React, { useState } from "react";

import {
  IconButton,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";

import LegendIcon from "./LegendIcon";
import LayerItemOptions from "./LayerItemOptions";
import LayerItemCollapse from "./LayerItemCollapse";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";

export default function SubLayerItem({
  layer,
  subLayer,
  toggleable,
  app,
  visible,
  toggleSubLayer,
  subLayerIndex,
  options,
  zoomVisible,
  ...props
}) {
  // Keep the settingsarea active in state
  const [settingIsActive, setSettingIsActive] = useState(false);

  // Render method for checkbox icon
  const getLayerToggleIcon = () => {
    return visible ? (
      <CheckBoxIcon
        sx={{
          fill: (theme) =>
            !zoomVisible ? theme.palette.warning.dark : theme.palette.primary,
        }}
      />
    ) : (
      <CheckBoxOutlineBlankIcon />
    );
  };

  // Toogles settings area
  const toggleSettings = (e) => {
    e.stopPropagation();
    setSettingIsActive(!settingIsActive);
  };

  const cqlFilterVisible = app.config.mapConfig.map?.cqlFilterVisible || false;

  return (
    <div>
      <ListItemButton
        disableRipple
        onClick={() =>
          toggleable
            ? toggleSubLayer(
                subLayer,
                visible,
                layer.layersInfo[subLayer].caption
              )
            : null
        }
        sx={{
          borderBottom: (theme) =>
            !settingIsActive
              ? `${theme.spacing(0.2)} solid ${theme.palette.divider}`
              : `${theme.spacing(0.2)} solid transparent`,
        }}
        dense
      >
        {toggleable && (
          <IconButton
            disableRipple
            sx={{
              pl: 0,
              pr: "5px",
            }}
          >
            {getLayerToggleIcon()}
          </IconButton>
        )}
        {layer.layersInfo[subLayer].legendIcon && (
          <LegendIcon url={layer.layersInfo[subLayer].legendIcon} />
        )}
        <ListItemText primary={layer.layersInfo[subLayer].caption} />
        <ListItemSecondaryAction>
          <LayerItemOptions
            layer={layer}
            app={app}
            subLayerIndex={subLayerIndex}
            subLayer={true}
          />
          <IconButton size="small" onClick={(e) => toggleSettings(e)}>
            <ExpandMoreOutlinedIcon
              sx={{
                transform: settingIsActive ? "rotate(180deg)" : "",
                transition: "transform 300ms ease",
              }}
            ></ExpandMoreOutlinedIcon>
          </IconButton>
        </ListItemSecondaryAction>
      </ListItemButton>
      <LayerItemCollapse
        layer={layer}
        options={options}
        collapsed={settingIsActive}
        cqlFilterVisible={cqlFilterVisible}
        showOpacity={false}
        showLegend={true}
        subLayerIndex={subLayerIndex}
      ></LayerItemCollapse>
    </div>
  );
}
