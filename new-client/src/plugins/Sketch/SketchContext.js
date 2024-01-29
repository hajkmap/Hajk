// Base
import React, { createContext, useContext, useState, useMemo } from "react";
// ol
import { Circle, Stroke, Fill, Style } from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";

const SketchContext = createContext();

/* The SketchProvider is the main provider for the Sketch plugin and provides data to pass through the sketch plugin
component tree without having to pass props down manually at every component.
The SketchProvider includes the following:
- state: The state of the plugin (isSelecting, distance, activeStep)
- setState: The function to set the state of the plugin (isSelecting, distance, activeStep)
- isHighlightLayerAdded: Boolean to check if the highlight layer is added 
- setHighlightLayer: Function to set the highlight layer 
- highlightSource: The source for the highlight layer
- highlightLayer: The highlight layer
- bufferSource: The source for the buffer layer
- bufferLayer: The buffer layer
- contextValue: The context value for the plugin and it's using the useMemo hook to prevent infinite loops inside BufferView

This is a temporary solution due to the fact that this new Buffer in the Sketch plugin is affecting the Buffer plugin.
This can be changed in the future when the Buffer plugin is removed or there are any sort of replacement.
*/

export function SketchProvider({ children }) {
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

  // The provider now wraps the children in the SketchContext.Provider and provides the values to the children
  return (
    <SketchContext.Provider
      value={{
        isHighlightLayerAdded,
        setHighlightLayer,
        highlightSource,
        highlightLayer,
        bufferSource,
        bufferLayer,
        contextValue,
      }}
    >
      {children}
    </SketchContext.Provider>
  );
}

// The useSketchLayer is a custom hook that returns the context value for the Sketch plugin
export function useSketchLayer() {
  const context = useContext(SketchContext);
  if (context === undefined) {
    throw new Error("useSketchLayer must be used within a SketchProvider");
  }
  return context;
}
