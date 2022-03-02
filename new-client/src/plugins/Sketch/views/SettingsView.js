import React from "react";
import { Grid, Tooltip, Switch, FormControlLabel } from "@material-ui/core";
import Information from "../components/Information";

const SettingsView = (props) => {
  // We have to get some information about the current activity (view)
  const activity = props.model.getActivityFromId(props.id);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <Tooltip title="Slå på om du vill visa objektens mått.">
          <FormControlLabel
            size="small"
            label="Visa mått på objekten"
            control={
              <Switch
                checked={props.settings.showText}
                onChange={console.log}
                size="small"
                color="primary"
              />
            }
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
};

export default SettingsView;
