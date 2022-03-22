import React, { useEffect, useRef, useState } from "react";

import Window from "components/Window";
import FeaturePropsParsing from "components/FeatureInfo/FeaturePropsParsing";

import MapClickViewerView from "./MapClickViewerView";
import { MapClickViewerContext } from "./MapClickViewerContext";

const MapClickViewer = (props) => {
  const { globalObserver, infoclickOptions } = props;

  const [open, setOpen] = useState(false);
  const [featureCollections, setFeatureCollections] = useState([]);

  // Used to hold the instance of FeaturePropsParsing class
  const featurePropsParsing = useRef();

  // Instantiate the Markdown parser once and for all by
  // assigning the returned value to a ref.
  useEffect(() => {
    featurePropsParsing.current = new FeaturePropsParsing({
      globalObserver: globalObserver,
      options: infoclickOptions || [],
    });
  }, [globalObserver, infoclickOptions]);

  // Subscribe to events on global observer
  useEffect(() => {
    console.log("MapClickViewer subscribing to events");
    const mapClickObserver = globalObserver.subscribe(
      "mapClick.featureCollections",
      (fc) => {
        console.log("mapClick.featureCollections", fc);
        if (fc.length > 0) {
          setFeatureCollections(fc);
          setOpen(true);
        } else {
          closeWindow();
        }
      }
    );
    return () => {
      console.log("MapClickViewer unsubscribing from events");
      mapClickObserver.unsubscribe();
    };
  }, [globalObserver]);

  const closeWindow = () => {
    // Hide window
    setOpen(false);

    // Important: reset feature collections to ensure nothing else is rendered
    setFeatureCollections([]);
  };

  return (
    <Window
      globalObserver={props.globalObserver}
      title="Information"
      open={open}
      height="dynamic"
      width={400}
      position="right"
      mode="window"
      onClose={closeWindow}
    >
      <MapClickViewerContext.Provider
        value={{ featurePropsParsing: featurePropsParsing.current }}
      >
        <MapClickViewerView featureCollections={featureCollections} />
      </MapClickViewerContext.Provider>
    </Window>
  );
};

export default MapClickViewer;
