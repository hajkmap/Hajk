import React from "react";
import { Grid } from "@material-ui/core";

import DrawStyleAccordion from "./DrawStyleAccordion";

export default function DrawStyleSelector(props) {
  // We need a handler that can update the stroke color
  const handleStrokeColorChange = (e) => {
    props.setDrawStyle({ ...props.drawStyle, strokeColor: e.rgb });
  };
  // We need a handler that can update the fill color
  const handleFillColorChange = (e) => {
    props.setDrawStyle({
      ...props.drawStyle,
      fillColor: { ...e.rgb, a: props.drawStyle.fillColor.a },
    });
  };
  // We need a handler that can update the opacity value
  const handleOpacityChange = (e, value) => {
    props.setDrawStyle({
      ...props.drawStyle,
      fillColor: { ...props.drawStyle.fillColor, a: value },
    });
  };
  // We need a handler that can update the strokeWidth value
  const handleStrokeWidthChange = (e, value) => {
    props.setDrawStyle({ ...props.drawStyle, strokeWidth: value });
  };
  // We need a handler that can update the text-foreground-color change
  const handleForegroundColorChange = (e) => {
    props.setTextStyle({
      ...props.textStyle,
      foregroundColor: e.hex,
    });
  };
  // We need a handler that can update the text-background-color change
  const handleBackgroundColorChange = (e) => {
    props.setTextStyle({
      ...props.textStyle,
      backgroundColor: e.hex,
    });
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
            color={props.drawStyle.fillColor}
            handleColorChange={handleFillColorChange}
            handleOpacityChange={handleOpacityChange}
            drawModel={props.drawModel}
          />
        </Grid>
        <Grid item xs={12}>
          <DrawStyleAccordion
            title="Linje"
            showStrokeWidthSlider
            color={props.drawStyle.strokeColor}
            strokeWidth={props.drawStyle.strokeWidth}
            handleColorChange={handleStrokeColorChange}
            handleStrokeWidthChange={handleStrokeWidthChange}
            drawModel={props.drawModel}
            showStrokeTypeSelector
            handleStrokeTypeChange={props.handleStrokeTypeChange}
            strokeType={props.drawStyle.strokeType}
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
            title="Färg - förgrund"
            color={props.textStyle.foregroundColor}
            handleColorChange={handleForegroundColorChange}
            drawModel={props.drawModel}
          />
        </Grid>
        <Grid item xs={12}>
          <DrawStyleAccordion
            title="Färg - bakgrund"
            color={props.textStyle.backgroundColor}
            handleColorChange={handleBackgroundColorChange}
            drawModel={props.drawModel}
          />
        </Grid>
      </Grid>
    );
  };

  // The style-settings for arrows! We are not showing a stroke-width-slider
  // when creating arrows, since they should have a standard width.
  const renderArrowStyleSettings = () => {
    return (
      <DrawStyleAccordion
        title="Färg"
        color={props.drawStyle.strokeColor}
        handleColorChange={handleStrokeColorChange}
        drawModel={props.drawModel}
      />
    );
  };

  // The style settings for line-drawings!
  // Why are we grid-ing these? Cause we're gonna be implementing more settings.
  const renderLineStyleSettings = () => {
    return (
      <DrawStyleAccordion
        title="Bredd och färg"
        showStrokeWidthSlider
        color={props.drawStyle.strokeColor}
        strokeWidth={props.drawStyle.strokeWidth}
        handleColorChange={handleStrokeColorChange}
        handleStrokeWidthChange={handleStrokeWidthChange}
        drawModel={props.drawModel}
      />
    );
  };

  // We want to display different settings depending on what the user is drawing!
  // Let's check and render the appropriate settings.
  const renderStyleSettings = () => {
    switch (props.activeDrawType) {
      case "Arrow":
        return renderArrowStyleSettings();
      case "LineString":
        return renderLineStyleSettings();
      case "Text":
        return renderTextStyleSettings();
      default:
        return renderFillStyleSettings();
    }
  };

  return renderStyleSettings();
}
