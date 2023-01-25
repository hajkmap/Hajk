import React, { useState } from "react";
import { Grid, Slider, Typography } from "@mui/material";

function FloodSimulatorView() {
  const [floodLevel, setFloodLevel] = useState(0);
  return (
    <>
      <Grid container spacing={2} padding={2}>
        <Grid item xs={12}>
          <Typography>Havsnivå +{floodLevel} meter</Typography>
        </Grid>
        <Grid item xs={12}>
          <Slider
            value={floodLevel}
            aria-label="Sea level"
            valueLabelDisplay="off"
            onChange={(e, newValue) => {
              setFloodLevel(newValue);
            }}
          />
        </Grid>
      </Grid>
    </>
  );
}

export default FloodSimulatorView;
