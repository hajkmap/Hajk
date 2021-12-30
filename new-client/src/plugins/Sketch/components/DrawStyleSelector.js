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

  // The style settings for area-drawings!
  // TODO: Opacity-style settings and stroke-width-settings!
  const renderFillStyleSettings = () => {
    return (
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
    );
  };

  // The style settings for text-drawings!
  // TODO: color-handlers and font-size-settings!
  const renderTextStyleSettings = () => {
    return (
      <Grid container>
        <Grid item xs={12}>
          <ColorPickerAccordion
            title="Färg"
            color={props.drawColor.fill}
            handleColorChange={handleFillColorChange}
          />
        </Grid>
        <Grid item xs={12}>
          <ColorPickerAccordion
            title="Bakgrundsfärg"
            color={props.drawColor.stroke}
            handleColorChange={handleStrokeColorChange}
          />
        </Grid>
      </Grid>
    );
  };

  // The style settings for line-drawings!
  // Why are we grid-ing these? Cause we're gonna be implementing more settings.
  // TODO: Stroke-width-settings!
  const renderLineStyleSettings = () => {
    return (
      <Grid container>
        <Grid item xs={12}>
          <ColorPickerAccordion
            title="Färg"
            color={props.drawColor.stroke}
            handleColorChange={handleStrokeColorChange}
          />
        </Grid>
      </Grid>
    );
  };

  // We want to display different settings depending on what the user is drawing!
  // Let's check and render the appropriate settings.
  const renderStyleSettings = () => {
    switch (props.activeDrawType) {
      case "Line":
        return renderLineStyleSettings();
      case "Text":
        return renderTextStyleSettings();
      default:
        return renderFillStyleSettings();
    }
  };

  return renderStyleSettings();
}
