import React from "react";
import { Grid, Tooltip, Switch } from "@material-ui/core";
import { FormControl, FormLabel, FormControlLabel } from "@material-ui/core";
import Information from "../components/Information";

const SettingsView = (props) => {
  // Let's destruct some props
  const { model, id, measurementSettings, setMeasurementSettings } = props;
  // Then we'll get some information about the current activity (view)
  const activity = model.getActivityFromId(id);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Generella inställningar</FormLabel>
          <Tooltip title="Slå på om du vill visa objektens mått.">
            <FormControlLabel
              label="Visa mått på objekten"
              control={
                <Switch
                  checked={measurementSettings.showText}
                  onChange={() => {
                    setMeasurementSettings((settings) => ({
                      ...settings,
                      showText: !settings.showText,
                    }));
                  }}
                  color="primary"
                />
              }
            />
          </Tooltip>
          <Tooltip title="Slå på om du vill visa objektens area.">
            <FormControlLabel
              label="Visa objektens area"
              control={
                <Switch
                  checked={measurementSettings.showArea}
                  onChange={() => {
                    setMeasurementSettings((settings) => ({
                      ...settings,
                      showArea: !settings.showArea,
                    }));
                  }}
                  color="primary"
                />
              }
            />
          </Tooltip>
          <Tooltip title="Slå på om du vill visa objektens omkrets.">
            <FormControlLabel
              label="Visa objektens omkrets"
              control={
                <Switch
                  checked={measurementSettings.showPerimeter}
                  onChange={() => {
                    setMeasurementSettings((settings) => ({
                      ...settings,
                      showPerimeter: !settings.showPerimeter,
                    }));
                  }}
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
