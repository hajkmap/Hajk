import React from "react";

// This is used to update the style on the supplied feature
const FeatureStyleEditor = ({ feature, model }) => {
  // We're gonna need to keep track of the feature-style
  const [featureStyle, setFeatureStyle] = React.useState(null);
  // An effect to make sure we set the feature-style-state to the actual style.
  React.useEffect(() => {
    setFeatureStyle(model.getFeatureStyle(feature));
  }, [feature, model]);

  return (
    <section>
      <pre>{JSON.stringify(featureStyle)}</pre>
    </section>
  );
};

export default FeatureStyleEditor;
