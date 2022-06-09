// Base
import React, { useMemo } from "react";
import { Chip, Grid } from "@mui/material";

// Constants
import { HUB_CONNECTION_STATUS } from "./constants";

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
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            maxWidth: "100%",
          }}
        >
          {JSON.stringify(props)}
        </pre>
      </Grid>
    </Grid>
  );
}

export default VisionIntegrationView;
