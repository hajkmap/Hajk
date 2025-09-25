import React, { useEffect, useState } from "react";

import BackgroundLayerItem from "./BackgroundLayerItem";

export default function BackgroundLayer({ layer, toggleable, globalObserver }) {
  // Keep visible backgroundlayer in state
  const [backgroundVisible, setBackgroundVisible] = useState(
    layer.get("visible")
  );

  // When component is successfully mounted into the DOM.
  useEffect(() => {
    globalObserver.subscribe(
      "layerswitcher.backgroundLayerChanged",
      (activeLayer) => {
        if (activeLayer !== layer.get("name")) {
          setBackgroundVisible(false);
        } else {
          setBackgroundVisible(true);
        }
      }
    );
  }, [layer, globalObserver]);

  // Handles list item click
  const handleLayerItemClick = () => {
    if (toggleable) {
      const name = layer.get("name");
      if (layer.isFakeMapLayer) {
        switch (name) {
          // Openstreetmap
          case "-3":
            document.getElementById("map").style.backgroundColor = "#FFF";
            break;
          // Black only background
          case "-2":
            document.getElementById("map").style.backgroundColor = "#000";
            break;
          // White only background
          case "-1":
            document.getElementById("map").style.backgroundColor = "#FFF";
            break;
          default:
            break;
        }
      } else {
        document.getElementById("map").style.backgroundColor = "#FFF"; // sets the default background color to white
        layer.setVisible(true);
      }
      // Publish event to ensure all other background layers are disabled
      globalObserver.publish("layerswitcher.backgroundLayerChanged", name);
    }
  };

  return (
    <BackgroundLayerItem
      layer={layer}
      clickCallback={handleLayerItemClick}
      selected={backgroundVisible}
      globalObserver={globalObserver}
    />
  );
}
