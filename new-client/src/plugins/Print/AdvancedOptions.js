import React from "react";
import Grid from "@mui/material/Grid";
import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";
import {
  Badge,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Popover,
  Tooltip,
  IconButton,
  InputAdornment,
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import { TwitterPicker as ColorPicker } from "react-color";

const Root = styled(Grid)(() => ({
  display: "flex",
  flexWrap: "wrap",
}));

const FormControlContainer = styled(Grid)(({ theme }) => ({
  margin: theme.spacing(1),
  width: "100%",
  display: "flex",
}));

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

  placementOverlaps = {
    northArrow: false,
    scaleBar: false,
    logoType: false,
  };

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

  allowBottomRightPlacement = () => {
    if (
      (this.props.options.copyright ?? "").length > 0 ||
      (this.props.options.disclaimer ?? "").length > 0
    ) {
      // no! This placement is now reserved for copyright and/or disclaimer.
      return false;
    }
    return true;
  };

  // Method for checking if any placement values are overlapping
  hasPlacementOverlap() {
    // We want to check if the selections are set to "Enabled", otherwise they are set to
    // "disabled" and cannot overlap.
    const northArrow = this.props.includeNorthArrow
      ? this.props.northArrowPlacement
      : "northDisabled";
    const scaleBar = this.props.includeScaleBar
      ? this.props.scaleBarPlacement
      : "scaleDisabled";
    const logo = this.props.includeLogo
      ? this.props.logoPlacement
      : "logoDisabled";

    // We check if any given value is the same as the other two placement values.
    // If so, they are stored as booleans in "placementOverlaps"
    this.placementOverlaps.northArrow =
      northArrow === scaleBar || northArrow === logo;
    this.placementOverlaps.scaleBar =
      scaleBar === northArrow || scaleBar === logo;
    this.placementOverlaps.logoType = logo === northArrow || logo === scaleBar;

    // If any placement values are the same we return true and use it to display
    // error-message in render()
    return (
      this.placementOverlaps.northArrow ||
      this.placementOverlaps.scaleBar ||
      this.placementOverlaps.logoType
    );
  }

  renderPlacementSelect = (value, name, changeHandler, disabled) => {
    return (
      <Select
        variant="standard"
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
        {this.allowBottomRightPlacement() && (
          <MenuItem value={"bottomRight"}>Nere till höger</MenuItem>
        )}
        <MenuItem value={"bottomLeft"}>Nere till vänster</MenuItem>
      </Select>
    );
  };

  renderIncludeSelect = (value, name, changeHandler) => {
    return (
      <Select
        variant="standard"
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
    let showOverlapWarning = this.hasPlacementOverlap();
    const {
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
      printOptionsOk,
    } = this.props;
    return (
      <>
        <Root>
          <FormControlContainer item xs={12}>
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
                      <Badge
                        sx={{
                          "& .MuiBadge-dot": {
                            backgroundColor: this.props.mapTextColor,
                          },
                        }}
                        badgeContent=" "
                        variant="dot"
                      >
                        <Tooltip
                          disableInteractive
                          title="Titelfärg påverkar inte kartans etiketter utan styr endast färgen för kringliggande texter, så som titel, copyrighttext, etc."
                        >
                          <IconButton
                            id="mapTextColor"
                            onClick={this.toggleColorPicker}
                            sx={{ marginRight: 0.5 }}
                            edge="start"
                            size="small"
                          >
                            <PaletteIcon />
                          </IconButton>
                        </Tooltip>
                      </Badge>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </FormControlContainer>
          <FormControlContainer item xs={12}>
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
          </FormControlContainer>
          <FormControlContainer item xs={12}>
            <FormControl fullWidth={true} error={!printOptionsOk}>
              <InputLabel variant="standard" htmlFor="resolution">
                Upplösning (DPI)
              </InputLabel>
              <Select
                variant="standard"
                value={resolution}
                onChange={handleChange}
                inputProps={{
                  name: "resolution",
                  id: "resolution",
                }}
              >
                {this.props.options.dpis.map((value, index) => {
                  return (
                    <MenuItem key={"dpis_" + index} value={value}>
                      {value}
                    </MenuItem>
                  );
                })}
              </Select>
              {!printOptionsOk && (
                <FormHelperText>
                  Bilden kommer inte kunna skrivas ut korrekt. Testa med en
                  lägre upplösning eller mindre skala.
                </FormHelperText>
              )}
            </FormControl>
          </FormControlContainer>
          <FormControlContainer container item>
            <Grid item xs={6} sx={{ paddingRight: "10px" }}>
              <FormControl fullWidth={true}>
                <InputLabel variant="standard" htmlFor="includeNorthArrow">
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
              <FormControl
                fullWidth={true}
                error={this.placementOverlaps.northArrow}
              >
                <InputLabel variant="standard" htmlFor="northArrowPlacement">
                  Placering
                </InputLabel>
                {this.renderPlacementSelect(
                  northArrowPlacement,
                  "northArrowPlacement",
                  handleChange,
                  !includeNorthArrow
                )}
              </FormControl>
            </Grid>
          </FormControlContainer>
          <FormControlContainer container item>
            <Grid item xs={6} sx={{ paddingRight: "10px" }}>
              <FormControl fullWidth={true}>
                <InputLabel variant="standard" htmlFor="includeScaleBar">
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
              <FormControl
                fullWidth={true}
                error={this.placementOverlaps.scaleBar}
              >
                <InputLabel variant="standard" htmlFor="scaleBarPlacement">
                  Placering
                </InputLabel>
                {this.renderPlacementSelect(
                  scaleBarPlacement,
                  "scaleBarPlacement",
                  handleChange,
                  !includeScaleBar
                )}
              </FormControl>
            </Grid>
          </FormControlContainer>
          <FormControlContainer container item>
            <Grid item xs={6} sx={{ paddingRight: "10px" }}>
              <FormControl fullWidth={true}>
                <InputLabel variant="standard" htmlFor="includeLogo">
                  Inkludera logotyp
                </InputLabel>
                {this.renderIncludeSelect(
                  includeLogo,
                  "includeLogo",
                  handleChange
                )}
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl
                fullWidth={true}
                error={this.placementOverlaps.logoType}
              >
                <InputLabel variant="standard" htmlFor="logoPlacement">
                  Placering
                </InputLabel>
                {this.renderPlacementSelect(
                  logoPlacement,
                  "logoPlacement",
                  handleChange,
                  !includeLogo
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              {showOverlapWarning && (
                <FormHelperText error={true}>
                  Bilden kommer inte kunna skrivas ut korrekt. Placeringsvalen
                  överlappar.
                </FormHelperText>
              )}
            </Grid>
          </FormControlContainer>
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
        </Root>
      </>
    );
  }
}

export default withSnackbar(AdvancedOptions);
