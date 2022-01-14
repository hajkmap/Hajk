import React from "react";
import { Grid, TextField, Typography } from "@material-ui/core";

import DrawTypeSelector from "../components/DrawTypeSelector";
import Information from "../components/Information";
import DrawStyleSelector from "../components/drawStyle/DrawStyleSelector";
import StrokeTypeSelector from "../components/drawStyle/StrokeTypeSelector";
import FeatureTextSetter from "../components/FeatureTextSetter";

import { STROKE_DASHES } from "../constants";

const AddView = (props) => {
  // Let's destruct some properties from the props
  const { model, activeDrawType, setActiveDrawType } = props;
  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(props.id);

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
      size: e.target.value,
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

  return (
    <Grid container>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12} style={{ marginTop: 16 }}>
        <Grid item xs={12} style={{ marginBottom: 4 }}>
          <Typography align="center">Typ</Typography>
        </Grid>
        <Grid item xs={12}>
          <DrawTypeSelector
            activeDrawType={activeDrawType}
            setActiveDrawType={setActiveDrawType}
          />
        </Grid>
      </Grid>
      {activeDrawType === "LineString" && renderStrokeTypeSelector()}
      {activeDrawType === "Text" && renderTextSizeSelector()}
      <Grid item xs={12} style={{ marginTop: 16 }}>
        <Grid item xs={12} style={{ marginBottom: 4 }}>
          <Typography align="center">Utseende</Typography>
        </Grid>
        <Grid item xs={12}>
          <DrawStyleSelector
            activeDrawType={activeDrawType}
            drawStyle={props.drawStyle}
            drawModel={props.drawModel}
            setDrawStyle={props.setDrawStyle}
            textStyle={props.textStyle}
            setTextStyle={props.setTextStyle}
            handleStrokeTypeChange={handleStrokeTypeChange}
          />
        </Grid>
      </Grid>
      <FeatureTextSetter
        localObserver={props.localObserver}
        drawModel={props.drawModel}
      />
    </Grid>
  );
};

export default AddView;
