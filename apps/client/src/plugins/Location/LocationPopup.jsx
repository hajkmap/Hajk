import React, { useState, forwardRef } from "react";
import { Paper, Switch } from "@mui/material";

const LocationPopup = forwardRef(function LocationPopup({ model }, ref) {
  const [localFollow, setLocalFollow] = useState(false);

  const handleToggle = () => {
    // Return if model is missing from props.
    if (!model) return;

    // Invert and set our current follow state
    setLocalFollow(!localFollow);

    // And update the follow in the model
    !localFollow ? model.enableFollow() : model.disableFollow();
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
        mb: 4,
      }}
    >
      <span>Följ position</span>
      <Switch
        checked={localFollow}
        onChange={handleToggle}
        value="follow"
        color="primary"
      />
    </Paper>
  );
});

export default LocationPopup;
