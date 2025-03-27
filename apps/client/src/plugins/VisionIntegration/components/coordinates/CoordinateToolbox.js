// Base
import React from "react";
import { Divider, Stack, Grid, Paper, Switch, Typography } from "@mui/material";
import { MAP_INTERACTIONS } from "../../constants";

function CoordinateToolbox(props) {
  // Handles when select-coordinates-switch is toggled
  const handleSelectCoordinatesSwitchChange = (e) => {
    props.setActiveMapInteraction(
      e.target.checked ? MAP_INTERACTIONS.SELECT_COORDINATE : null
    );
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
              onChange={handleSelectCoordinatesSwitchChange}
              checked={
                props.activeMapInteraction ===
                MAP_INTERACTIONS.SELECT_COORDINATE
              }
            />
          </Stack>
        </Grid>
        <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
        <Grid item xs={5} justifyContent="center">
          <Stack alignItems="center" justifyContent="center">
            <Typography variant="body2" sx={{ marginTop: 1 }}>
              Koordinatlager
            </Typography>
            <Switch disabled />
          </Stack>
        </Grid>
      </Paper>
    </Grid>
  );
}

export default CoordinateToolbox;
