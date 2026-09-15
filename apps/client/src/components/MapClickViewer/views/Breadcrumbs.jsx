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
    setSelectedFeatureId,
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
          // If setSelectedFeatureId is provided, we're in step 3 already and wish to
          // unset it (so we get back to step 2). If it isn't set, however, we're already
          // in step 2 (list view) and wish to unset that, so we get back to step 1.
          setSelectedFeatureId
            ? setSelectedFeatureId(null)
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
            variant="caption"
            sx={{
              color: "text.primary",
              cursor: "pointer",
            }}
          >
            Översikt
          </Link>
        )}
        {setSelectedFeatureCollection && !setSelectedFeatureId && (
          <Typography
            variant="caption"
            sx={{
              color: "text.primary",
            }}
          >
            {featureCollection.displayName}
          </Typography>
        )}

        {setSelectedFeatureId && (
          <Link
            onClick={() => setSelectedFeatureId(null)}
            underline="hover"
            variant="caption"
            sx={{
              color: "text.primary",
              cursor: "pointer",
            }}
          >
            {featureCollection.displayName}
          </Link>
        )}
        {setSelectedFeatureId && (
          <Typography
            variant="caption"
            sx={{
              color: "text.primary",
            }}
          >
            {feature.primaryLabel}
          </Typography>
        )}
      </MUIBreadcrumbs>
    </>
  );
};

export default Breadcrumbs;
