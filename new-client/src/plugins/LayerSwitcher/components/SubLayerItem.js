import React from "react";

import {
  IconButton,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";

import LegendIcon from "./LegendIcon";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";

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

  // Show layer details action
  const showLayerDetails = (e) => {
    e.stopPropagation();
    app.globalObserver.publish("setLayerDetails", {
      layer: layer,
      subLayerIndex: subLayerIndex,
    });
  };

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
            `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
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
          <IconButton size="small" onClick={(e) => showLayerDetails(e)}>
            <KeyboardArrowRightOutlinedIcon
              sx={{
                color: (theme) => theme.palette.grey[500],
              }}
            ></KeyboardArrowRightOutlinedIcon>
          </IconButton>
        </ListItemSecondaryAction>
      </ListItemButton>
    </div>
  );
}
