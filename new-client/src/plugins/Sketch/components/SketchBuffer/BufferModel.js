import { useEffect, useMemo } from "react";
import GeoJSON from "ol/format/GeoJSON.js";
import HajkTransformer from "utils/HajkTransformer";
import { hfetch } from "utils/FetchWrapper";
import { Circle, Stroke, Fill, Style } from "ol/style";

// This is the model for the buffer sketch plugin.
// It almost contains the same logic as the BufferModel.js for the Buffer plugin, with some slight changes.
// The main difference is that we use isHighlightLayerAdded and isBufferLayerAdded to keep track of the layers added to the map.
// It helps with the logic to add and remove the layers from the map and not make duplicates.
const BufferModel = (props) => {
  const {
    toggleBufferBtn,
    pluginShown,
    bufferState,
    setBufferState,
    highlightLayer,
    bufferLayer,
  } = props;

  const HT = new HajkTransformer({
    projection: toggleBufferBtn.map?.getView()?.getProjection()?.getCode(),
  });

  // The default style for a highlighted feature, useMemo to avoid creating a new style on every render, since this is used in an effect.
  const highlightStyle = useMemo(
    () =>
      new Style({
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
    []
  );
  // The default style for a buffered feature.
  const bufferStyle = new Style({
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
  });

  const activateSelecting = (v) => {
    if (v === true) {
      toggleBufferBtn.map.clickLock.add("buffer");
    } else {
      toggleBufferBtn.map.clickLock.delete("buffer");
    }
  };

  const bufferFeatures = (distance) => {
    const arr = [];

    for (const f of bufferState.highlightSource.getFeatures()) {
      const bufferedFeature = HT.getBuffered(f, distance);

      bufferedFeature.setStyle(bufferStyle);
      arr.push(bufferedFeature);
    }
    bufferState.bufferSource.addFeatures(arr);
  };

  const clear = () => {
    bufferState.highlightSource.clear();
    bufferState.bufferSource.clear();
  };

  useEffect(() => {
    const handleClick = async (e) => {
      try {
        if (!toggleBufferBtn.map || !toggleBufferBtn.map.getView()) {
          return;
        }

        toggleBufferBtn.map
          .getFeaturesAtPixel(e.pixel, {
            layerFilter: function (l) {
              const name = l.get("name");
              return (
                name !== "pluginBuffers" && name !== "pluginBufferSelections"
              );
            },
          })
          .forEach((f) => {
            const clonedFeature = f.clone();
            clonedFeature.setStyle(highlightStyle);
            bufferState.highlightSource.addFeature(clonedFeature);
          });

        const layers = toggleBufferBtn.map.getLayers();
        if (!layers) {
          return;
        }

        layers
          .getArray()
          .filter((l) => l.getVisible() && l.layersInfo)
          .forEach(async (layer) => {
            try {
              const subLayers = Object.values(layer.layersInfo);
              const subLayersToQuery = subLayers
                .filter((subLayer) => subLayer.queryable === true)
                .map((queryableSubLayer) => queryableSubLayer.id);

              if (e.coordinate !== undefined) {
                const view = toggleBufferBtn.map.getView();
                if (!view) {
                  return;
                }

                const url = layer
                  .getSource()
                  .getFeatureInfoUrl(
                    e.coordinate,
                    view.getResolution(),
                    view.getProjection().getCode(),
                    {
                      INFO_FORMAT: "application/json",
                      QUERY_LAYERS: subLayersToQuery.join(","),
                    }
                  );

                const response = await hfetch(url);
                const json = await response.json();
                const features = new GeoJSON().readFeatures(json);

                bufferState.highlightSource.addFeatures(features);
              }
            } catch (error) {
              console.error("Error in feature info request:", error);
            }
          });
      } catch (error) {
        console.error("Error handling click:", error);
      }
    };
    const setupClickEvent = () => {
      toggleBufferBtn.map.on("click", handleClick);
    };

    const removeClickEvent = () => {
      toggleBufferBtn.map.un("click", handleClick);
    };

    if (pluginShown) {
      if (!toggleBufferBtn.toggle) {
        setupClickEvent();
      }

      if (
        !bufferState.isHighlightLayerAdded &&
        !toggleBufferBtn.map.getLayers().getArray().includes(highlightLayer)
      ) {
        toggleBufferBtn.map.addLayer(highlightLayer);
      }

      if (
        !bufferState.isBufferLayerAdded &&
        !toggleBufferBtn.map.getLayers().getArray().includes(bufferLayer)
      ) {
        toggleBufferBtn.map.addLayer(bufferLayer);
        setBufferState({ ...bufferState, isBufferLayerAdded: true });
      }
    }

    return () => {
      removeClickEvent();
      if (
        bufferState.isHighlightLayerAdded &&
        toggleBufferBtn.map.getLayers().getArray().includes(highlightLayer)
      ) {
        toggleBufferBtn.map.removeLayer(highlightLayer);
        setBufferState({ ...bufferState, isHighlightLayerAdded: false });
      }
    };
  }, [
    toggleBufferBtn.map,
    highlightLayer,
    bufferState,
    bufferLayer,
    pluginShown,
    setBufferState,
    toggleBufferBtn.toggle,
    highlightStyle,
  ]);

  return {
    activateSelecting,
    bufferFeatures,
    clear,
  };
};

export default BufferModel;
