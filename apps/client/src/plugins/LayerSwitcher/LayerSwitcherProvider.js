import React, {
  useEffect,
  createContext,
  useContext,
  useRef,
  useSyncExternalStore,
  useState,
  useMemo,
} from "react";

import LayerSwitcherView from "./LayerSwitcherView.js";
// import useSnackbar from "../../hooks/useSnackbar";
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

const setOLSubLayers = (olLayer, visibleSubLayersArray) => {
  if (visibleSubLayersArray.length === 0) {
    // Fix underlying source
    olLayer.getSource().updateParams({
      // Ensure that the list of sublayers is emptied (otherwise they'd be
      // "remembered" the next time user toggles group)
      LAYERS: "",
      // Remove any filters
      CQL_FILTER: null,
    });

    // Hide the layer in OL
    olLayer.setVisible(false);
  } else {
    olLayer.setVisible(true);
    // Set LAYERS and STYLES so that the exact sublayers that are needed
    // will be visible
    olLayer.getSource().updateParams({
      // join(), so we always provide a string as value to LAYERS
      LAYERS: visibleSubLayersArray.join(),
      // Filter STYLES to only contain styles for currently visible layers,
      // and maintain the order from layersInfo (it's crucial that the order
      // of STYLES corresponds exactly to the order of LAYERS!)
      STYLES: Object.entries(olLayer.layersInfo)
        .filter((k) => visibleSubLayersArray.indexOf(k[0]) !== -1)
        .map((l) => l[1].style)
        .join(","),
      CQL_FILTER: null,
    });
  }
};

// TODO move to common. Copied from LayerGroup.js
const getAllLayerIdsInGroup = (group) => {
  if (!group) {
    return [];
  }

  if (!group.children) {
    return [group.id];
  } else {
    return group.children.flatMap((c) => {
      return getAllLayerIdsInGroup(c);
    });
  }
};

const getGroupConfigById = (tree, groupId) => {
  if (!tree) {
    return null;
  }
  if (Array.isArray(tree)) {
    const parent = tree.find((c) => getGroupConfigById(c, groupId));
    if (parent) {
      return getGroupConfigById(parent, groupId);
    }
  }
  if (tree.id === groupId) {
    return tree;
  }

  if (tree.children) {
    const parent = tree.children.find((c) => getGroupConfigById(c, groupId));
    if (parent) {
      return getGroupConfigById(parent, groupId);
    }
  } else {
    return null;
  }
};

// TODO Set up OSM/black/white here?

