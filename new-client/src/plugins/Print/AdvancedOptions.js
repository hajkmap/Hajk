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
  IconButton,
  InputAdornment,
} from "@material-ui/core";
import PaletteIcon from "@material-ui/icons/Palette";
import { TwitterPicker as ColorPicker } from "react-color";

const styles = (theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  formControl: {
    width: "100%",
    margin: theme.spacing(1),
    display: "flex",
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

  renderPlacementSelect = (value, name, changeHandler, disabled) => {
    return (
      <Select
        value={value}
        onChange={changeHandler}
        disabled={disabled}
        inputProps={{
          name: name,
          id: name,
        }}
      >
        <MenuItem value={"topLeft"}>Uppe till vänster</MenuItem>
        <MenuItem value={"topRight"}>Uppe till höger</MenuItem>
        <MenuItem value={"bottomRight"}>Nere till höger</MenuItem>
        <MenuItem value={"bottomLeft"}>Nere till vänster</MenuItem>
      </Select>
    );
  };

  renderIncludeSelect = (value, name, changeHandler) => {
    return (
      <Select
        value={value}
        onChange={changeHandler}
        inputProps={{
          name: name,
          id: name,
        }}
      >
        <MenuItem value={true}>Ja</MenuItem>
        <MenuItem value={false}>Nej</MenuItem>
      </Select>
    );
  };

  render() {
    const {
      classes,
      resolution,
      handleChange,
      mapTextColor,
      mapTitle,
      printComment,
      includeNorthArrow,
      northArrowPlacement,
      includeScaleBar,
      scaleBarPlacement,
      includeLogo,
      logoPlacement,
    } = this.props;
    return (
      <>
        <Grid container className={classes.root}>
          <Grid item xs={12} className={classes.formControl}>
            <FormControl fullWidth={true}>
              <TextField
                value={mapTitle}
                fullWidth={true}
                onChange={handleChange}
                label="Valfri titel"
                placeholder="Kan lämnas tomt"
                variant="standard"
                InputProps={{
                  id: "mapTitle",
                  name: "mapTitle",
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Titelfärg påverkar inte kartans etiketter utan styr endast färgen för kringliggande texter, så som titel, copyrighttext, etc.">
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
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} className={classes.formControl}>
            <FormControl fullWidth={true}>
              <TextField
                value={printComment}
                fullWidth={true}
                onChange={handleChange}
                label="Valfri kommentar"
                placeholder="Kan lämnas tomt"
                variant="standard"
                InputProps={{
                  id: "printComment",
                  name: "printComment",
                }}
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} className={classes.formControl}>
            <FormControl fullWidth={true}>
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
          </Grid>
          <Grid item xs={12} className={classes.formControl}>
            <Grid item xs={6} style={{ paddingRight: 10 }}>
              <FormControl fullWidth={true}>
                <InputLabel htmlFor="includeNorthArrow">
                  Inkludera norrpil
                </InputLabel>
                {this.renderIncludeSelect(
                  includeNorthArrow,
                  "includeNorthArrow",
                  handleChange
                )}
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth={true}>
                <InputLabel htmlFor="northArrowPlacement">Placering</InputLabel>
                {this.renderPlacementSelect(
                  northArrowPlacement,
                  "northArrowPlacement",
                  handleChange,
                  !includeNorthArrow
                )}
              </FormControl>
            </Grid>
          </Grid>
          <Grid item xs={12} className={classes.formControl}>
            <Grid item xs={6} style={{ paddingRight: 10 }}>
              <FormControl fullWidth={true}>
                <InputLabel htmlFor="includeScaleBar">
                  Inkludera skalstock
                </InputLabel>
                {this.renderIncludeSelect(
                  includeScaleBar,
                  "includeScaleBar",
                  handleChange
                )}
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth={true}>
                <InputLabel htmlFor="scaleBarPlacement">Placering</InputLabel>
                {this.renderPlacementSelect(
                  scaleBarPlacement,
                  "scaleBarPlacement",
                  handleChange,
                  !includeScaleBar
                )}
              </FormControl>
            </Grid>
          </Grid>
          <Grid item xs={12} className={classes.formControl}>
            <Grid item xs={6} style={{ paddingRight: 10 }}>
              <FormControl fullWidth={true}>
                <InputLabel htmlFor="includeLogo">Inkludera logotyp</InputLabel>
                {this.renderIncludeSelect(
                  includeLogo,
                  "includeLogo",
                  handleChange
                )}
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth={true}>
                <InputLabel htmlFor="logoPlacement">Placering</InputLabel>
                {this.renderPlacementSelect(
                  logoPlacement,
                  "logoPlacement",
                  handleChange,
                  !includeLogo
                )}
              </FormControl>
            </Grid>
          </Grid>
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
