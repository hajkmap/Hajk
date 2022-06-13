// Base
import React from "react";
import { Button, Divider, Grid, Typography } from "@mui/material";

// Components
import EstateToolbox from "./EstateToolbox";
import FeatureList from "../featureList/FeatureList";

// Constants
import { ESTATE_TEXT } from "../../constants";

function EstateSection(props) {
  // The header-text depends on if the user has selected any features or not...
  const headerText =
    props.selectedEstates.length === 0
      ? ESTATE_TEXT.NO_SELECTED_ESTATES_HEADER
      : ESTATE_TEXT.SELECTED_ESTATES_HEADER;
  // ...the helper-text does as well obviously.s
  const helperText =
    props.selectedEstates.length === 0
      ? ESTATE_TEXT.NO_SELECTED_ESTATES_HELP
      : "";
  // Handles click on button used to remove all selected estates
  const handleResetSelectionClick = () => {
    props.setSelectedEstates([]);
  };

  return (
    <Grid container sx={{ padding: 2 }} justifyContent="center">
      <EstateToolbox layer={props.model.getEstateWmsLayer()} />
      <Grid
        container
        sx={{ marginTop: 2, marginBottom: 1 }}
        justifyContent="center"
      >
        <Divider sx={{ width: "20%" }} />
      </Grid>
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
        features={props.selectedEstates}
        setSelectedFeatures={props.setSelectedEstates}
      />
      {props.selectedEstates.length > 0 && (
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
    </Grid>
  );
}

export default EstateSection;
