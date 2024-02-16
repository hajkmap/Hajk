import { useEffect } from "react";
import GeoJSON from "ol/format/GeoJSON.js";
import HajkTransformer from "utils/HajkTransformer";
import { hfetch } from "utils/FetchWrapper";

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

      arr.push(bufferedFeature);
    }
    bufferState.bufferSource.addFeatures(arr);
  };

  const clear = () => {
    bufferState.highlightSource.clear();
    bufferState.bufferSource.clear();
  };

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
          clonedFeature.setStyle();
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
  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    toggleBufferBtn.map,
    highlightLayer,
    bufferState,
    bufferLayer,
    pluginShown,
  ]);

  return {
    activateSelecting,
    bufferFeatures,
    clear,
  };
};

export default BufferModel;
