import React from "react";
import { Grid } from "@mui/material";
import FeatureListItem from "./FeatureListItem";

function FeatureList(props) {
  return (
    <Grid item xs={12} sx={{ maxHeight: "300px", overflowY: "auto" }}>
      {props.features.map((feature, index) => {
        return (
          <FeatureListItem
            app={props.app}
            key={index}
            feature={feature}
            source={props.source}
            setSelectedFeatures={props.setSelectedFeatures}
            mapViewModel={props.mapViewModel}
          />
        );
      })}
    </Grid>
  );
}

export default FeatureList;
