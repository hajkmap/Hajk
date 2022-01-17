import React from "react";
import FeatureStyleSelector from "./FeatureStyleSelector";

// This is used to update the style on the supplied feature
const FeatureStyleEditor = ({ feature, model, drawModel }) => {
  // We're gonna need to keep track of the feature-style
  const [featureStyle, setFeatureStyle] = React.useState(
    model.getFeatureStyle(feature)
  );
  // An effect to make sure we set the feature-style-state to the actual style.
  React.useEffect(() => {
    setFeatureStyle(model.getFeatureStyle(feature));
  }, [feature, model]);

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
    <FeatureStyleSelector
      activeDrawType={feature.get("DRAW_METHOD")}
      drawStyle={featureStyle}
      textStyle={textStyle}
      drawModel={drawModel}
      setDrawStyle={setFeatureStyle}
      setTextStyle={setTextStyle}
    />
  );
};

export default FeatureStyleEditor;
