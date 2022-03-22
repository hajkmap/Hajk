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

  useEffect(() => {
    // Instantiate the Markdown parser once and for all by
    // assigning the returned value to a ref.
    featurePropsParsing.current = new FeaturePropsParsing({
      globalObserver: globalObserver,
      options: infoclickOptions || [],
    });
  }, [globalObserver, infoclickOptions]);

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
      <MapClickViewerContext.Provider
        value={{ featurePropsParsing: featurePropsParsing.current }}
      >
        <MapClickViewerView featureCollections={featureCollections} />
      </MapClickViewerContext.Provider>
    </Window>
  );
};

export default MapClickViewer;
