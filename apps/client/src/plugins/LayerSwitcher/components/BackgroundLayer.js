import React, { useEffect, useState } from "react";

import BackgroundLayerItem from "./BackgroundLayerItem";

export default function BackgroundLayer({ layer, app }) {
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

  return (
    <BackgroundLayerItem
      layer={layer}
      app={app}
      clickCallback={handleLayerItemClick}
      selected={backgroundVisible}
      globalObserver={app.globalObserver}
    ></BackgroundLayerItem>
  );
}
