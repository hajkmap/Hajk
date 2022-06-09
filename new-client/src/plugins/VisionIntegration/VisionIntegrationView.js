// Base
import React, { useMemo } from "react";
import { Chip, Grid, Tabs, Tab } from "@mui/material";

// Constants
import { HUB_CONNECTION_STATUS, TABS } from "./constants";

function VisionIntegrationView(props) {
  // We're gonna want to display a chip with some information regarding the hub-connection-status.
  // Let's get the information every time the connection-status changes.
  const hubChipInformation = useMemo(() => {
    const label =
      props.hubConnectionStatus === HUB_CONNECTION_STATUS.LOADING
        ? "Upprättar koppling mot Vision"
        : props.hubConnectionStatus === HUB_CONNECTION_STATUS.SUCCESS
        ? "Uppkopplad mot Vision"
        : "Uppkoppling mot Vision misslyckad";
    const color =
      props.hubConnectionStatus === HUB_CONNECTION_STATUS.LOADING
        ? "warning"
        : props.hubConnectionStatus === HUB_CONNECTION_STATUS.SUCCESS
        ? "success"
        : "error";

    return { label, color };
  }, [props.hubConnectionStatus]);

  return (
    <Grid container>
      <Grid item container justifyContent="center">
        <Chip
          color={hubChipInformation.color}
          size="small"
          label={hubChipInformation.label}
        />
      </Grid>
      <Grid item container justifyContent="center">
        <Tabs sx={{ width: "100%" }} value={props.activeTab}>
          {TABS.map((tab) => {
            return (
              <Tab
                key={tab.id}
                value={tab.id}
                sx={{ width: `${100 / TABS.length}%` }}
                disabled={tab.disabled}
                icon={tab.icon}
                label={tab.label}
                onClick={() => props.setActiveTab(tab.id)}
              />
            );
          })}
        </Tabs>
      </Grid>
    </Grid>
  );
}

export default VisionIntegrationView;
