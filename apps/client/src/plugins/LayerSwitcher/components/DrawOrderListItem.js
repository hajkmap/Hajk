import React, { useEffect } from "react";

import {
  Icon,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Slider,
  SvgIcon,
} from "@mui/material";
import HajkToolTip from "components/HajkToolTip";

import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import FolderIcon from "@mui/icons-material/Folder";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import LayersIcon from "@mui/icons-material/Layers";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import WallpaperIcon from "@mui/icons-material/Wallpaper";

function MouseClickIcon(props) {
  return (
    <HajkToolTip title="Lagret är klickbart i kartan">
      <SvgIcon {...props} viewBox="0 0 109.21 122.88">
        <path d="M86,122.31a5.57,5.57,0,0,1-.9.35,5.09,5.09,0,0,1-1,.18,5.46,5.46,0,0,1-1,0,6.77,6.77,0,0,1-1-.15,6,6,0,0,1-1-.36l0,0a5.51,5.51,0,0,1-.92-.53l0,0a6.41,6.41,0,0,1-.78-.69,5.19,5.19,0,0,1-.65-.87l-9.08-14.88-7.69,9a15.49,15.49,0,0,1-1.1,1.18c-.39.37-.78.71-1.18,1l-.08.06a12.19,12.19,0,0,1-1.2.82,9.66,9.66,0,0,1-1.24.63,6.91,6.91,0,0,1-1,.37,6.21,6.21,0,0,1-1,.22,7.55,7.55,0,0,1-1.06.07,7.19,7.19,0,0,1-1-.11,6.14,6.14,0,0,1-1.18-.35,5.42,5.42,0,0,1-1.06-.57,6.22,6.22,0,0,1-.92-.78l0,0a7.31,7.31,0,0,1-.75-1l-.11-.2-.09-.21L47.72,112l0-.17L40.91,43.26a4.52,4.52,0,0,1,0-1.33,4.3,4.3,0,0,1,.43-1.25,4.31,4.31,0,0,1,1.39-1.55l0,0a3.82,3.82,0,0,1,.9-.46,4.25,4.25,0,0,1,1-.24h0a4.31,4.31,0,0,1,1.29.05,4.67,4.67,0,0,1,1.25.44l.3.16c13.51,8.84,26.1,17.06,38.64,25.25l19,12.39a11.72,11.72,0,0,1,1,.72l0,0a8.78,8.78,0,0,1,.82.73l.06.07a7.41,7.41,0,0,1,.71.82,5.91,5.91,0,0,1,.57.87,6.42,6.42,0,0,1,.51,1.14,5.6,5.6,0,0,1,.26,1.17,5.44,5.44,0,0,1,0,1.21h0a6.59,6.59,0,0,1-.23,1.19,6.54,6.54,0,0,1-.94,1.88,6.41,6.41,0,0,1-.67.83,7.45,7.45,0,0,1-.82.76,10.42,10.42,0,0,1-1.16.83,12.92,12.92,0,0,1-1.34.7c-.47.21-1,.41-1.46.58a14.27,14.27,0,0,1-1.55.43h0c-2.77.54-5.53,1.21-8.27,1.87l-3.25.77,9,14.94a5.84,5.84,0,0,1,.46,1,5.59,5.59,0,0,1,.15,3.21l0,.1a5.53,5.53,0,0,1-.33.94,6.43,6.43,0,0,1-.51.89,5.62,5.62,0,0,1-.68.81,6,6,0,0,1-.82.67l-2,1.29A83,83,0,0,1,86,122.31ZM37.63,19.46a4,4,0,0,1-6.92,4l-8-14a4,4,0,0,1,6.91-4l8.06,14Zm-15,46.77a4,4,0,0,1,4,6.91l-14,8.06a4,4,0,0,1-4-6.91l14-8.06ZM20.56,39.84a4,4,0,0,1-2.07,7.72L3,43.36A4,4,0,0,1,5,35.64l15.53,4.2ZM82,41.17a4,4,0,0,1-4-6.91L92,26.2a4,4,0,0,1,4,6.91L82,41.17ZM63.46,20.57a4,4,0,1,1-7.71-2.06L59.87,3A4,4,0,0,1,67.59,5L63.46,20.57Zm20.17,96.36,9.67-5.86c-3.38-5.62-8.85-13.55-11.51-19.17a2.17,2.17,0,0,1-.12-.36,2.4,2.4,0,0,1,1.81-2.87c5.38-1.23,10.88-2.39,16.22-3.73a10.28,10.28,0,0,0,1.8-.58,6.11,6.11,0,0,0,1.3-.77,3.38,3.38,0,0,0,.38-.38.9.9,0,0,0,.14-.24l-.06-.18a2.15,2.15,0,0,0-.44-.53,5.75,5.75,0,0,0-.83-.63L47.06,45.75c2.11,21.36,5.2,44.1,6.45,65.31a6.28,6.28,0,0,0,.18,1,2.89,2.89,0,0,0,.26.62l.13.14a1,1,0,0,0,.29,0,2.76,2.76,0,0,0,.51-.17,5.71,5.71,0,0,0,1.28-.79,11.22,11.22,0,0,0,1.35-1.33c1.93-2.27,9.6-12.14,11.4-13.18a2.4,2.4,0,0,1,3.28.82l11.44,18.75Z" />
      </SvgIcon>
    </HajkToolTip>
  );
}

