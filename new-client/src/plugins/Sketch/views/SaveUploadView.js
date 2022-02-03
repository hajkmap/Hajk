import React from "react";
import { Grid } from "@material-ui/core";
import Information from "../components/Information";

const SaveUploadView = (props) => {
  // We have to get some information about the current activity (view)
  const activity = props.model.getActivityFromId(props.id);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <Information text={"Skapa nytt objekt"} />
      </Grid>
      <Grid item xs={12}>
        <Information text={"Sparade objekt"} />
      </Grid>
    </Grid>
  );
};

export default SaveUploadView;
