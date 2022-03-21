import React, { useEffect, useState } from "react";

import Window from "../Window";

// Views
import MapClickViewerView from "./MapClickViewerView";

// Models

// Context
import { MapClickViewerContext } from "./MapClickViewerContext";

const MapClickViewer = (props) => {
  console.log("MapClickViewer props: ", props);

  const { globalObserver } = props;

  const [open, setOpen] = useState(false);
  const [featureCollections, setFeatureCollections] = useState([]);

  useEffect(() => {
    console.log("MapClickViewer subscribing to events");
    const mapClickObserver = globalObserver.subscribe(
      "mapClick.featureCollections",
      (fc) => {
        console.log(
          "Setting feature collection to this and showing windows (if there are any collections):",
          fc
        );
        if (fc.length > 0) {
          setFeatureCollections(fc);
          setOpen(true);
        } else {
          setFeatureCollections([]);
          setOpen(false);
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
      <MapClickViewerContext.Provider value={{ ...props }}>
        <MapClickViewerView featureCollections={featureCollections} />
      </MapClickViewerContext.Provider>
    </Window>
  );
};

export default MapClickViewer;
