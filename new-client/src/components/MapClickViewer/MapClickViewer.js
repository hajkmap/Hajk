import React, { useEffect, useState } from "react";

import Window from "../Window";

// Views
import MapClickViewerView from "./MapClickViewerView";

// Models

const MapClickViewer = (props) => {
  console.log("Render MapClickViewer");

  const { globalObserver } = props;

  const [open, setOpen] = useState(false);
  const [featureCollections, setFeatureCollections] = useState([]);

  useEffect(() => {
    console.log("MapClickViewer subscribing to events");
    const mapClickObserver = globalObserver.subscribe(
      "mapClick.featureCollections",
      (fc) => {
        if (fc.length > 0) {
          console.log("Setting feature collection and opening window:", fc);
          setFeatureCollections(fc);
          setOpen(true);
        }
      }
    );
    return () => {
      console.log("Unsubscribing");
      mapClickObserver.unsubscribe();
    };
  }, [globalObserver]);

  const closeWindow = () => {
    setOpen(false);
  };

  // We're rendering the view in a BaseWindowPlugin, since this is a
  // "standard" plugin.
  return (
    <Window
      globalObserver={props.globalObserver}
      title="MapClickViewer"
      open={open}
      height="dynamic"
      width={400}
      position="right"
      mode="window"
      onClose={closeWindow}
    >
      <MapClickViewerView featureCollections={featureCollections} />
    </Window>
  );
};

export default MapClickViewer;
