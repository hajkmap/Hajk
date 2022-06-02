import React, { useCallback, useEffect, useState } from "react";

import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import { IconButton } from "@mui/material";

import LayersIcon from "@mui/icons-material/Layers";
import WallpaperIcon from "@mui/icons-material/Wallpaper";

function DrawOrderListItem({ changeOrder, layer }) {
  return (
    <ListItem disablePadding>
      <ListItemButton>
        <ListItemIcon>
          {layer.get("layerType") === "layer" ? (
            <LayersIcon />
          ) : (
            <WallpaperIcon />
          )}
        </ListItemIcon>
        <ListItemText
          primary={layer.get("caption")}
          secondary={"z-index:" + layer.getZIndex()}
        />
        <IconButton onClick={() => changeOrder(layer, +1)}>
          <ArrowUpward />
        </IconButton>
        <IconButton onClick={() => changeOrder(layer, -1)}>
          <ArrowDownward />
        </IconButton>
      </ListItemButton>
    </ListItem>
  );
}

export default DrawOrderListItem;
