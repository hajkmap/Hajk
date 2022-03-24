import React from "react";
import { Grid, Tooltip, Switch } from "@material-ui/core";
import { FormControl, FormLabel, FormControlLabel } from "@material-ui/core";
import { Select, InputLabel, MenuItem } from "@material-ui/core";
import Information from "../components/Information";

import {
  AREA_MEASUREMENT_UNITS,
  LENGTH_MEASUREMENT_UNITS,
  MEASUREMENT_PRECISIONS,
} from "../constants";

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
          <FormLabel focused={false} component="legend">
            Generella inställningar
          </FormLabel>
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
          <Tooltip title="Välj enhet för mätning av areal.">
            <FormControl size="small" style={{ marginTop: 8 }}>
              <InputLabel
                variant="outlined"
                id="sketch-select-area-measurement-unit-label"
              >
                Mätenhet, areal
              </InputLabel>
              <Select
                id="sketch-select-area-measurement-unit"
                labelId="sketch-select-area-measurement-unit-label"
                value={measurementSettings.areaUnit}
                label="Mätenhet, areal"
                variant="outlined"
                onChange={(e) => {
                  setMeasurementSettings((settings) => ({
                    ...settings,
                    areaUnit: e.target.value,
                  }));
                }}
              >
                {AREA_MEASUREMENT_UNITS.map((unit, index) => {
                  return (
                    <MenuItem value={unit.type} key={index}>
                      {unit.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Tooltip>
          <Tooltip title="Välj enhet för mätning av längd.">
            <FormControl size="small" style={{ marginTop: 16 }}>
              <InputLabel
                variant="outlined"
                id="sketch-select-length-measurement-unit-label"
              >
                Mätenhet, längd
              </InputLabel>
              <Select
                id="sketch-select-length-measurement-unit"
                labelId="sketch-select-length-measurement-unit-label"
                value={measurementSettings.lengthUnit}
                label="Mätenhet, längd"
                variant="outlined"
                onChange={(e) => {
                  setMeasurementSettings((settings) => ({
                    ...settings,
                    lengthUnit: e.target.value,
                  }));
                }}
              >
                {LENGTH_MEASUREMENT_UNITS.map((unit, index) => {
                  return (
                    <MenuItem value={unit.type} key={index}>
                      {unit.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Tooltip>
          <Tooltip title="Välj med vilken precision mätvärdena ska presenteras.">
            <FormControl size="small" style={{ marginTop: 16 }}>
              <InputLabel variant="outlined" id="sketch-select-precision-label">
                Mätprecision
              </InputLabel>
              <Select
                id="sketch-select-precision"
                labelId="sketch-select-precision-label"
                value={measurementSettings.precision ?? 0}
                label="Mätprecision"
                variant="outlined"
                onChange={(e) => {
                  setMeasurementSettings((settings) => ({
                    ...settings,
                    precision: parseInt(e.target.value),
                  }));
                }}
              >
                {MEASUREMENT_PRECISIONS.map((precision, index) => {
                  return (
                    <MenuItem value={precision.value} key={index}>
                      {precision.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Tooltip>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default SettingsView;
