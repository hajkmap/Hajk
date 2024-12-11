import React, {
  useEffect,
  createContext,
  useContext,
  useRef,
  useSyncExternalStore,
  useState,
} from "react";

import LayerSwitcherView from "./LayerSwitcherView.js";
import useSnackbar from "../../hooks/useSnackbar";
import { useLayerZoomWarningSnackbar } from "./useLayerZoomWarningSnackbar";

const MapZoomContext = createContext(null);
export const useMapZoom = () => useContext(MapZoomContext);
const MapZoomProvider = ({ map, children }) => {
  const [zoom, setZoom] = useState(map.getView().getZoom());

  useEffect(() => {
    const handler = (_) => {
      // using moveend to create a throttled zoomEnd event
      // instead of using change:resolution to minimize events being fired.
      const newZoom = map.getView().getZoom();
      if (zoom !== newZoom) {
        setZoom(newZoom);
      }
    };

    map.on("moveend", handler);

    return () => {
      map.un("moveend", handler);
    };
  }, [map, zoom]);

  return (
    <MapZoomContext.Provider value={zoom}>{children}</MapZoomContext.Provider>
  );
};

// TODO This is a fix to listen on all layers with zoom check
const LayerZoomListener = ({ layer }) => {
  const layerMinZoom = layer.get("minZoom");
  const layerMaxZoom = layer.get("maxZoom");
  const layerIsToggled = layer.get("visible");
  const layerMinMaxZoomAlertOnToggleOnly = layer.get(
    "minMaxZoomAlertOnToggleOnly"
  );
  const layerId = layer.get("name");
  const caption = layer.get("caption");

  useLayerZoomWarningSnackbar(
    layerMinZoom,
    layerMaxZoom,
    layerIsToggled,
    layerMinMaxZoomAlertOnToggleOnly,
    layerId,
    caption
  );
  return <></>;
};

const LayerZoomVisibleSnackbarProvider = ({
  children,
  layerState,
  options,
  layers,
}) => {
  // const mapZoom = useMapZoom();
  // const { addToSnackbar, removeFromSnackbar } = useSnackbar();
  // Object.values(layerState).map((l) => console.log(l.caption));

  return (
    <>
      {layers.map((l) => (
        <LayerZoomListener key={l.get("name")} layer={l} />
      ))}
      {children}
    </>
  );
};

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

const buildLayerTree = (groups, olLayerMap) =>
  groups?.map((group) => {
    if (!group) {
      return undefined;
    }
    const layers = buildLayerTree(group.layers, olLayerMap);
    const subgroups = buildLayerTree(group.groups, olLayerMap);

    const children = [...(layers ?? []), ...(subgroups ?? [])];

    return {
      id: group.id,
      // name: olLayerMap[group.id]?.get("caption") ?? group.name,
      children: children?.length === 0 ? undefined : children,
    };
  });

const LayerSwitcherProvider = ({
  app,
  map,
  localObserver,
  globalObserver,
  options,
  windowVisible,
}) => {
  // const olLayerMap = map
  //   .getLayers()
  //   .getArray()
  //   .reduce((a, b) => {
  //     a[b.get("name")] = b;
  //     return a;
  //   }, {});
  // const layerTreeData = buildLayerTree(options.groups, olLayerMap);

  const olState = useSyncExternalStore(
    (callback) => {
      const fn = (_) => (_) => {
        callback();
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
    },
    (() => {
      let cache = null;
      return () => {
        const olLayers = map
          .getLayers()
          .getArray()
          .reduce((a, l) => {
            a[l.get("name")] = {
              // opacity: l.get("opacity"),
              id: l.get("name"),
              caption: l.get("caption"),
              visible: l.get("visible"),
              quickAccess: l.get("quickAccess"),
              // subLayers: l.get("subLayers"),
              // zIndex: l.get("zIndex"),
            };
            return a;
          }, {});

        if (JSON.stringify(olLayers) !== JSON.stringify(cache)) {
          cache = olLayers;
          return olLayers;
        }
        return cache;
      };
    })()
  );
  // console.log(olState);

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
      <MapZoomProvider map={map}>
        <LayerZoomVisibleSnackbarProvider
          layerState={olState}
          options={options}
          layers={map.getAllLayers()}
        >
          <LayerSwitcherView
            app={app}
            map={map}
            localObserver={localObserver}
            globalObserver={globalObserver}
            options={options}
            windowVisible={windowVisible}
            layersState={olState}
          />
        </LayerZoomVisibleSnackbarProvider>
      </MapZoomProvider>
    </LayerSwitcherDispatchContext.Provider>
  );
};

export default LayerSwitcherProvider;
