import React from "react";
import Grid from "@material-ui/core/Grid";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Popover,
  Tooltip,
  Switch,
  IconButton,
  FormControlLabel,
} from "@material-ui/core";
import PaletteIcon from "@material-ui/icons/Palette";
import { TwitterPicker as ColorPicker } from "react-color";

const styles = (theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  formControl: {
    margin: theme.spacing(1),
    width: "100%",
  },
  mapTextColorLabel: {
    margin: 0,
  },
  printButton: {
    position: "fixed",
    bottom: theme.spacing(1),
    margin: theme.spacing(1),
    width: "90%",
  },
});

class AdvancedOptions extends React.PureComponent {
  state = {
    anchorEl: null,
  };

  // Default colors for color picker used to set text color (used in map title, scale, etc)
  mapTextAvailableColors = [
    "#FFFFFF",
    "#D0021B",
    "#F5A623",
    "#F8E71C",
    "#8B572A",
    "#7ED321",
    "#417505",
    "#9013FE",
    "#4A90E2",
    "#50E3C2",
    "#B8E986",
    "#000000",
    "#4A4A4A",
    "#9B9B9B",
  ];

  toggleColorPicker = (e) => {
    this.setState({ anchorEl: e.currentTarget });
  };

  hideColorPicker = (e) => {
    this.setState({ anchorEl: null });
  };

  handleMapTextColorChangeComplete = (color) => {
    this.hideColorPicker();
    this.props.setMapTextColor(color);
  };

  render() {
    const {
      classes,
      resolution,
      handleChange,
      mapTextColor,
      mapTitle,
    } = this.props;
    return (
      <>
        <Grid container>
          <FormControl className={classes.formControl}>
            <TextField
              value={mapTitle}
              onChange={handleChange}
              label="Valfri titel"
              placeholder="Kan lämnas tomt"
              variant="standard"
              inputProps={{
                id: "mapTitle",
                name: "mapTitle",
              }}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="resolution">Upplösning (DPI)</InputLabel>
            <Select
              value={resolution}
              onChange={handleChange}
              inputProps={{
                name: "resolution",
                id: "resolution",
              }}
            >
              <MenuItem value={72}>72</MenuItem>
              <MenuItem value={150}>150</MenuItem>
              <MenuItem value={300}>300</MenuItem>
            </Select>
          </FormControl>

          <FormControl className={classes.formControl}>
            <Tooltip title="Textfärg påverkar inte kartans etiketter utan styr endast färgen för kringliggande texter, så som titel, copyrighttext, etc.">
              <FormControlLabel
                value="mapTextColor"
                className={classes.mapTextColorLabel}
                control={
                  <IconButton
                    id="mapTextColor"
                    onClick={this.toggleColorPicker}
                    style={{
                      backgroundColor: mapTextColor,
                      marginRight: 4,
                    }}
                    edge="start"
                    size="small"
                  >
                    <PaletteIcon />
                  </IconButton>
                }
                label="Textfärg"
              />
            </Tooltip>
          </FormControl>

          <Popover
            id="color-picker-menu"
            anchorEl={this.state.anchorEl}
            open={Boolean(this.state.anchorEl)}
            onClose={this.hideColorPicker}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
          >
            <ColorPicker
              inputProps={{
                id: "mapTextColor",
                name: "mapTextColor",
              }}
              color={mapTextColor}
              colors={this.mapTextAvailableColors}
              onChangeComplete={this.handleMapTextColorChangeComplete}
            />
          </Popover>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(AdvancedOptions));
