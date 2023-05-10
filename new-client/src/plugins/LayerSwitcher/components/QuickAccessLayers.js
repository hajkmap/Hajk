import React, { useCallback, useEffect, useState } from "react";

import LayerItem from "./LayerItem";
import BackgroundLayer from "./BackgroundLayer";
import GroupLayer from "./GroupLayer";

export default function QuickAccessLayers({ app, map, model, options }) {
  // State that contains the layers that are currently visible
  const [quickAccessLayers, setQuickAccessLayers] = useState([]);
  // A helper that grabs all OL layers with state quickAccess
  const getQuickAccessLayers = useCallback(() => {
    // Get all quickaccess layers
    return map.getAllLayers().filter((l) => {
      return l.get("quickAccess") === true;
    });
  }, [map]);

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
    <>
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
            options={options}
            draggable={false}
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
    </>
  );
}