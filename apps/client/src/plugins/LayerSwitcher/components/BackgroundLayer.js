import React, { useEffect, useState } from "react";

import BackgroundLayerItem from "./BackgroundLayerItem";

export default function BackgroundLayer({ layer, globalObserver }) {
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
    globalObserver.publish("layerswitcher.backgroundLayerChanged", name);
  };

  return (
    <BackgroundLayerItem
      layer={layer}
      clickCallback={handleLayerItemClick}
      selected={backgroundVisible}
      globalObserver={globalObserver}
    ></BackgroundLayerItem>
  );
}
