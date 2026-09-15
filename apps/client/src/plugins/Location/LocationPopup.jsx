import React, { useState, forwardRef } from "react";
import { Paper, Switch } from "@mui/material";
import { isMobile } from "../../utils/IsMobile";

const LocationPopup = forwardRef(function LocationPopup({ model }, ref) {
  const [localFollow, setLocalFollow] = useState(false);
  const [localAutoRotate, setLocalAutoRotate] = useState(false);

  const handleToggle = () => {
    // Return if model is missing from props.
    if (!model) return;

    // Invert and set our current follow state
    setLocalFollow(!localFollow);

    // And update the follow in the model
    !localFollow ? model.enableFollow() : model.disableFollow();
  };

  const handleAutoRotateToggle = () => {
    // Return if model is missing from props.
    if (!model) return;

    // Invert and set our current auto-rotate state
    setLocalAutoRotate(!localAutoRotate);

    // And update auto-rotate in the model
    !localAutoRotate ? model.enableAutoRotate() : model.disableAutoRotate();
  };

  return (
    <Paper
      ref={ref}
      elevation={6}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: 2,
        py: 1,
        bgcolor: "background.paper",
        color: "text.primary",
        mb: isMobile ? 4 : 0,
      }}
    >
      <span>Följ position</span>
      <Switch
        checked={localFollow}
        onChange={handleToggle}
        value="follow"
        color="primary"
      />
      <span>Rotera automatiskt</span>
      <Switch
        checked={localAutoRotate}
        onChange={handleAutoRotateToggle}
        value="autoRotate"
        color="primary"
      />
    </Paper>
  );
});

export default LocationPopup;
