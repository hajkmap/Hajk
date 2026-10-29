import React from "react";
import { Grid, Typography, Switch } from "@mui/material";
import { FormControl, FormHelperText, MenuItem, Select } from "@mui/material";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";

import WarningIcon from "@mui/icons-material/Warning";
import HajkToolTip from "components/HajkToolTip";
import i18n from "src/i18n";

class TimeSliderSettings extends React.PureComponent {
  constructor(props) {
    super(props);
    this.layerStatus = props.layerStatus;
  }

  renderLayerList = () => {
    const { layers, layerStatus } = this.props;

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
            <ListItem key={index} sx={(_theme) => ({})} disabled={!visible}>
              {error && (
                <HajkToolTip
                  key={`tt_${index}`}
                  title={
                    error
                      ? errorType === "date_start_equals_end"
                        ? i18n.t("timeSlider.settings.startEqualsEnd")
                        : i18n.t("timeSlider.settings.dateMissing")
                      : i18n.t("timeSlider.settings.layerOk")
                  }
                >
                  <ListItemIcon>
                    <WarningIcon />
                  </ListItemIcon>
                </HajkToolTip>
              )}
              <ListItemText primary={layer.get("caption")} />
              <ListItemSecondaryAction>
                <HajkToolTip
                  title={
                    visible
                      ? i18n.t("timeSlider.settings.hideLayer")
                      : i18n.t("timeSlider.settings.showLayer")
                  }
                >
                  <Switch
                    checked={visible}
                    onChange={() => {
                      layer.setVisible(!visible);
                      this.setState({ time: new Date() });
                    }}
                    name="checkedA"
                    slotProps={{
                      input: { "aria-label": "secondary checkbox" },
                    }}
                  />
                </HajkToolTip>
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
        <Grid size={6}>
          <FormControl fullWidth>
            <Select
              variant="standard"
              labelId="select-stepSize-label"
              id="select-stepSize"
              value={sliderSpeed}
              onChange={(e) => {
                handleSliderSpeedChange(e.target.value);
              }}
            >
              <MenuItem value={2000}>
                {i18n.t("timeSlider.settings.speedSlow")}
              </MenuItem>
              <MenuItem value={1000}>
                {i18n.t("timeSlider.settings.speedMedium")}
              </MenuItem>
              <MenuItem value={500}>
                {i18n.t("timeSlider.settings.speedFast")}
              </MenuItem>
            </Select>
            <FormHelperText>
              {i18n.t("timeSlider.settings.speedHelp")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid size={6}>
          <FormControl fullWidth>
            <Select
              variant="standard"
              labelId="select-resolution-label"
              id="select-resolution"
              value={resolution}
              onChange={(e) => {
                handleResolutionChange(e.target.value);
              }}
            >
              <MenuItem value={"days"}>
                {i18n.t("timeSlider.resolutions.days")}
              </MenuItem>
              <MenuItem value={"months"}>
                {i18n.t("timeSlider.resolutions.months")}
              </MenuItem>
              <MenuItem value={"quarters"}>
                {i18n.t("timeSlider.resolutions.quarters")}
              </MenuItem>
              <MenuItem value={"years"}>
                {i18n.t("timeSlider.resolutions.years")}
              </MenuItem>
            </Select>
          </FormControl>
          <FormHelperText>
            {i18n.t("timeSlider.settings.resolutionHelp")}
          </FormHelperText>
        </Grid>
      </Grid>
    );
  };

  render() {
    const { layerStatus } = this.props;

    if (layerStatus.errorType === "layers_missing") {
      return (
        <Grid container>
          <Typography>{i18n.t("timeSlider.settings.noLayers")}</Typography>
        </Grid>
      );
    } else {
      return (
        <Grid container>
          <Grid size={12}>
            <Typography>{i18n.t("timeSlider.settings.layerStatus")}</Typography>
          </Grid>
          <Grid size={12}>{this.renderLayerList()}</Grid>
          <Grid size={12}>
            <Typography>{i18n.t("timeSlider.settings.settings")}</Typography>
          </Grid>
          <Grid size={12}>{this.renderSettingsContainer()}</Grid>
        </Grid>
      );
    }
  }
}

export default TimeSliderSettings;
