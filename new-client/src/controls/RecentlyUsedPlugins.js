import * as React from "react";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";

export default function RecentlyUsedPlugins({ globalObserver }) {
  const [actions, setActions] = useState([]);
  useEffect(() => {
    globalObserver.subscribe("core.pluginHistoryChanged", (plugins) => {
      const pluginsAsActions = Array.from(plugins.entries())
        .slice(-4) // Just keep the 4 latest plugins
        .reverse() // Reverse, so we get the most recently used at the bottom of our SpeedDial
        .map(([k, v]) => {
          return {
            type: k,
            ...v,
          };
        });

      setActions(pluginsAsActions);
    });
  }, [globalObserver]);

  const handleActionClick = (type) => {
    // Each BaseWindowPlugin and DialogWindowPlugin have subscribed to
    // a unique event called {plugin}.showWindow. Upon invocation, the plugin
    // will show itself.
    const eventName = `${type}.showWindow`;
    globalObserver.publish(eventName);
  };

  return (
    // <Box sx={{ height: 320, transform: "translateZ(0px)", flexGrow: 1 }}>
    <SpeedDial
      ariaLabel="Recently used plugins quick selector"
      sx={{ position: "absolute", bottom: 54, right: 8 }}
      icon={<SpeedDialIcon />}
      hidden={actions.length === 0}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.type}
          icon={action.icon}
          tooltipTitle={action.title}
          onClick={() => handleActionClick(action.type)}
        />
      ))}
    </SpeedDial>
    // </Box>
  );
}
