import React from "react";
import { Grid, Slider, Typography } from "@mui/material";

export default function RangeSlider(props) {
  return (
    <Grid item xs={12}>
      <Grid item xs={12}>
        <Typography align="center">{props.title}</Typography>
      </Grid>
      <Grid item xs={12} sx={{ pl: 6, pr: 6 }}>
        <Slider
          size="small"
          getAriaLabel={props.getAriaLabel}
          value={props.value}
          onChange={props.onChange}
          valueLabelDisplay="auto"
          valueLabelFormat={props.valueLabelFormat}
          min={props.min}
          max={props.max}
          step={props.step}
          marks={props.marks}
        />
      </Grid>
    </Grid>
  );
}
