// Base
import React from "react";
import { Button, Grid, Typography } from "@mui/material";

import CoordinateToolbox from "./CoordinateToolbox";
import FeatureList from "../featureList/FeatureList";
import CoordinateTextSetter from "./CoordinateTextSetter";
import SmallDivider from "../SmallDivider";

function CoordinateSection(props) {
  const headerText =
    props.selectedCoordinates.length > 0
      ? "Selekterade koordinater"
      : "Det finns inga selekterade koordinater";
  const helperText =
    props.selectedCoordinates.length > 0
      ? ""
      : "Aktivera verktyget och klicka i kartan för att välja koordinater.";

  // Handles click on button used to remove all selected estates
  const handleResetSelectionClick = () => {
    props.setSelectedCoordinates([]);
  };

  return (
    <Grid container sx={{ padding: 2 }}>
      <CoordinateToolbox
        activeMapInteraction={props.activeMapInteraction}
        setActiveMapInteraction={props.setActiveMapInteraction}
      />
      <SmallDivider mt={2} mb={0.5} />
      <Grid container item xs={12}>
        <Typography variant="h6" align="center" sx={{ width: "100%" }}>
          {headerText}
        </Typography>
        {helperText !== "" && (
          <Typography variant="caption" align="center" sx={{ width: "100%" }}>
            {helperText}
          </Typography>
        )}
      </Grid>
      <FeatureList
        app={props.app}
        source={props.source}
        features={props.selectedCoordinates}
        setSelectedFeatures={props.setSelectedCoordinates}
        mapViewModel={props.mapViewModel}
      />
      {props.selectedCoordinates.length > 0 && (
        <Grid item xs={12} sx={{ marginTop: 1 }}>
          <Button
            fullWidth
            size="small"
            variant="contained"
            onClick={handleResetSelectionClick}
          >
            Rensa selektering
          </Button>
        </Grid>
      )}
      <CoordinateTextSetter localObserver={props.localObserver} />
    </Grid>
  );
}

export default CoordinateSection;
