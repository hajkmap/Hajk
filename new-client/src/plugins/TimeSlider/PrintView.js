import React from "react";
import { Button, Grid, Typography } from "@mui/material";

export default function PrintView(props) {
  const numSteps = Math.floor(
    (props.endTime - props.startTime) / props.stepSize
  );

  const message = `Vid utskrift så kommer en bild skapas för varje "steg" i tidslinjen. Nuvarande inställningar kommer resultera i ${numSteps} bilder.`;

  return (
    <Grid
      container
      justifyContent="center"
      sx={{ width: "100%", height: "100%" }}
    >
      <Grid item xs={12}>
        <Typography align="center">{message}</Typography>
      </Grid>
      <Grid
        container
        item
        xs={12}
        justifyContent="center"
        alignContent="center"
      >
        <Button variant="contained">Skriv ut</Button>
      </Grid>
    </Grid>
  );
}
