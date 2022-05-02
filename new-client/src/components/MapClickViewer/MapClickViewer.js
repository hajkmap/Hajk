import React, { useCallback, useEffect, useRef, useState } from "react";

import Window from "components/Window";
import FeaturePropsParsing from "components/FeatureInfo/FeaturePropsParsing";

import MapClickViewerView from "./MapClickViewerView";
import { MapClickViewerContext } from "./MapClickViewerContext";

const MapClickViewer = (props) => {
  const { appModel, globalObserver, infoclickOptions } = props;

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

  const closeWindow = useCallback(() => {
    // Hide window
    setOpen(false);

    // Important: reset feature collections to ensure nothing else is rendered
    setFeatureCollections([]);

    // Remove highlight from any highlighted features in map
    appModel.highlight(false);

    // Tell the MapClickModel to remove the clicked marker
    globalObserver.publish("mapClick.removeMarker");
  }, [appModel, globalObserver]);

  // Subscribe to events on global observer
  useEffect(() => {
    const mapClickObserver = globalObserver.subscribe(
      "mapClick.featureCollections",
      (fc) => {
        if (fc.length > 0) {
          setFeatureCollections(fc);
          setOpen(true);
        } else {
          closeWindow();
        }
      }
    );
    return () => {
      mapClickObserver.unsubscribe();
    };
  }, [closeWindow, globalObserver]);

  const { height, position, title, width } = props.infoclickOptions;

  return (
    <Window
      globalObserver={props.globalObserver}
      title={title || "Information"}
      open={open}
      height={height || "dynamic"}
      width={width || 400}
      position={position || "right"}
      mode="window"
      onClose={closeWindow}
    >
      <MapClickViewerContext.Provider
        value={{
          appModel: props.appModel,
          featurePropsParsing: featurePropsParsing.current,
        }}
      >
        <MapClickViewerView featureCollections={featureCollections} />
      </MapClickViewerContext.Provider>
    </Window>
  );
};

export default MapClickViewer;
