import React from "react";
import { Grid, Typography, TextField } from "@mui/material";
import { STROKE_DASHES } from "plugins/Sketch/constants";

import FeatureStyleAccordion from "./FeatureStyleAccordion";
import FeaturePointSizeAccordion from "./FeatureSizeAccordion";
import StrokeTypeSelector from "./StrokeTypeSelector";
import FeatureBufferAccordion from "./FeatureBufferAccordion";

export default function FeatureStyleSelector(props) {
  // We need a handler that can update the stroke-dash setting
  const handleStrokeTypeChange = (e) => {
    // We are storing both the stroke-type (e.g. "dashed", "dotted", or "solid") as well as
    // the actual line-dash array which corresponds to the stroke-type.
    // The stroke-type comes from the select-event
    const strokeType = e.target.value;
    // And corresponds to a line-dash from the constants
    const lineDash = STROKE_DASHES.get(strokeType);
    // When everything we need is fetched, we update the draw-style.
    props.setDrawStyle({
      ...props.drawStyle,
      strokeType: strokeType,
      lineDash: lineDash,
    });
  };

  // We need a handler that can update the text-size setting
  const handleTextSizeChange = (e) => {
    props.setTextStyle({
      ...props.textStyle,
      size: parseInt(e.target.value),
    });
  };

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

  const handleRadiusChange = (event, value) => {
    props.setDrawStyle({ ...props.drawStyle, radius: value });
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

  const renderStrokeTypeSelector = () => {
    return (
      <Grid item xs={12} style={{ marginTop: 16 }}>
        <Grid item xs={12} style={{ marginBottom: 4 }}>
          <Typography align="center">Variant</Typography>
        </Grid>
        <Grid item xs={12}>
          <StrokeTypeSelector
            handleStrokeTypeChange={handleStrokeTypeChange}
            strokeType={props.drawStyle.strokeType}
            includeContainer={false}
          />
        </Grid>
      </Grid>
    );
  };

  const renderTextSizeSelector = () => {
    return (
      <Grid item xs={12} style={{ marginTop: 16 }}>
        <Grid item xs={12} style={{ marginBottom: 4 }}>
          <Typography align="center">Textstorlek</Typography>
        </Grid>
        <Grid item xs={12}>
          <TextField
            variant="outlined"
            type="number"
            size="small"
            fullWidth
            value={props.textStyle.size}
            onChange={handleTextSizeChange}
          ></TextField>
        </Grid>
      </Grid>
    );
  };

  // The style settings for area-drawings!
  const renderFillStyleSettings = () => {
    return (
      <Grid container>
        <Grid item xs={12}>
          <FeatureStyleAccordion
            title="Fyllnad"
            showOpacitySlider
            color={props.drawStyle.fillColor}
            handleColorChange={handleFillColorChange}
            handleOpacityChange={handleOpacityChange}
            drawModel={props.drawModel}
          />
        </Grid>
        <Grid item xs={12}>
          <FeatureStyleAccordion
            title="Linje"
            showStrokeWidthSlider
            color={props.drawStyle.strokeColor}
            strokeWidth={props.drawStyle.strokeWidth}
            handleColorChange={handleStrokeColorChange}
            handleStrokeWidthChange={handleStrokeWidthChange}
            drawModel={props.drawModel}
            showStrokeTypeSelector
            handleStrokeTypeChange={handleStrokeTypeChange}
            strokeType={props.drawStyle.strokeType}
          />
        </Grid>
      </Grid>
    );
  };

  const renderPointStyleSettings = () => {
    return (
      <Grid container>
        <Grid item xs={12}>
          <FeaturePointSizeAccordion
            title="Storlek"
            showPointSizeSlider
            drawModel={props.drawModel}
            radius={props.drawStyle.radius}
            handleRadiusChange={handleRadiusChange}
          />
        </Grid>
      </Grid>
    );
  };
  // The style settings for text-drawings!
  const renderTextStyleSettings = () => {
    return (
      <Grid container>
        <Grid item xs={12}>
          <FeatureStyleAccordion
            title="Färg - förgrund"
            color={props.textStyle.foregroundColor}
            handleColorChange={handleForegroundColorChange}
            drawModel={props.drawModel}
          />
        </Grid>
        <Grid item xs={12}>
          <FeatureStyleAccordion
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
      <FeatureStyleAccordion
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
      <FeatureStyleAccordion
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

  const renderBufferStyleSettings = () => {
    return (
      <FeatureBufferAccordion
        title="Buffra"
        showBufferSlider
        drawModel={props.drawModel}
        setPluginShown={props.setPluginShown}
        localObserver={props.localObserver}
        globalObserver={props.globalObserver}
        pluginShown={props.pluginShown}
        bufferState={props.bufferState}
        setBufferState={props.setBufferState}
        highlightLayer={props.highlightLayer}
        bufferLayer={props.bufferLayer}
        toggleBufferBtn={props.toggleBufferBtn}
        setToggleBufferBtn={props.setToggleBufferBtn}
      />
    );
  };

  // We want to display different settings depending on what the user is drawing!
  // Let's check and render the appropriate settings.
  const renderColorSelectors = () => {
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

  const renderCircleRadiusSelector = () => {
    if (props.isEdit) {
      return null;
    }
    return (
      <Grid item xs={12} style={{ marginTop: 16 }}>
        <Grid item xs={12} style={{ marginBottom: 4 }}>
          <Typography align="center">Radie (m)</Typography>
        </Grid>
        <Grid item xs={12}>
          <TextField
            variant="outlined"
            type="number"
            size="small"
            fullWidth
            defaultValue={props.drawModel.getCircleRadius()}
            onChange={(e) => {
              props.drawModel.setCircleRadius(e.target.value);
            }}
          ></TextField>
        </Grid>
      </Grid>
    );
  };

  return (
    <Grid container>
      {props.activeDrawType === "LineString" && renderStrokeTypeSelector()}
      {props.activeDrawType === "Text" && renderTextSizeSelector()}
      {props.activeDrawType === "Circle" && renderCircleRadiusSelector()}
      <Grid item xs={12} style={{ marginTop: 16 }}>
        <Grid item xs={12} style={{ marginBottom: 4 }}>
          <Typography align="center">Utseende</Typography>
        </Grid>
        <Grid item xs={12}>
          {renderColorSelectors()}
          {props.activeDrawType === "Point" && renderPointStyleSettings()}
          {props.activityId === "ADD" &&
            props.activeDrawType !== "Circle" &&
            renderBufferStyleSettings()}
        </Grid>
      </Grid>
    </Grid>
  );
}
