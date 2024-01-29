import { useState, useEffect } from "react";
import GeoJSON from "ol/format/GeoJSON.js";
import HajkTransformer from "utils/HajkTransformer";
import { hfetch } from "utils/FetchWrapper";
import { useSketchLayer } from "plugins/Sketch/SketchContext.js";

const BufferModel = (settings) => {
  const {
    isHighlightLayerAdded,
    setHighlightLayer,
    highlightSource,
    highlightLayer,
    bufferSource,
    bufferLayer,
  } = useSketchLayer();

  const [isBufferLayerAdded, setIsBufferLayerAdded] = useState(false);
  const { map, pluginShown, toggleObjectButton } = settings;

  const HT = new HajkTransformer({
    projection: map?.getView()?.getProjection()?.getCode(),
  });

  const setActive = (active) => {
    if (active) {
      activateSelecting(false);
    }
  };

  const activateSelecting = (v) => {
    if (v === true) {
      map.clickLock.add("buffer");
    } else {
      map.clickLock.delete("buffer");
    }
  };

  const bufferFeatures = (distance) => {
    const arr = [];

    for (const f of highlightSource.getFeatures()) {
      const bufferedFeature = HT.getBuffered(f, distance);

      arr.push(bufferedFeature);
    }
    bufferSource.addFeatures(arr);
  };

  const clear = () => {
    highlightSource.clear();
    bufferSource.clear();
  };

  const handleClick = async (e) => {
    try {
      if (!map || !map.getView()) {
        return;
      }

      map
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
          clonedFeature.setStyle();
          highlightSource.addFeature(clonedFeature);
        });

      const layers = map.getLayers();
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
              const view = map.getView();
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

              highlightSource.addFeatures(features);
            }
          } catch (error) {
            console.error("Error in feature info request:", error);
          }
        });
    } catch (error) {
      console.error("Error handling click:", error);
    }
  };
  useEffect(() => {
    const setupClickEvent = () => {
      map.on("click", handleClick);
    };

    const removeClickEvent = () => {
      map.un("click", handleClick);
    };

    if (pluginShown) {
      if (!toggleObjectButton) {
        setupClickEvent();
      }

      if (
        !isHighlightLayerAdded &&
        !map.getLayers().getArray().includes(highlightLayer)
      ) {
        map.addLayer(highlightLayer);
      }

      if (
        !isBufferLayerAdded &&
        !map.getLayers().getArray().includes(bufferLayer)
      ) {
        map.addLayer(bufferLayer);
        setIsBufferLayerAdded(true);
      }
    }

    return () => {
      removeClickEvent();

      if (
        isHighlightLayerAdded &&
        map.getLayers().getArray().includes(highlightLayer)
      ) {
        map.removeLayer(highlightLayer);
        setHighlightLayer(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    map,
    highlightLayer,
    highlightSource,
    bufferLayer,
    bufferSource,
    pluginShown,
    isHighlightLayerAdded,
    isBufferLayerAdded,
    setHighlightLayer,
  ]);

  return {
    activateSelecting,
    bufferFeatures,
    clear,
    highlightSource,
    bufferSource,
    highlightLayer,
    bufferLayer,
    map,
    HT,
    setActive,
  };
};

export default BufferModel;
