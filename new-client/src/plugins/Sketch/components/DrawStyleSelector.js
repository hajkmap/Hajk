import React from "react";
import { Grid } from "@material-ui/core";

import ColorPickerAccordion from "./ColorPickerAccordion";

export default function DrawStyleSelector(props) {
  // We need a handler that can update the stroke color
  const handleStrokeColorChange = (e) => {
    props.setDrawColor({ ...props.drawColor, stroke: e.hex });
  };
  // We need a handler that can update the fill color
  const handleFillColorChange = (e) => {
    props.setDrawColor({ ...props.drawColor, fill: e.hex });
  };

  // If we're drawing an area, we need to provide the possibility to change
  // the fill color and opacity, but if we're not it's enough if we provide
  // the possibility to change the line-style.
  const drawTypeIncludesFill = props.activeDrawType !== "Line";

  return drawTypeIncludesFill ? (
    <Grid container>
      <Grid item xs={12}>
        <ColorPickerAccordion
          title="Fyllnadsfärg"
          color={props.drawColor.fill}
          handleColorChange={handleFillColorChange}
        />
      </Grid>
      <Grid item xs={12}>
        <ColorPickerAccordion
          title="Linjefärg"
          color={props.drawColor.stroke}
          handleColorChange={handleStrokeColorChange}
        />
      </Grid>
    </Grid>
  ) : (
    <ColorPickerAccordion
      title="Färg"
      color={props.drawColor.stroke}
      handleColorChange={handleStrokeColorChange}
    />
  );
}
