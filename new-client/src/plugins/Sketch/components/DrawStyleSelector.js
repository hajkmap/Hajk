import React from "react";
import { Grid, Typography, Paper } from "@material-ui/core";
import { SliderPicker } from "react-color";

const DrawStyleSelector = () => {
  const renderLineColorSelector = () => {
    return (
      <Paper style={{ padding: 8, marginBottom: 16 }}>
        <Grid item xs={12}>
          <Typography variant="caption">Linjefärg</Typography>
        </Grid>
        <Grid item xs={12}>
          <SliderPicker />
        </Grid>
      </Paper>
    );
  };

  const renderFillColorSelector = () => {
    return (
      <Paper style={{ padding: 8 }}>
        <Grid item xs={12}>
          <Typography variant="caption">Fyllnadsfärg</Typography>
        </Grid>
        <Grid item xs={12}>
          <SliderPicker />
        </Grid>
      </Paper>
    );
  };

  return (
    <Grid item xs={12}>
      {renderLineColorSelector()}
      {renderFillColorSelector()}
    </Grid>
  );
};

export default DrawStyleSelector;
