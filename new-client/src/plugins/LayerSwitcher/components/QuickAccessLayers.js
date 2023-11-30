import React, { useCallback, useEffect, useState } from "react";

import LayerItem from "./LayerItem";
import BackgroundLayer from "./BackgroundLayer";
import GroupLayer from "./GroupLayer";
import { Box } from "@mui/material";

export default function QuickAccessLayers({
  app,
  map,
  model,
  filterValue,
  treeData,
}) {
  // State that contains the layers that are currently visible
  const [quickAccessLayers, setQuickAccessLayers] = useState([]);

  // Function that finds a layer by id in the treeData
  const findLayerById = useCallback((groups, targetId) => {
    for (const group of groups) {
      for (const layer of group.layers) {
        if (layer.id === targetId) {
          return layer;
        }
      }
      if (group.groups) {
        const foundLayerInGroup = findLayerById(group.groups, targetId);
        if (foundLayerInGroup) {
          return foundLayerInGroup;
        }
      }
    }
    return null;
  }, []);

  // A helper that grabs all OL layers with state quickAccess
  const getQuickAccessLayers = useCallback(() => {
    // Get all quickaccess layers
    return map.getAllLayers().filter((l) => {
      if (filterValue === "") {
        return l.get("quickAccess") === true;
      } else {
        // If filter is applied, make sure that the quickaccess layer is also visible in the tree
        const layerInTree = findLayerById(treeData, l.get("name"));
        return layerInTree?.isFiltered && l.get("quickAccess") === true;
      }
    });
  }, [map, filterValue, treeData, findLayerById]);

  // On component mount, update the list and subscribe to events
  useEffect(() => {
    // Register a listener: when any layer's quickaccess flag changes make sure
    // to update the list.
    const quickAccessChangedSubscription = app.globalObserver.subscribe(
      "core.layerQuickAccessChanged",
      (l) => {
        setQuickAccessLayers(getQuickAccessLayers());
      }
    );
    // Update list of layers
    setQuickAccessLayers(getQuickAccessLayers());
    // Unsubscribe when component unmounts
    return function () {
      quickAccessChangedSubscription.unsubscribe();
    };
  }, [app.globalObserver, getQuickAccessLayers]);

  return (
    <Box
      sx={{
        ".layer-item:last-child .MuiBox-root": {
          borderBottom: "none",
        },
        ".layer-item": {
          marginLeft: "26px !important",
        },
        borderTop: (theme) =>
          quickAccessLayers.length > 0
            ? `${theme.spacing(0.2)} solid ${theme.palette.divider}`
            : "none",
      }}
    >
      {quickAccessLayers.map((l) => {
        return l.get("layerType") === "base" ? (
          <BackgroundLayer
            key={l.isFakeMapLayer ? l.get("caption") : l.ol_uid}
            layer={l}
            app={app}
            draggable={false}
            toggleable={true}
          ></BackgroundLayer>
        ) : l.get("layerType") === "group" ? (
          <GroupLayer
            key={l.ol_uid}
            layer={l}
            app={app}
            observer={model.observer}
            toggleable={true}
            draggable={false}
            groupLayer={findLayerById(treeData, l.get("name"))}
            quickAccessLayer={true}
          ></GroupLayer>
        ) : (
          <LayerItem
            key={l.ol_uid}
            layer={l}
            draggable={false}
            toggleable={true}
            app={app}
          />
        );
      })}
    </Box>
  );
}
