import React from "react";
import FeatureStyleSelector from "./FeatureStyleSelector";
import { Grid, TextField, Typography } from "@mui/material";

const FeatureTextEditor = ({ text, onChange }) => {
  return (
    <Grid item xs={12} style={{ marginTop: 16 }}>
      <Grid item xs={12} style={{ marginBottom: 4 }}>
        <Typography align="center">Text</Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          value={text}
          onChange={onChange}
          variant="outlined"
          size="small"
        />
      </Grid>
    </Grid>
  );
};

// This is used to update the style on the supplied feature
const FeatureStyleEditor = ({ feature, model, drawModel }) => {
  // We're gonna need to keep track of the feature-style
  const [featureStyle, setFeatureStyle] = React.useState(
    model.getFeatureStyle(feature)
  );
  // We're gonna need to keep track of the eventual feature-text.
  // This only applies to text-features obviously.
  const [featureText, setFeatureText] = React.useState(null);

  // Effect to make sure we set the feature-style-state to the actual style.
  React.useEffect(() => {
    if (feature) {
      setFeatureStyle(model.getFeatureStyle(feature));
    } else {
      setFeatureStyle(null);
    }
  }, [feature, model]);

  // Effect that makes sure to update the feature style when the style-state changes.
  React.useEffect(() => {
    if (feature) {
      model.setFeatureStyle(feature, featureStyle);
      drawModel.refreshDrawLayer();
    }
  }, [featureStyle, feature, drawModel, model]);

  // Effect making sure the feature-text is set to the actual text of the feature.
  React.useEffect(() => {
    // First we'll get the text from the feature
    const text = feature.get("USER_TEXT");
    // If the text us null(ish) we set the state to null
    if (!text) {
      setFeatureText(null);
      // Otherwise we set it to the actual value
    } else {
      setFeatureText(text);
    }
  }, [feature]);

  // Effect making sure the updated feature-text is applied to the feature
  React.useEffect(() => {
    feature.set("USER_TEXT", featureText);
    drawModel.refreshDrawLayer();
  }, [drawModel, feature, featureText]);

  // Since the <FeatureStyleSelector /> expects the draw-style, the text-style,
  // and their set:ers to be separate, we have to create a set:er for the text-style
  // since we'ce chosen to combine the styles in one object here.
  const setTextStyle = (newTextStyle) => {
    setFeatureStyle({
      ...featureStyle,
      textForegroundColor: newTextStyle.foregroundColor,
      textBackgroundColor: newTextStyle.backgroundColor,
      textSize: newTextStyle.size,
    });
  };

  // The same applies here as above. The <FeatureStyleSelector /> expects separated
  // text-style, so let's create one.
  const textStyle = {
    foregroundColor: featureStyle.textForegroundColor,
    backgroundColor: featureStyle.textBackgroundColor,
    size: featureStyle.textSize,
  };

  return (
    <Grid container>
      {featureText !== null && (
        <FeatureTextEditor
          text={featureText}
          onChange={(e) => setFeatureText(e.target.value)}
        />
      )}
      <FeatureStyleSelector
        isEdit={true}
        activeDrawType={feature.get("DRAW_METHOD")}
        drawStyle={featureStyle}
        textStyle={textStyle}
        drawModel={drawModel}
        setDrawStyle={setFeatureStyle}
        setTextStyle={setTextStyle}
      />
    </Grid>
  );
};

export default FeatureStyleEditor;
