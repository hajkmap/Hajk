import React from "react";
import Button from "@mui/material/Button";

const Breadcrumbs = (props) => {
  const {
    feature,
    featureCollection,
    selectedFeature,
    selectedFeatureCollection,
    setSelectedFeature,
    setSelectedFeatureCollection,
  } = props;
  console.log("Breadcrumbs: ", props);

  return (
    <>
      {setSelectedFeatureCollection && (
        <Button onClick={() => setSelectedFeatureCollection(null)} fullWidth>
          Tillbaka till steg 1
        </Button>
      )}
      {setSelectedFeature && (
        <Button onClick={() => setSelectedFeature(null)} fullWidth>
          Tillbaka till steg 2
        </Button>
      )}
    </>
  );
};

export default Breadcrumbs;
