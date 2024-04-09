import React from "react";
import { Badge, Button } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HajkToolTip from "../../../components/HajkToolTip";

export default function SettingsButton({ layerStatus, open, setOpen }) {
  return (
    <HajkToolTip title="Inställningar">
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
    </HajkToolTip>
  );
}
