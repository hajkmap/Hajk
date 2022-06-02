import React, { useCallback, useEffect, useState } from "react";

import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import { Icon, IconButton } from "@mui/material";

import LayersIcon from "@mui/icons-material/Layers";
import WallpaperIcon from "@mui/icons-material/Wallpaper";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

function DrawOrderListItem({ changeOrder, layer }) {
  // We want let user toggle a layer on/off without actually removing it
  // from the list of visible layers. To accomplish this, we will change
  // the layer's opacity between 0 and 1.
  const [visible, setVisible] = useState(layer.get("opacity") !== 0);

  const handleChangeVisible = () => {
    layer.set("opacity", visible ? 0 : 1);
    setVisible(!visible);
  };

  // To make the layers list more fun, we want to display an icon next to
  // the layer.
  const getIconFromLayer = (layer) => {
    // Some layers can have a "infoclickIcon" property. If so, use it.
    const layerSpecificIcon =
      layer.get("layerInfo")?.infoclickIcon || layer.get("infoclickIcon");
    if (layerSpecificIcon !== undefined) {
      return <Icon>{layerSpecificIcon}</Icon>;
    } else {
      // Else, let's pick an icon depending on the layer's type.
      switch (layer.get("layerType")) {
        case "layer":
        case "group":
          return <LayersIcon />;
        case "base":
          return <WallpaperIcon />;
        case "system":
        default:
          return <GppMaybeIcon />;
      }
    }
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        sx={{
          // When a layer is toggled off, we want to make it look
          // more "light" in the list.
          opacity: visible ? 1 : 0.38,
        }}
        disableRipple={!visible}
        disableTouchRipple={!visible}
      >
        <ListItemIcon>{getIconFromLayer(layer)}</ListItemIcon>
        <ListItemText
          primary={layer.get("caption")}
          secondary={"zIndex:" + layer.getZIndex()}
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
