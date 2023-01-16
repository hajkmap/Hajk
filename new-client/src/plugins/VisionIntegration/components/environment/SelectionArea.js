// Base
import React from "react";
import { Button, Grid, Typography } from "@mui/material";

import FeatureList from "../featureList/FeatureList";
import { useState } from "react";
import { useEffect } from "react";

function getInformationTexts(typeId = 0, selectedObjects = [], model) {
  const typeInfo = model.getEnvironmentInfoFromId(typeId);

  const headerText =
    selectedObjects.length > 0
      ? `Selekterade ${typeInfo.name.toLowerCase()}`
      : `Det finns inga selekterade ${typeInfo.name.toLowerCase()}`;
  const helperText =
    selectedObjects.length > 0
      ? ""
      : `Aktivera verktyget och klicka i kartan för att välja ${typeInfo.name.toLowerCase()}.`;

  return { headerText, helperText };
}

function SelectionArea(props) {
  const [informationTexts, setInformationTexts] = useState(
    getInformationTexts(props.typeId, props.selectedObjects, props.model)
  );

  useEffect(() => {
    setInformationTexts(
      getInformationTexts(props.typeId, props.selectedObjects, props.model)
    );
  }, [props.typeId, props.selectedObjects, props.model]);

  // Handles click on button used to remove all selected estates
  const handleResetSelectionClick = () => {
    console.log("Reset");
  };

  return (
    <Grid container>
      <Grid container item xs={12}>
        <Typography variant="h6" align="center" sx={{ width: "100%" }}>
          {informationTexts.headerText}
        </Typography>
        {informationTexts.helperText !== "" && (
          <Typography variant="caption" align="center" sx={{ width: "100%" }}>
            {informationTexts.helperText}
          </Typography>
        )}
      </Grid>
      <FeatureList
        app={props.app}
        source={props.source}
        features={props.selectedObjects || []}
        setSelectedFeatures={props.setSelectedObjects || console.log}
        mapViewModel={props.mapViewModel}
      />
      {props.selectedObjects.length > 0 && (
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

export default SelectionArea;
