import React from "react";
import { Grid, Tooltip, Switch } from "@material-ui/core";
import { FormControl, FormLabel, FormControlLabel } from "@material-ui/core";
import Information from "../components/Information";

const SettingsView = ({ drawModel, model, id, settings, setSettings }) => {
  const handleShowTextChange = React.useCallback(() => {
    setSettings((settings) => ({
      ...settings,
      showText: !settings.showText,
    }));
    drawModel.setShowFeatureMeasurements(!settings.showText);
  }, [drawModel, setSettings, settings.showText]);

  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(id);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Generella ritinställningar</FormLabel>
          <Tooltip title="Slå på om du vill visa objektens mått.">
            <FormControlLabel
              label="Visa mått på objekten"
              control={
                <Switch
                  checked={settings.showText}
                  onChange={handleShowTextChange}
                  color="primary"
                />
              }
            />
          </Tooltip>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default SettingsView;
