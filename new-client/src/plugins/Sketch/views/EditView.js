import React from "react";
import { Grid, Typography } from "@material-ui/core";

import Information from "../components/Information";
import FeatureStyleEditor from "../components/FeatureStyleEditor";

const EditView = ({ model, editFeature, id }) => {
  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(id);
  return (
    <Grid container>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12} style={{ marginTop: 8 }}>
        {editFeature === null ? (
          <Typography>
            Klicka på ett objekt i kartan för att ändra dess utseende.
          </Typography>
        ) : (
          <FeatureStyleEditor feature={editFeature} />
        )}
      </Grid>
    </Grid>
  );
};

export default EditView;
