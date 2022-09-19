import * as React from "react";
import { useEffect, useState } from "react";
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from "@mui/material";

import RestoreIcon from "@mui/icons-material/Restore";

export default function RecentlyUsedPlugins({
  globalObserver,
  showRecentlyUsedPlugins = false,
}) {
  // Will be populated with actions to re-open our recently opened plugins
  const [actions, setActions] = useState([]);

  // Controls the state of our SpeedDial and allows hiding it on click
  const [open, setOpen] = useState(false);

  // We want to subscribe to an event on load
  useEffect(() => {
    // This event will supply us with a well-formatted object that contains
    // a history of all plugins activated by the user during this session.
    globalObserver.subscribe("core.pluginHistoryChanged", (plugins) => {
      // When a new list of plugins arrives, we want to…
      const pluginsAsActions = Array.from(plugins.entries())
        .slice(-4) // …only keep the 4 latest plugins…
        .reverse() // …reverse, so the most recently used end up at the bottom of our SpeedDial…
        .map(([k, v]) => {
          // …and translate it all to an array that will be used in the render method.
          return {
            type: k,
            ...v,
          };
        });

      // Let the State know about it, so the component re-renders.
      setActions(pluginsAsActions);
    });
  }, [globalObserver]);

  const handleActionClick = (type) => {
    // Each BaseWindowPlugin and DialogWindowPlugin have subscribed to
    // a unique event called {plugin}.showWindow. We can use it now
    // to make the plugin show itself.
    const eventName = `${type}.showWindow`;
    globalObserver.publish(eventName);
  };

  return (
    showRecentlyUsedPlugins && (
      <SpeedDial
        ariaLabel="Recently used plugins quick selector"
        FabProps={{
          size: "small",
        }}
        hidden={actions.length === 0} // Don't show the SpeedDial if no history is available
        icon={<SpeedDialIcon icon={<RestoreIcon />} />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        sx={{ position: "absolute", bottom: 54, right: 8 }}
      >
        {actions.map((action) => (
          <SpeedDialAction
            icon={action.icon}
            key={action.type}
            onClick={() => {
              // Tell the plugin to activate itself…
              handleActionClick(action.type);
              // …and hide the SpeedDial.
              setOpen(false);
            }}
            tooltipOpen // This makes tooltips sticky - disable or make an option perhaps
            tooltipTitle={action.title}
          />
        ))}
      </SpeedDial>
    )
  );
}
