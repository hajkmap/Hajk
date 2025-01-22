import React, {
  useEffect,
  createContext,
  useContext,
  useRef,
  useState,
  useMemo,
} from "react";

import { Vector as VectorLayer } from "ol/layer";
import LayerSwitcherView from "./LayerSwitcherView.js";
import { useLayerZoomWarningSnackbar } from "./useLayerZoomWarningSnackbar";

const getOlLayerState = (l) => ({
  opacity: l.get("opacity"),
  id: l.get("name"),
  layerId: l.get("name"),
  layerCaption: l.get("caption"),
  caption: l.get("caption"),
  layerIsToggled: l.get("visible"),
  visible: l.get("visible"),
  quickAccess: l.get("quickAccess"),
  visibleSubLayers: l.get("visible") ? l.get("subLayers") : [],
  wmsLoadError: l.get("wmsLoadStatus") ?? undefined,
  zIndex: l.get("zIndex"),
  // "filterAttribute"
  // "filterComparer"
  // "filterValue"
});

// Provide the current map zoom as a hook.
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

// This is a hack to listen on all layers with zoom check
// This could be moved to the core code or another plugin. It's not really the
// responsibility of the LayerSwitcher
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

const LayerZoomVisibleSnackbarProvider = ({ children, layers }) => {
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

const QUICK_ACCESS_KEY = "quickAccess";

const createDispatch = (map, staticLayerConfig, staticLayerTree) => {
  const olBackgroundLayers = map
    .getLayers()
    .getArray()
    .filter((l) => l.get("layerType") === "base");

  return {
    setLayerVisibility(layerId, visible) {
      const olLayer = map.getAllLayers().find((l) => l.get("name") === layerId);
      olLayer.setVisible(visible);

      // VectorLayers have no sublayers.
      if (!(olLayer instanceof VectorLayer)) {
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
      }
    },
    setSubLayerVisibility(layerId, subLayerId, visible) {
      const olLayer = map.getAllLayers().find((l) => l.get("name") === layerId);

      let currentSubLayers;
      if (olLayer.get("visible")) {
        currentSubLayers = new Set(olLayer.get("subLayers"));
      } else {
        currentSubLayers = new Set();
      }

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
      const groupTree = getGroupConfigById(staticLayerTree, groupId);
      const allLayerIdsInGroup = getAllLayerIdsInGroup(groupTree);

      allLayerIdsInGroup.forEach((id) => {
        const olLayer = map.getAllLayers().find((l) => l.get("name") === id);
        olLayer.setVisible(visible);
      });
    },
    setGroupLayerVisibility(layerId, visible) {
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
      olBackgroundLayers.forEach((l) => l?.setVisible(false));

      const layer = map.getAllLayers().find((l) => l.get("name") === layerId);
      layer?.setVisible(true);
    },
    setLayerOpacity(layerId, visible) {
      const layer = map.getAllLayers().find((l) => l.get("name") === layerId);
      layer.setVisible(visible);
    },
    setLayerQuickAccess(layerId, partOfQuickAccess) {
      const layer = map.getAllLayers().find((l) => l.get("name") === layerId);
      layer.set(QUICK_ACCESS_KEY, partOfQuickAccess);
    },
    addVisibleLayersToQuickAccess() {
      const visibleLayers = map
        .getAllLayers()
        .filter(
          (l) =>
            l.get("visible") === true &&
            l.get("layerType") !== "base" &&
            l.get("layerType") !== "system"
        );
      visibleLayers.forEach((l) => l.set(QUICK_ACCESS_KEY, true));
    },
    clearQuickAccess() {
      map
        .getAllLayers()
        .filter(
          (l) =>
            l.get("layerType") !== "base" && l.get("layerType") !== "system"
        )
        .map((l) => l.set(QUICK_ACCESS_KEY, false));
    },
    // set ZIndex
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

    const olLayer = olLayerMap[node.id];

    const isGroupLayer = olLayer?.get("layerType") === "group";

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
        layerId: node.id,
        caption: olLayerMap[node.id]?.get("caption") ?? node.name,
        layerCaption: olLayerMap[node.id]?.get("caption") ?? node.name,
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
        layerInfo: olLayer?.get("layerInfo"),
        layerLegendIcon: olLayer?.get("legendIcon"),
        numberOfSubLayers: node.subLayers?.length,
        layerIsFakeMapLayer: false,
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
      groupIsToggable: group.toggled,
      defaultExpanded: group.expanded,
      parent: group.parent,
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

  const staticLayerConfigMap = useMemo(
    () => buildStaticLayerConfigMap(options.groups, olLayerMap.current),
    [options]
  );

  // Another solution would be to use Reacts `useSyncExternalStore` hook. This
  // combination of useState and useEffect has the same result but gives us the
  // possibility to only change the specific layer-specific state object that
  // actually changes. All the other object are still the same refernce. That
  // means that only the specific LayerItem and releated components that
  // changes re-render. With `useSyncExternalStore` everything would re-render.
  const [olState, setOlState] = useState(
    map
      .getLayers()
      .getArray()
      .reduce((a, l) => {
        a[l.get("name")] = getOlLayerState(l);
        return a;
      }, {})
  );

  useEffect(() => {
    const fn = (l) => (_) => {
      const changedLayer = l;
      const layerState = getOlLayerState(changedLayer);
      setOlState((s) => ({ ...s, [layerState.id]: layerState }));
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
