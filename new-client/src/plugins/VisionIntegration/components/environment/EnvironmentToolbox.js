// Base
import React, { useState, useEffect } from "react";
import { Divider, Stack, Grid, Paper, Switch, Typography } from "@mui/material";

import AppModel from "models/AppModel";
import { MAP_INTERACTIONS } from "../../constants";

function EnvironmentToolbox(props) {
  // Let's make sure to warn if no layer is supplied...
  if (!props.objectInfo.wmsId) {
    console.warn(
      "No layer-id supplied to environment-toolbox... Check configuration."
    );
  }

  // We're gonna need a state to keep track of the current layer
  const [layer, setLayer] = useState(() =>
    props.model.getLayerFromId(props.objectInfo.wmsId)
  );
  // We're gonna need a state to keep track of the layer-switch
  const [layerVisible, setLayerVisible] = useState(() => layer?.get("visible"));

  useEffect(() => {
    const l = props.model.getLayerFromId(props.objectInfo.wmsId);
    setLayer(l);
    setLayerVisible(l?.get("visible"));
  }, [props.model, props.objectInfo.wmsId]);

  // An effect making sure to toggle the switch when the layer-visibility changes
  useEffect(() => {
    // The globalObserver will emit events when layer visibility changes.
    // (The layer might be toggled from the layerSwitcher for example).
    // We need to catch those and update the view accordingly.
    const layerVisibilityChangeListener = AppModel.globalObserver.subscribe(
      "core.layerVisibilityChanged",
      (e) => {
        // The observer will emit an event with the changed layer as target.
        const clickedLayer = e.target;
        // If the clicked layer is tha same as the layer from props, we can update the view.
        if (clickedLayer && clickedLayer.get("name") === layer?.get("name")) {
          setLayerVisible(layer.get("visible"));
        }
      }
    );
    // Remove listener on unmount
    return () => layerVisibilityChangeListener.unsubscribe();
  }, [layer]);

  // Handles when select-coordinates-switch is toggled
  const handleSelectEnvironmentsSwitchChange = (e) => {
    props.setActiveMapInteraction(
      e.target.checked ? MAP_INTERACTIONS.SELECT_ENVIRONMENT : null
    );
  };

  // Handles when layer-visibility-switch is toggled
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
            <Switch
              onChange={handleSelectEnvironmentsSwitchChange}
              checked={
                props.activeMapInteraction ===
                MAP_INTERACTIONS.SELECT_ENVIRONMENT
              }
            />
          </Stack>
        </Grid>
        <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
        <Grid item xs={5} justifyContent="center">
          <Stack alignItems="center" justifyContent="center">
            <Typography variant="body2" sx={{ marginTop: 1 }}>
              {props.objectInfo.layerText}
            </Typography>
            <Switch
              checked={layerVisible}
              disabled={!layer}
              onChange={handleWmsVisibilitySwitchChange}
            />
          </Stack>
        </Grid>
      </Paper>
    </Grid>
  );
}

export default EnvironmentToolbox;
