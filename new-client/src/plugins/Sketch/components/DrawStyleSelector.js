import React from "react";
import { Grid, Typography, Paper } from "@material-ui/core";
import { CirclePicker, SliderPicker } from "react-color";

const DrawStyleSelector = (props) => {
  const renderLineColorSelector = () => {
    return (
      <Paper style={{ padding: 8, marginBottom: 16 }}>
        <Grid item xs={12}>
          <Typography variant="caption">Linjefärg</Typography>
        </Grid>
        <Grid item xs={12}>
          <CirclePicker
            color={props.drawColor.stroke}
            onChangeComplete={(e) =>
              props.setDrawColor({ ...props.drawColor, stroke: e.hex })
            }
          />
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
          <SliderPicker color={props.drawColor.fill} />
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
