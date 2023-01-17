// Base
import React from "react";
import { Button, Grid, Typography } from "@mui/material";

import FeatureList from "../featureList/FeatureList";
import { useState } from "react";
import { useEffect } from "react";

function getInformationTexts(typeId = 0, selectedFeatures = [], model) {
  const typeInfo = model.getEnvironmentInfoFromId(typeId);

  const headerText =
    selectedFeatures.length > 0
      ? `Selekterade ${typeInfo.name.toLowerCase()}`
      : `Det finns inga selekterade ${typeInfo.name.toLowerCase()}`;
  const helperText =
    selectedFeatures.length > 0
      ? ""
      : `Aktivera verktyget och klicka i kartan för att välja ${typeInfo.name.toLowerCase()}.`;

  return { headerText, helperText, ...typeInfo };
}

function SelectionArea(props) {
  const [objectInfo, setObjectInfo] = useState(() =>
    getInformationTexts(props.typeId, props.selectedFeatures, props.model)
  );

  useEffect(() => {
    setObjectInfo(() =>
      getInformationTexts(props.typeId, props.selectedFeatures, props.model)
    );
  }, [props.typeId, props.selectedFeatures, props.model]);

  // Handles click on button used to remove all selected estates
  const handleResetSelectionClick = () => {
    props.setSelectedFeatures([]);
  };

  return (
    <Grid container>
      <Grid container item xs={12}>
        <Typography variant="h6" align="center" sx={{ width: "100%" }}>
          {objectInfo.headerText}
        </Typography>
        {objectInfo.helperText !== "" && (
          <Typography variant="caption" align="center" sx={{ width: "100%" }}>
            {objectInfo.helperText}
          </Typography>
        )}
      </Grid>
      <FeatureList
        app={props.app}
        source={props.source}
        features={props.selectedFeatures}
        setSelectedFeatures={props.setSelectedFeatures}
        mapViewModel={props.mapViewModel}
      />
      {props.selectedFeatures.length > 0 && (
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
