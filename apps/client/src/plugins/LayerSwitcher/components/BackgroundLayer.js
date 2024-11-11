import React, { useEffect, useState } from "react";

import LayerItem from "./LayerItem";

import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import WallpaperIcon from "@mui/icons-material/Wallpaper";
import RadioButtonChecked from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";

export default function BackgroundLayer({ layer, app, toggleable, draggable }) {
  // Keep visible backgroundlayer in state
  const [backgroundVisible, setBackgroundVisible] = useState(
    layer.get("visible")
  );

  // When component is successfully mounted into the DOM.
  useEffect(() => {
    app.globalObserver.subscribe(
      "layerswitcher.backgroundLayerChanged",
      (activeLayer) => {
        if (activeLayer !== layer.get("name")) {
          if (!layer.isFakeMapLayer) {
            layer.setVisible(false);
          }
          setBackgroundVisible(false);
        } else {
          setBackgroundVisible(true);
        }
      }
    );
  }, [layer, app.globalObserver]);

  // Handles list item click
  const handleLayerItemClick = () => {
    const name = layer.get("name");
    document.getElementById("map").style.backgroundColor = "#FFF"; // sets the default background color to white
    if (layer.isFakeMapLayer) {
      switch (name) {
        case "-2":
          document.getElementById("map").style.backgroundColor = "#000";
          break;
        case "-1":
        default:
          document.getElementById("map").style.backgroundColor = "#FFF";
          break;
      }
    } else {
      layer.setVisible(true);
    }
    // Publish event to ensure all other background layers are disabled
    app.globalObserver.publish("layerswitcher.backgroundLayerChanged", name);
  };

  // Render method for backgroundlayer icon
  const getLayerToggleIcon = () => {
    if (toggleable) {
      return !backgroundVisible ? (
        <RadioButtonUnchecked sx={{ ml: 2 }} />
      ) : (
        <RadioButtonChecked sx={{ ml: 2 }} />
      );
    }
    return layer.isFakeMapLayer ? (
      <WallpaperIcon sx={{ mr: "5px" }} />
    ) : (
      <PublicOutlinedIcon sx={{ mr: "5px" }} />
    );
  };

  return (
    <LayerItem
      layer={layer}
      app={app}
      draggable={draggable}
      isBackgroundLayer={true}
      toggleable={toggleable}
      clickCallback={handleLayerItemClick}
      toggleIcon={getLayerToggleIcon()}
    ></LayerItem>
  );
}