const createDispatch = (map, staticLayerConfig, staticLayerTree) => {
  const olBackgroundLayers = map
    .getLayers()
    .getArray()
    .filter((l) => l.get("layerType") === "base");

  return {
    setLayerVisibility(layerId, visible) {
      console.log("LS Dispatcher:", "setLayerVisibility", layerId, visible);
      const olLayer = map.getAllLayers().find((l) => l.get("name") === layerId);
      olLayer.setVisible(visible);

      if (visible) {
        // For GroupLayers:
        const allSubLayers = staticLayerConfig[layerId]?.allSubLayers;
        if (allSubLayers) {
          olLayer.set("subLayers", allSubLayers);
          setOLSubLayers(olLayer, allSubLayers);
        }
      } else {
        olLayer.set("subLayers", []);
        setOLSubLayers(olLayer, []);
      }
    },
    setSubLayerVisibility(layerId, subLayerId, visible) {
      console.log(
        "LS Dispatcher:",
        "setSubLayerVisibility",
        layerId,
        subLayerId,
        visible
      );
      const olLayer = map.getAllLayers().find((l) => l.get("name") === layerId);
      const currentSubLayers = new Set(olLayer.get("subLayers"));

      if (visible) {
        currentSubLayers.add(subLayerId);
      } else {
        currentSubLayers.delete(subLayerId);
      }

      const currentSubLayersArray = Array.from(currentSubLayers);
      olLayer.set("subLayers", currentSubLayersArray);
      setOLSubLayers(olLayer, currentSubLayersArray);
    },
    setGroupVisibility(groupId, visible) {
      console.log("LS Dispatcher:", "setGroupVisibility", groupId, visible);

      const groupTree = getGroupConfigById(staticLayerTree, groupId);
      const allLayerIdsInGroup = getAllLayerIdsInGroup(groupTree);

      allLayerIdsInGroup.forEach((id) => {
        const olLayer = map.getAllLayers().find((l) => l.get("name") === id);
        olLayer.setVisible(visible);
      });
    },
    setGroupLayerVisibility(layerId, visible) {
      console.log("LS Dispatcher:", "setGroupLayerVisibility", layerId);
      const olLayer = map.getAllLayers().find((l) => l.get("name") === layerId);
      const allSubLayers = new Set(olLayer.get("subLayers"));

      if (visible) {
        olLayer.set("subLayers", allSubLayers);
        setOLSubLayers(olLayer, allSubLayers);
      } else {
        olLayer.set("subLayers", []);
        setOLSubLayers(olLayer, []);
      }
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

const getLayerNodes = (groups, olLayerMap) =>
  groups?.flatMap((node) => {
    if (!node) {
      return undefined;
    }
    const layers = getLayerNodes(node.layers, olLayerMap);
    const subgroups = getLayerNodes(node.groups, olLayerMap);

    const children = [...(layers ?? []), ...(subgroups ?? [])];

    // A group should have both defined
    const isGroup = !!(node.groups && node.layers);

    // TODO refactor/cleanup
    const olLayer = olLayerMap[node.id];
    const isGroupLayer = olLayer?.get("subLayers");

    let layerType = node.layerType;
    if (isGroupLayer) {
      layerType = "groupLayer";
    }
    if (isGroup) {
      layerType = "group";
    }

    return [
      {
        id: node.id,
        name: olLayerMap[node.id]?.get("caption") ?? node.name,
        allSubLayers: olLayerMap[node.id]?.get("subLayers"),
        initiallyExpanded: node.expanded,
        initiallyToggled: node.toggled,
        initialDrawOrder: node.drawOrder,
        infobox: node.infobox,
        isGroup,
        layerType,
        visibleAtStart: node.visibleAtStart,
        visibleForGroups: node.visibleForGroups,
        layerMinZoom: olLayer?.get("minZoom"),
        layerMaxZoom: olLayer?.get("maxZoom"),
        layerInfo: node.layerInfo,
        layerLegendIcon: olLayer?.get("legendIcon"),
        infogroupvisible: node.infogroupvisible,
        infogrouptitle: node.infogrouptitle,
        infogrouptext: node.infogrouptext,
        infogroupurl: node.infogroupurl,
        infogroupurltext: node.infogroupurltext,
        infogroupopendatalink: node.infogroupopendatalink,
        infogroupowner: node.infofnodeowner,
      },
      ...(children?.length === 0 ? [] : children),
    ];
  });

const buildStaticLayerConfigMap = (groups, olLayerMap) => {
  const nodes = getLayerNodes(groups, olLayerMap);

  return nodes?.reduce((a, b) => {
    a[b.id] = b;
    return a;
  }, {});
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
      name: olLayerMap[group.id]?.get("caption") ?? group.name,
      subLayers: olLayerMap[group.id]?.get("subLayers"),
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
  const olLayerMap = useRef(
    map
      .getLayers()
      .getArray()
      .reduce((a, b) => {
        a[b.get("name")] = b;
        return a;
      }, {})
  );

  const layerTreeData = useMemo(
    () => buildLayerTree(options.groups, olLayerMap.current),
    [options]
  );
  // useEffect(() => console.log(layerTreeData), [layerTreeData]);

  const staticLayerConfigMap = useMemo(
    () => buildStaticLayerConfigMap(options.groups, olLayerMap.current),
    [options]
  );
  // useEffect(() => console.log(staticLayerConfigMap), [staticLayerConfigMap]);

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
              visibleSubLayers: l.get("subLayers"),
              // zIndex: l.get("zIndex"),
              // "filterAttribute"
              // "filterComparer"
              // "filterValue"
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

  const dispatcher = useRef(
    createDispatch(map, staticLayerConfigMap, layerTreeData)
  );

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
            staticLayerTree={layerTreeData}
            staticLayerConfig={staticLayerConfigMap}
          />
        </LayerZoomVisibleSnackbarProvider>
      </MapZoomProvider>
    </LayerSwitcherDispatchContext.Provider>
  );
};

export default LayerSwitcherProvider;
