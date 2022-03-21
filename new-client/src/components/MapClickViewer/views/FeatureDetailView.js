import React from "react";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

import Breadcrumbs from "./Breadcrumbs";
import DefaultTable from "./renderers/DefaultTable";

const FeatureDetailView = (props) => {
  const {
    feature,
    featureCollection,
    selectedFeature,
    selectedFeatureCollection,
    setSelectedFeature,
    setSelectedFeatureCollection,
  } = props;
  console.log("feature: ", feature);
  console.log("selectedFeature: ", selectedFeature);

  return selectedFeature && feature ? (
    <>
      <Breadcrumbs
        setSelectedFeatureCollection={setSelectedFeatureCollection}
        setSelectedFeature={setSelectedFeature}
      />
      <DefaultTable feature={feature} />
    </>
  ) : null;
};

export default FeatureDetailView;