function MouseNoClickIcon(props) {
  return (
    <HajkToolTip title="Lagret är inte klickbart i kartan">
      <SvgIcon {...props} viewBox="0 0 109.21 122.88">
        <path d="m86,122.31a5.57,5.57 0 0 1 -0.9,0.35a5.09,5.09 0 0 1 -1,0.18a5.46,5.46 0 0 1 -1,0a6.77,6.77 0 0 1 -1,-0.15a6,6 0 0 1 -1,-0.36l0,0a5.51,5.51 0 0 1 -0.92,-0.53l0,0a6.41,6.41 0 0 1 -0.78,-0.69a5.19,5.19 0 0 1 -0.65,-0.87l-9.08,-14.88l-7.69,9a15.49,15.49 0 0 1 -1.1,1.18c-0.39,0.37 -0.78,0.71 -1.18,1l-0.08,0.06a12.19,12.19 0 0 1 -1.2,0.82a9.66,9.66 0 0 1 -1.24,0.63a6.91,6.91 0 0 1 -1,0.37a6.21,6.21 0 0 1 -1,0.22a7.55,7.55 0 0 1 -1.06,0.07a7.19,7.19 0 0 1 -1,-0.11a6.14,6.14 0 0 1 -1.18,-0.35a5.42,5.42 0 0 1 -1.06,-0.57a6.22,6.22 0 0 1 -0.92,-0.78l0,0a7.31,7.31 0 0 1 -0.75,-1l-0.11,-0.2l-0.09,-0.21l-1.29,-3.49l0,-0.17l-6.81,-68.57a4.52,4.52 0 0 1 0,-1.33a4.3,4.3 0 0 1 0.43,-1.25a4.31,4.31 0 0 1 1.39,-1.55l0,0a3.82,3.82 0 0 1 0.9,-0.46a4.25,4.25 0 0 1 1,-0.24l0,0a4.31,4.31 0 0 1 1.29,0.05a4.67,4.67 0 0 1 1.25,0.44l0.3,0.16c13.51,8.84 26.1,17.06 38.64,25.25l19,12.39a11.72,11.72 0 0 1 1,0.72l0,0a8.78,8.78 0 0 1 0.82,0.73l0.06,0.07a7.41,7.41 0 0 1 0.71,0.82a5.91,5.91 0 0 1 0.57,0.87a6.42,6.42 0 0 1 0.51,1.14a5.6,5.6 0 0 1 0.26,1.17a5.44,5.44 0 0 1 0,1.21l0,0a6.59,6.59 0 0 1 -0.23,1.19a6.54,6.54 0 0 1 -0.94,1.88a6.41,6.41 0 0 1 -0.67,0.83a7.45,7.45 0 0 1 -0.82,0.76a10.42,10.42 0 0 1 -1.16,0.83a12.92,12.92 0 0 1 -1.34,0.7c-0.47,0.21 -1,0.41 -1.46,0.58a14.27,14.27 0 0 1 -1.55,0.43l0,0c-2.77,0.54 -5.53,1.21 -8.27,1.87l-3.25,0.77l9,14.94a5.84,5.84 0 0 1 0.46,1a5.59,5.59 0 0 1 0.15,3.21l0,0.1a5.53,5.53 0 0 1 -0.33,0.94a6.43,6.43 0 0 1 -0.51,0.89a5.62,5.62 0 0 1 -0.68,0.81a6,6 0 0 1 -0.82,0.67l-2,1.29a83,83 0 0 1 -8.62,5.17zm-48.37,-102.85a4,4 0 0 1 -6.92,4l-8,-14a4,4 0 0 1 6.91,-4l8.06,14l-0.05,0zm-15,46.77a4,4 0 0 1 4,6.91l-14,8.06a4,4 0 0 1 -4,-6.91l14,-8.06zm-2.07,-26.39a4,4 0 0 1 -2.07,7.72l-15.49,-4.2a4,4 0 0 1 2,-7.72l15.53,4.2l0.03,0zm61.44,1.33a4,4 0 0 1 -4,-6.91l14,-8.06a4,4 0 0 1 4,6.91l-14,8.06zm-18.54,-20.6a4,4 0 1 1 -7.71,-2.06l4.12,-15.51a4,4 0 0 1 7.72,2l-4.13,15.57zm20.17,96.36l9.67,-5.86c-3.38,-5.62 -8.85,-13.55 -11.51,-19.17a2.17,2.17 0 0 1 -0.12,-0.36a2.4,2.4 0 0 1 1.81,-2.87c5.38,-1.23 10.88,-2.39 16.22,-3.73a10.28,10.28 0 0 0 1.8,-0.58a6.11,6.11 0 0 0 1.3,-0.77a3.38,3.38 0 0 0 0.38,-0.38a0.9,0.9 0 0 0 0.14,-0.24l-0.06,-0.18a2.15,2.15 0 0 0 -0.44,-0.53a5.75,5.75 0 0 0 -0.83,-0.63l-54.93,-35.88c2.11,21.36 5.2,44.1 6.45,65.31a6.28,6.28 0 0 0 0.18,1a2.89,2.89 0 0 0 0.26,0.62l0.13,0.14a1,1 0 0 0 0.29,0a2.76,2.76 0 0 0 0.51,-0.17a5.71,5.71 0 0 0 1.28,-0.79a11.22,11.22 0 0 0 1.35,-1.33c1.93,-2.27 9.6,-12.14 11.4,-13.18a2.4,2.4 0 0 1 3.28,0.82l11.44,18.75l0,0.01z" />
        <line
          stroke="#000"
          strokeWidth="7"
          y2="3.7693"
          x2="105.56343"
          y1="118.83671"
          x1="3.92054"
        />
      </SvgIcon>
    </HajkToolTip>
  );
}

