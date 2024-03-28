import React from "react";
import { Badge, Button, Tooltip } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

export default function SettingsButton({ layerStatus, open, setOpen }) {
  return (
    <Tooltip disableInteractive title="Inställningar">
      <Badge
        color="error"
        invisible={!layerStatus.error}
        badgeContent={`${
          layerStatus.faultyLayers.length > 0
            ? layerStatus.faultyLayers.length
            : 1
        }`}
      >
        <Button
          variant="contained"
          onClick={() => {
            setOpen(!open);
          }}
        >
          <SettingsOutlinedIcon />
        </Button>
      </Badge>
    </Tooltip>
  );
}
