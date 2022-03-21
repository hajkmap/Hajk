import React from "react";

import { Breadcrumbs as MUIBreadcrumbs, Link, Typography } from "@mui/material";

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
    <MUIBreadcrumbs separator="›" aria-label="breadcrumb" sx={{ p: 1 }}>
      {setSelectedFeatureCollection && (
        <Link
          onClick={() => setSelectedFeatureCollection(null)}
          underline="hover"
          color="inherit"
          href="#"
        >
          Översikt
        </Link>
      )}
      {setSelectedFeatureCollection && !setSelectedFeature && (
        <Typography color="text.primary">Listvy</Typography>
      )}

      {setSelectedFeature && (
        <Link
          onClick={() => setSelectedFeature(null)}
          underline="hover"
          color="inherit"
          href="#"
        >
          Listvy
        </Link>
      )}
      {setSelectedFeature && (
        <Typography color="text.primary">Detaljvy</Typography>
      )}
    </MUIBreadcrumbs>
  );
};

export default Breadcrumbs;
