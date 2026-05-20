import React, { useCallback, useEffect, useRef, useState } from "react";

import { isMobile } from "../../utils/IsMobile";
import Window from "../../components/Window";
import WindowSheet from "../../components/WindowSheet";
import FeaturePropsParsing from "../../components/FeatureInfo/FeaturePropsParsing";

import MapClickViewerView from "./MapClickViewerView";
import { MapClickViewerContext } from "./MapClickViewerContext";

const snapPoints = [0, 0.4, 0.7, 1];

const MapClickViewer = (props) => {
  const { appModel, globalObserver, infoclickOptions } = props;
  const { activeMap } = appModel.config;

  const [open, setOpen] = useState(false);
  const [featureCollections, setFeatureCollections] = useState([]);

  const currentSnapRef = useRef(1);

  const featurePropsParsing = useRef();

  useEffect(() => {
    featurePropsParsing.current = new FeaturePropsParsing({
      globalObserver: globalObserver,
      options: infoclickOptions || [],
    });
  }, [globalObserver, infoclickOptions]);

  const closeWindow = useCallback(() => {
    setOpen(false);
    setFeatureCollections([]);
    appModel.highlight(false);
    globalObserver.publish("mapClick.removeMarker");
  }, [appModel, globalObserver]);

  const panMapAboveSheet = useCallback(
    (snapIndex) => {
      currentSnapRef.current = snapIndex;
      if (snapIndex === 0) return;

      const map = appModel.getMap();
      const { x, y } = appModel.getClickLocationData();
      const view = map.getView();
      const mapSize = map.getSize();
      if (!mapSize) return;

      const sheetFraction = snapPoints[snapIndex];
      const visibleHeight = mapSize[1] * (1 - sheetFraction);
      const targetCenterY = visibleHeight / 2;
      const resolution = view.getResolution();

      const offsetY = (mapSize[1] / 2 - targetCenterY) * resolution;

      view.animate({
        center: [x, y - offsetY],
        duration: 300,
      });
    },
    [appModel]
  );

  useEffect(() => {
    const mapClickObserver = globalObserver.subscribe(
      "mapClick.featureCollections",
      (fc) => {
        if (fc.length > 0) {
          setFeatureCollections(fc);
          setOpen(true);
          if (isMobile) {
            panMapAboveSheet(currentSnapRef.current);
            globalObserver.publish("core.focusMapClick");
          }
          globalObserver.publish("analytics.trackEvent", {
            eventName: "pluginShown",
            pluginName: "mapclickviewer",
            activeMap: activeMap,
          });
        } else {
          closeWindow();
        }
      }
    );

    const focusWindowObserver = isMobile
      ? globalObserver.subscribe("core.focusWindow", () => {
          closeWindow();
        })
      : null;

    return () => {
      mapClickObserver.unsubscribe();
      focusWindowObserver?.unsubscribe();
    };
  }, [closeWindow, globalObserver, activeMap]);

  const { height, position, title, width } = props.infoclickOptions;

  const contextValue = {
    appModel: props.appModel,
    featurePropsParsing: featurePropsParsing.current,
  };

  if (isMobile) {
    return (
      <WindowSheet
        isOpen={open}
        onClose={closeWindow}
        title={title}
        snapPoints={snapPoints}
        initialSnap={1}
        zIndex={1199}
        onSnap={panMapAboveSheet}
      >
        <MapClickViewerContext.Provider value={contextValue}>
          <MapClickViewerView featureCollections={featureCollections} />
        </MapClickViewerContext.Provider>
      </WindowSheet>
    );
  }

  return (
    <Window
      globalObserver={props.globalObserver}
      title={title || "Information"}
      open={open}
      height={height || "dynamic"}
      width={width || 400}
      position={position || "right"}
      mode="window"
      forceBringToFrontOnEvent={"mapClick.featureCollections"}
      onClose={closeWindow}
    >
      <MapClickViewerContext.Provider value={contextValue}>
        <MapClickViewerView featureCollections={featureCollections} />
      </MapClickViewerContext.Provider>
    </Window>
  );
};

export default MapClickViewer;
