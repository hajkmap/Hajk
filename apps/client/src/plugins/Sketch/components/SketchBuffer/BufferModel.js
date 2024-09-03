import { useEffect, useMemo } from "react";
import GeoJSON from "ol/format/GeoJSON.js";
import HajkTransformer from "utils/HajkTransformer";
import { hfetch } from "utils/FetchWrapper";
import { Circle, Stroke, Fill, Style } from "ol/style";

// This is the model for the buffer sketch plugin.
// It almost contains the same logic as the BufferModel.js for the Buffer plugin, with some slight changes.
const BufferModel = (props) => {
  const {
    drawModel,
    drawStyle,
    toggleBufferBtn,
    pluginShown,
    bufferState,
    highlightLayer,
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
      color: "rgba(255, 255, 255, 0.6)",
    }),
    stroke:
      drawStyle.strokeType === "none"
        ? new Stroke({
            color: "rgba(255, 168, 231, 0)",
            width: 4,
          })
        : new Stroke({
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
    zIndex: 5000,
  });

  const activateSelecting = (v) => {
    if (v === true) {
      toggleBufferBtn.map.clickLock.add("buffer");
    } else {
      toggleBufferBtn.map.clickLock.delete("buffer");
    }
  };

  const bufferFeatures = (distance) => {
    for (const f of bufferState.highlightSource.getFeatures()) {
      const bufferedFeature = HT.getBuffered(f, distance);

      drawModel.addFeature(bufferedFeature);
      bufferedFeature.setStyle(bufferStyle);
      bufferedFeature.set("USER_DRAWN", true);
      bufferedFeature.set("bufferedFeature", true);
    }
  };

  const clear = () => {
    bufferState.highlightSource.clear();
    drawModel
      .getAllDrawnFeatures()
      .filter((f) => f.get("bufferedFeature"))
      .forEach((f) => drawModel.removeFeature(f));
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
            const geometryType = f.getGeometry()?.getType();

            // We can't buffer Circle features and we don't want to buffer
            // around existing buffer features - let's exclude them.
            if (!f.get("bufferedFeature") && geometryType !== "Circle") {
              const clonedFeature = f.clone();
              clonedFeature.setStyle(highlightStyle);
              bufferState.highlightSource.addFeature(clonedFeature);
              highlightLayer.setZIndex(5000);
            }
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
    }

    toggleBufferBtn.map.addLayer(highlightLayer);
    // Cleanup function
    return () => {
      removeClickEvent();
      // Remove the highlightLayer if it was added
      toggleBufferBtn.map.removeLayer(highlightLayer);
    };
  }, [
    toggleBufferBtn.map,
    highlightLayer,
    bufferState,
    pluginShown,
    toggleBufferBtn.toggle,
    highlightStyle,
  ]);

  return {
    activateSelecting,
    bufferFeatures,
    clear,
    highlightLayer,
  };
};

export default BufferModel;
