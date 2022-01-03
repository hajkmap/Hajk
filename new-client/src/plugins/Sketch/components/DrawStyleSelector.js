import React from "react";
import { Grid } from "@material-ui/core";

import DrawStyleAccordion from "./DrawStyleAccordion";

export default function DrawStyleSelector(props) {
  // We need a handler that can update the stroke color
  const handleStrokeColorChange = (e) => {
    props.setDrawStyle({ ...props.drawStyle, stroke: e.hex });
  };
  // We need a handler that can update the fill color
  const handleFillColorChange = (e) => {
    props.setDrawStyle({ ...props.drawStyle, fill: e.hex });
  };
  // We need a handler that can update the opacity value
  const handleOpacityChange = (e, value) => {
    props.setDrawStyle({ ...props.drawStyle, opacity: value });
  };
  // We need a handler that can update the strokeWidth value
  const handleStrokeWidthChange = (e, value) => {
    props.setDrawStyle({ ...props.drawStyle, strokeWidth: value });
  };

  // The style settings for area-drawings!
  // TODO: Opacity-style settings and stroke-width-settings!
  const renderFillStyleSettings = () => {
    return (
      <Grid container>
        <Grid item xs={12}>
          <DrawStyleAccordion
            title="Fyllnad"
            showOpacitySlider
            color={props.drawStyle.fill}
            opacity={props.drawStyle.opacity}
            handleColorChange={handleFillColorChange}
            handleOpacityChange={handleOpacityChange}
          />
        </Grid>
        <Grid item xs={12}>
          <DrawStyleAccordion
            title="Linje"
            showStrokeWidthSlider
            color={props.drawStyle.stroke}
            strokeWidth={props.drawStyle.strokeWidth}
            handleColorChange={handleStrokeColorChange}
            handleStrokeWidthChange={handleStrokeWidthChange}
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
          <DrawStyleAccordion
            title="Färg"
            color={props.drawStyle.fill}
            handleColorChange={handleFillColorChange}
          />
        </Grid>
        <Grid item xs={12}>
          <DrawStyleAccordion
            title="Bakgrundsfärg"
            color={props.drawStyle.stroke}
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
          <DrawStyleAccordion
            title="Bredd och färg"
            showStrokeWidthSlider
            color={props.drawStyle.stroke}
            strokeWidth={props.drawStyle.strokeWidth}
            handleColorChange={handleStrokeColorChange}
            handleStrokeWidthChange={handleStrokeWidthChange}
          />
        </Grid>
      </Grid>
    );
  };

  // We want to display different settings depending on what the user is drawing!
  // Let's check and render the appropriate settings.
  const renderStyleSettings = () => {
    switch (props.activeDrawType) {
      case "Arrow":
      case "DashedLine":
      case "DottedLine":
      case "SolidLine":
        return renderLineStyleSettings();
      case "Text":
        return renderTextStyleSettings();
      default:
        return renderFillStyleSettings();
    }
  };

  return renderStyleSettings();
}
