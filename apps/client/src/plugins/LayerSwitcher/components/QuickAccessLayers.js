import React, { useCallback, useEffect, useState } from "react";

import LayerItem from "./LayerItem";
import BackgroundLayer from "./BackgroundLayer";
import GroupLayer from "./GroupLayer";
import { Box } from "@mui/material";

export default function QuickAccessLayers({
  app,
  map,
  localObserver,
  filterValue,
  treeData,
}) {
  // State that contains the layers that are currently visible
  const [quickAccessLayers, setQuickAccessLayers] = useState([]);
  const [, setForceState] = useState(false);

  // Function that forces a rerender of the component
  const forceUpdate = () => setForceState((prevState) => !prevState);

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
    const layers = map.getAllLayers().filter((l) => {
      return l.get("quickAccess") === true;
    });
    if (filterValue === "") {
      return layers;
    } else {
      // If filter is applied, only show layers that match the filter
      return layers.filter((l) => {
        return l
          .get("caption")
          .toLocaleLowerCase()
          .includes(filterValue.toLocaleLowerCase());
      });
    }
  }, [map, filterValue]);

  // On component mount, update the list and subscribe to events
  useEffect(() => {
    // Register a listener: when any layer's quickaccess flag changes make sure
    // to update the list.
    const quickAccessChangedSubscription = app.globalObserver.subscribe(
      "core.layerQuickAccessChanged",
      (l) => {
        if (l.target.get("quickAccess") === true) {
          // We force update when a layer changed visibility to
          // be able to sync togglebuttons in GUI
          l.target.on("change:visible", forceUpdate);
        } else {
          // Remove listener when layer is removed from quickaccess
          l.target.un("change:visible", forceUpdate);
        }
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
            observer={localObserver}
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
