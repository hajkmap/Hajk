import React from "react";
import DrawStyleSelector from "./drawStyle/DrawStyleSelector";

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

  return (
    <DrawStyleSelector
      activeDrawType={feature.get("DRAW_METHOD")}
      drawStyle={featureStyle}
      drawModel={drawModel}
      setDrawStyle={setFeatureStyle}
    />
  );
};

export default FeatureStyleEditor;
