import React, { useEffect, createContext, useContext, useRef } from "react";

import LayerSwitcherView from "./LayerSwitcherView.js";

// TODO Set up OSM/black/white here?

const createDispatch = (map) => {
  const olBackgroundLayers = map
    .getLayers()
    .getArray()
    .filter((l) => l.get("layerType") === "base");

  return {
    setLayerVisibility(layerId, visible) {
      console.log("LS Dispatcher:", "setLayerVisibility", layerId);
      const layer = map.getAllLayers().find((l) => l.get("name") === layerId);
      layer.setVisible(visible);
    },
    setBackgroundLayer(layerId) {
      console.log("LS Dispatcher:", "setBackgroundLayer", layerId);
      olBackgroundLayers.forEach((l) => l?.setVisible(false));

      const layer = map.getAllLayers().find((l) => l.get("name") === layerId);
      console.log(layerId, layer, olBackgroundLayers);
      layer?.setVisible(true);
    },
    setLayerOpacity(layerId, visible) {
      console.log("LS Dispatcher:", "setLayerOpacity", layerId);
      const layer = map.getAllLayers().find((l) => l.get("name") === layerId);
      layer.setVisible(visible);
    },
    setLayerQuickAccess(layerId, partOfQuickAccess) {
      console.log("LS Dispatcher:", "setLayerQuickAccess", layerId);
      console.log(partOfQuickAccess);
      // const layer = map.getAllLayers().filter((l) => l.get("name") === layerId);
      // layer.setVisible(visible);
      // set all other background layers to not visible
    },
    addVisibleLayersToQuickAccess() {
      console.log("LS Dispatcher:", "setLayerQuickAccess");
      const visibleLayers = map
        .getAllLayers()
        .filter(
          (l) =>
            l.get("visible") === true &&
            l.get("layerType") !== "base" &&
            l.get("layerType") !== "system"
        );
      // enqueueSnackbar &&
      //   enqueueSnackbar(`Tända lager har nu lagts till i snabbåtkomst.`, {
      //     variant: "success",
      //     anchorOrigin: { vertical: "bottom", horizontal: "center" },
      //   });
      const QUICK_ACCESS_KEY = "quickAccess";
      visibleLayers.forEach((l) => l.set(QUICK_ACCESS_KEY, true));
    },
    clearQuickAccess() {
      console.log("LS Dispatcher:", "setLayerQuickAccess");
      const QUICK_ACCESS_KEY = "quickAccess";
      map
        .getAllLayers()
        .filter(
          (l) =>
            l.get("visible") === true &&
            l.get("layerType") !== "base" &&
            l.get("layerType") !== "system"
        )
        .map((l) => l.set(QUICK_ACCESS_KEY, false));

      // enqueueSnackbar &&
      //   enqueueSnackbar(`Tända lager har nu lagts till i snabbåtkomst.`, {
      //     variant: "success",
      //     anchorOrigin: { vertical: "bottom", horizontal: "center" },
      //   });
    },
    // set sublayers
    // set quickAccess
    // set ZIndex
    // set sublayers
  };
};

const LayerSwitcherDispatchContext = createContext(null);

export const useLayerSwitcherDispatch = () =>
  useContext(LayerSwitcherDispatchContext);

const LayerSwitcherProvider = ({
  app,
  map,
  localObserver,
  globalObserver,
  options,
  windowVisible,
}) => {
  useEffect(() => {
    const fn = (l) => (e) => {
      // TODO
      console.log("layer:change", l.get("caption"), e);
    };

    const listeners = map.getAllLayers().map((l) => {
      const layerFn = fn(l);
      l.on("propertychange", layerFn);
      return layerFn;
    });

    return () => {
      map.getAllLayers().forEach((l, i) => {
        const fn = listeners[i];
        if (fn) {
          l.un("propertychange", fn);
        }
      });
    };
  }, [map]);

  const dispatcher = useRef(createDispatch(map));

  return (
    <LayerSwitcherDispatchContext.Provider value={dispatcher.current}>
      <LayerSwitcherView
        app={app}
        map={map}
        localObserver={localObserver}
        globalObserver={globalObserver}
        options={options}
        windowVisible={windowVisible}
      />
    </LayerSwitcherDispatchContext.Provider>
  );
};

export default LayerSwitcherProvider;
