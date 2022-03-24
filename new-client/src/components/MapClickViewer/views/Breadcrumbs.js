import React from "react";

import {
  Breadcrumbs as MUIBreadcrumbs,
  Button,
  Divider,
  Link,
  Typography,
} from "@mui/material";

import ArrowBack from "@mui/icons-material/ArrowBack";

const Breadcrumbs = (props) => {
  const {
    feature,
    featureCollection,
    setSelectedFeature,
    setSelectedFeatureCollection,
  } = props;

  return (
    <>
      <Button
        startIcon={<ArrowBack />}
        fullWidth
        sx={{ marginTop: -1 }}
        onClick={(e) => {
          e.stopPropagation();

          setSelectedFeature
            ? setSelectedFeature(null)
            : setSelectedFeatureCollection(null);
        }}
      >
        Gå till föregående vy
      </Button>
      <Divider />
      <MUIBreadcrumbs separator="/" aria-label="breadcrumb">
        {setSelectedFeatureCollection && (
          <Link
            onClick={() => setSelectedFeatureCollection(null)}
            underline="hover"
            color="text.primary"
            variant="caption"
            href="#"
          >
            Översikt
          </Link>
        )}
        {setSelectedFeatureCollection && !setSelectedFeature && (
          <Typography color="text.primary" variant="caption">
            {featureCollection.displayName}
          </Typography>
        )}

        {setSelectedFeature && (
          <Link
            onClick={() => setSelectedFeature(null)}
            underline="hover"
            color="text.primary"
            variant="caption"
            href="#"
          >
            {featureCollection.displayName}
          </Link>
        )}
        {setSelectedFeature && (
          <Typography color="text.primary" variant="caption">
            {feature.primaryLabel}
          </Typography>
        )}
      </MUIBreadcrumbs>
    </>
  );
};

export default Breadcrumbs;
