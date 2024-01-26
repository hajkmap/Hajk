import React, { createContext, useContext, useState, useMemo } from "react";
import { Circle, Stroke, Fill, Style } from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import Observer from "react-event-observer";

const SketchContext = createContext();

export function SketchProvider({ children }) {
  const [localObserver] = useState(Observer());
  const [state, setState] = useState({
    isSelecting: false,
    distance: 1000,
    activeStep: 0,
  });
  const [isHighlightLayerAdded, setIsHighlightLayerAdded] = useState(false);
  const [highlightSource] = React.useState(new VectorSource());
  const [highlightLayer] = React.useState(
    new VectorLayer({
      source: highlightSource,
      layerType: "system",
      zIndex: 5000,
      name: "pluginBufferSelections",
      caption: "Buffer selection layers",
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 168, 231, 0.47)",
        }),
        stroke: new Stroke({
          color: "rgba(255, 168, 231, 1)",
          width: 4,
        }),
        image: new Circle({
          radius: 6,
          fill: new Fill({
            color: "rgba(255, 168, 231, 0.47)",
          }),
          stroke: new Stroke({
            color: "rgba(255, 168, 231, 1)",
            width: 1,
          }),
        }),
      }),
    })
  );

  const [bufferSource] = React.useState(new VectorSource());
  const [bufferLayer] = React.useState(
    new VectorLayer({
      source: bufferSource,
      layerType: "system",
      zIndex: 5000,
      name: "pluginBuffers",
      caption: "Buffer layer",
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.5)",
        }),
        stroke: new Stroke({
          color: "rgba(75, 100, 115, 1.5)",
          width: 4,
        }),
        image: new Circle({
          radius: 6,
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.5)",
          }),
          stroke: new Stroke({
            color: "rgba(75, 100, 115, 1.5)",
            width: 2,
          }),
        }),
      }),
    })
  );

  const setHighlightLayer = (added) => {
    setIsHighlightLayerAdded(added);
  };

  const contextValue = useMemo(() => ({ state, setState }), [state, setState]);

  return (
    <SketchContext.Provider
      value={{
        isHighlightLayerAdded,
        setHighlightLayer,
        highlightSource,
        highlightLayer,
        bufferSource,
        bufferLayer,
        localObserver,
        contextValue,
      }}
    >
      {children}
    </SketchContext.Provider>
  );
}

export function useSketchLayer() {
  const context = useContext(SketchContext);
  if (context === undefined) {
    throw new Error(
      "useHighlightLayer must be used within a HighlightLayerProvider"
    );
  }
  return context;
}
