import React from "react";

// This is used to update the style on the supplied feature
const FeatureStyleEditor = ({ feature }) => {
  return <pre>{JSON.stringify(feature)}</pre>;
};

export default FeatureStyleEditor;
