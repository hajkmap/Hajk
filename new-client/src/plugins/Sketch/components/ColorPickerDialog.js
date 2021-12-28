import React from "react";
import { Button, Dialog, Grid } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import { SketchPicker } from "react-color";

const ColorPickerDialog = (props) => {
  const handleColorChange = (e) => {
    if (props.type === "STROKE") {
      props.setDrawColor({ ...props.drawColor, stroke: e.hex });
    } else {
      props.setDrawColor({ ...props.drawColor, fill: e.hex });
    }
  };
  const color =
    props.type === "STROKE" ? props.drawColor.stroke : props.drawColor.fill;
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <Grid container justify="center">
        <Grid item xs={12} style={{ marginTop: 8, marginBottom: 8 }}>
          <Typography variant="h5" align="center">
            {props.type === "STROKE" ? "Linjefärg" : "Fyllnadsfärg"}
          </Typography>
        </Grid>
        <Grid item>
          <SketchPicker color={color} onChange={handleColorChange} />
        </Grid>
        <Grid container justify="flex-end">
          <Button
            variant="contained"
            onClick={props.onClose}
            style={{ margin: 8 }}
          >
            OK
          </Button>
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default ColorPickerDialog;
