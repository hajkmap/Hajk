// Base
import React, { useEffect, useState } from "react";
import { Divider, Stack, Grid, Paper, Switch, Typography } from "@mui/material";

function EstateToolbox({ layer }) {
  // Let's make sure to warn if no layer is supplied...
  if (!layer) {
    console.warn("No layer supplied to Estate-toolbox... Check configuration.");
  }
  // We're gonna need a state to keep track of the switch
  const [layerVisible, setLayerVisible] = useState(layer?.get("visible"));

  // An effect making sure to toggle the switch when the layer-visibility changes
  useEffect(() => {
    // Handler for the visibility change
    const handleLayerVisibilityChange = (e) => {
      setLayerVisible(layer?.get("visible"));
    };
    // Set  up the listener on mount
    layer?.on("change:visible", handleLayerVisibilityChange);
    // Remove listener on unmount
    return () => layer?.un("change:visible", handleLayerVisibilityChange);
  }, [layer]);

  // Handles when switch is toggled
  const handleWmsVisibilitySwitchChange = (e) => {
    layer.set("visible", e.target.checked);
  };

  return (
    <Grid container item xs={12} justifyContent="center" alignContent="center">
      <Paper
        sx={{
          width: "100%",
          marginLeft: 1,
          marginRight: 1,
          display: "flex",
          border: (theme) => `1px solid ${theme.palette.divider}`,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <Grid item xs={5} justifyContent="center">
          <Stack alignItems="center" justifyContent="center">
            <Typography variant="body2" sx={{ marginTop: 1 }}>
              Selektering
            </Typography>
            <Switch />
          </Stack>
        </Grid>
        <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
        <Grid item xs={5} justifyContent="center">
          <Stack alignItems="center" justifyContent="center">
            <Typography variant="body2" sx={{ marginTop: 1 }}>
              Fastighetslager
            </Typography>
            <Switch
              checked={layerVisible}
              onChange={handleWmsVisibilitySwitchChange}
            />
          </Stack>
        </Grid>
      </Paper>
    </Grid>
  );
}

export default EstateToolbox;
