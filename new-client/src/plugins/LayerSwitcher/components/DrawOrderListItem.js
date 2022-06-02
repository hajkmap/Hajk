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
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

function DrawOrderListItem({ changeOrder, layer }) {
  const [visible, setVisible] = useState(layer.get("opacity") !== 0);

  const handleChangeVisible = () => {
    layer.set("opacity", visible ? 0 : 1);
    setVisible(!visible);
  };

  const getIconFromLayerType = (layerType) => {
    switch (layerType) {
      case "layer":
      case "group":
        return <LayersIcon />;
      case "base":
        return <WallpaperIcon />;
      case "system":
      default:
        return <GppMaybeIcon />;
    }
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        sx={{
          opacity: visible ? 1 : 0.38,
        }}
        disableRipple={!visible}
        disableTouchRipple={!visible}
      >
        <ListItemIcon>
          {getIconFromLayerType(layer.get("layerType"))}
        </ListItemIcon>
        <ListItemText
          primary={layer.get("caption")}
          secondary={"z-index:" + layer.getZIndex()}
        />
        <IconButton onClick={handleChangeVisible}>
          {visible ? <VisibilityOff /> : <Visibility />}
        </IconButton>
        <IconButton disabled={!visible} onClick={() => changeOrder(layer, +1)}>
          <ArrowUpward />
        </IconButton>
        <IconButton disabled={!visible} onClick={() => changeOrder(layer, -1)}>
          <ArrowDownward />
        </IconButton>
      </ListItemButton>
    </ListItem>
  );
}

export default DrawOrderListItem;
