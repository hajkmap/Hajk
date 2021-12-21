import React from "react";
import { Grid } from "@material-ui/core";
import Information from "../components/Information";

const SettingsView = (props) => {
  // We have to get some information about the current activity (view)
  const activity = props.model.getActivityFromId(props.id);
  return (
    <Grid container>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
    </Grid>
  );
};

export default SettingsView;
