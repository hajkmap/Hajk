// Base
import React, { useMemo } from "react";
import { Chip } from "@mui/material";
import { HUB_CONNECTION_STATUS } from "../constants";

function HubConnectionStatusChip({ hubConnectionStatus }) {
  // We're gonna want to display a chip with some information regarding the hub-connection-status.
  // Let's get the information every time the connection-status changes.
  const hubChipInformation = useMemo(() => {
    const label =
      hubConnectionStatus === HUB_CONNECTION_STATUS.LOADING
        ? "Upprättar koppling mot Vision"
        : hubConnectionStatus === HUB_CONNECTION_STATUS.SUCCESS
        ? "Uppkopplad mot Vision"
        : "Uppkoppling mot Vision misslyckad";
    const color =
      hubConnectionStatus === HUB_CONNECTION_STATUS.LOADING
        ? "warning"
        : hubConnectionStatus === HUB_CONNECTION_STATUS.SUCCESS
        ? "success"
        : "error";

    return { label, color };
  }, [hubConnectionStatus]);

  return (
    <Chip
      color={hubChipInformation.color}
      size="small"
      label={hubChipInformation.label}
    />
  );
}

export default HubConnectionStatusChip;
