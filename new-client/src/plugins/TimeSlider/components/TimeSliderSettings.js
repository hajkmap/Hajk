import React from "react";
import { withTheme } from "@material-ui/styles";
import { Grid, Typography, Tooltip, Switch } from "@material-ui/core";
import {
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
} from "@material-ui/core";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from "@material-ui/core";

import WarningIcon from "@material-ui/icons/Warning";

class TimeSliderSettings extends React.PureComponent {
  constructor(props) {
    super(props);
    this.layerStatus = props.layerStatus;
  }

  renderLayerList = () => {
    const { layers, layerStatus, theme } = this.props;

    return (
      <List>
        {layers.map((layer, index) => {
          const id = layer.get("name");
          const visible = layer.get("visible");
          let error = false;
          let errorType = "";
          layerStatus.faultyLayers
            .filter((layer) => {
              return layer.layerId === id;
            })
            .forEach((layer) => {
              error = true;
              errorType = layer.layerError;
            });
          return (
            <ListItem
              key={index}
              style={{
                borderLeft: `${theme.spacing(0.5)}px solid ${
                  error ? theme.palette.error.main : theme.palette.success.main
                }`,
              }}
              disabled={!visible}
            >
              {error && (
                <Tooltip
                  key={`tt_${index}`}
                  title={`${
                    error
                      ? errorType === "date_start_equals_end"
                        ? "Start- och slutdatumet på lagret har samma värde!"
                        : "Start- eller slutdatumet på lagret saknas!"
                      : "Lagret ser okej ut!"
                  }`}
                >
                  <ListItemIcon>
                    <WarningIcon />
                  </ListItemIcon>
                </Tooltip>
              )}

              <ListItemText primary={layer.get("caption")} />

              <ListItemSecondaryAction>
                <Tooltip title={visible ? "Dölj lager" : "Visa lager"}>
                  <Switch
                    checked={visible}
                    onChange={() => {
                      layer.setVisible(!visible);
                      this.setState({ time: new Date() });
                    }}
                    name="checkedA"
                    inputProps={{ "aria-label": "secondary checkbox" }}
                  />
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
    );
  };

  renderSettingsContainer = () => {
    const {
      sliderSpeed,
      resolution,
      handleResolutionChange,
      handleSliderSpeedChange,
    } = this.props;
    return (
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <Select
              labelId="select-stepSize-label"
              id="select-stepSize"
              value={sliderSpeed}
              onChange={(e) => {
                handleSliderSpeedChange(e.target.value);
              }}
            >
              <MenuItem value={2000}>Långsam (0.5 Hz)</MenuItem>
              <MenuItem value={1000}>Medium (1 Hz)</MenuItem>
              <MenuItem value={500}>Snabb (2 Hz)</MenuItem>
            </Select>
            <FormHelperText>Ändra tidslinjens hastighet</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <Select
              labelId="select-resolution-label"
              id="select-resolution"
              value={resolution}
              onChange={(e) => {
                handleResolutionChange(e.target.value);
              }}
            >
              <MenuItem value={"days"}>Dag</MenuItem>
              <MenuItem value={"months"}>Månad</MenuItem>
              <MenuItem value={"years"}>År</MenuItem>
            </Select>
          </FormControl>
          <FormHelperText>Ändra tidslinjens upplösning</FormHelperText>
        </Grid>
      </Grid>
    );
  };

  render() {
    const { layerStatus } = this.props;

    if (layerStatus.errorType === "layers_missing") {
      return (
        <Grid container>
          <Typography>
            Inga tidslinje-lager kunde hittas. Kontakta systemadministratören.
          </Typography>
        </Grid>
      );
    } else {
      return (
        <Grid container>
          <Grid item xs={12}>
            <Typography>Lagerstatus: </Typography>
          </Grid>
          <Grid item xs={12}>
            {this.renderLayerList()}
          </Grid>
          <Grid item xs={12}>
            <Typography>Inställningar: </Typography>
          </Grid>
          <Grid item xs={12}>
            {this.renderSettingsContainer()}
          </Grid>
        </Grid>
      );
    }
  }
}

export default withTheme(TimeSliderSettings);