export default function DrawOrderListItem({ changeOrder, layer }) {
  // We want let user toggle a layer on/off without actually removing it
  // from the list of visible layers. To accomplish this, we will change
  // the layer's opacity between 0 and 1.

  // We keep the opacity in state…
  const [opacity, setOpacity] = React.useState(layer.get("opacity"));

  // …and let a useEffect manage the actual OL layer's opacity.
  useEffect(() => {
    layer.set("opacity", opacity);
  }, [layer, opacity]);

  const handleOpacitySliderChange = (event, newValue) => {
    setOpacity(newValue);
  };

  const handleVisibilityButtonClick = () => {
    setOpacity(opacity === 0 ? 1 : 0);
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
          return <LayersIcon />;
        case "group":
          return <FolderIcon />;
        case "base":
          return <WallpaperIcon />;
        case "system":
        default:
          return <GppMaybeIcon />;
      }
    }
  };

  const getFriendlyTypeFromLayer = (layer) => {
    switch (layer.get("layerType")) {
      case "layer":
        return "Lager";
      case "group":
        return "Grupplager";
      case "base":
        return "Bakgrundslager";
      case "system":
      default:
        return "Systemlager";
    }
  };

  const isLayerQueryable = (layer) => {
    // The simplest option. Vector layers will have this property set.
    if (layer.get("queryable") === true) {
      return true;
    }

    // If we got this far, we must search further. The WMS and WMTS layers
    // lack a handy top property. The 'queryable' property is set on each
    // sublayer instead.
    // One problem is that we display grouplayers as one item in the list.
    // The 'queryable' settings is a property of each sublayer though, so we
    // can have a situation where only one sublayer is queryable in a grouplayer.
    // In this case, we want to display the item in the list as queryable (even
    // if only one of its ingredients is). The simple solution is to search for
    // the first sublayer that has the property sat to true - if we find it, we
    // consider the entire group queryable.
    return (
      layer.layersInfo !== undefined &&
      Object.values(layer.layersInfo).findIndex(
        (sl) => sl.queryable === true
      ) !== -1
    );
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        sx={{
          // When a layer is toggled off, we want to make it look
          // more "light" in the list.
          opacity: opacity > 0 ? 1 : 0.38,
        }}
        disableRipple
        disableTouchRipple
      >
        <ListItemIcon>
          <HajkToolTip title={getFriendlyTypeFromLayer(layer)}>
            {getIconFromLayer(layer)}
          </HajkToolTip>
        </ListItemIcon>

        <ListItemIcon>
          {layer.get("layerType") !== "system" &&
            (isLayerQueryable(layer) ? (
              <MouseClickIcon />
            ) : (
              <MouseNoClickIcon />
            ))}
        </ListItemIcon>
        <ListItemText
          primary={layer.get("caption")}
          secondary={
            <Slider
              aria-label="Layer opacity"
              value={opacity}
              onChange={handleOpacitySliderChange}
              size="small"
              min={0}
              max={1}
              step={0.01}
            />
          }
        />
        <HajkToolTip title={(opacity > 0 ? "Dölj " : "Visa ") + "lager"}>
          <IconButton onClick={handleVisibilityButtonClick}>
            {opacity > 0 ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </HajkToolTip>
        <IconButton
          disabled={opacity === 0}
          onClick={() => changeOrder(layer, +1)}
        >
          <ArrowUpward />
        </IconButton>
        <IconButton
          disabled={opacity === 0}
          onClick={() => changeOrder(layer, -1)}
        >
          <ArrowDownward />
        </IconButton>
      </ListItemButton>
    </ListItem>
  );
}
