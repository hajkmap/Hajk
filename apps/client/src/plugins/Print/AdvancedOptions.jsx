import React from "react";
import Grid from "@mui/material/Grid";
import { styled } from "@mui/material/styles";
import {
  Badge,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Popover,
  IconButton,
  InputAdornment,
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import { TwitterPicker as ColorPicker } from "react-color";
import HajkToolTip from "components/HajkToolTip";
import { MAP_TEXT_AVAILABLE_COLORS } from "./constants";
import i18n from "src/i18n";

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

  placementOverlaps = {
    northArrow: false,
    scaleBar: false,
    logoType: false,
    qrCode: false,
  };

  toggleColorPicker = (e) => {
    this.setState({ anchorEl: e.currentTarget });
  };

  hideColorPicker = (_e) => {
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
    const qrCode = this.props.includeQrCode
      ? this.props.qrCodePlacement
      : "qrCodeDisabled";

    // We check if any given value is the same as the other two placement values.
    // If so, they are stored as booleans in "placementOverlaps"
    this.placementOverlaps.northArrow =
      northArrow === scaleBar || northArrow === logo || northArrow === qrCode;
    this.placementOverlaps.scaleBar =
      scaleBar === northArrow || scaleBar === logo || scaleBar === qrCode;
    this.placementOverlaps.logoType =
      logo === northArrow || logo === scaleBar || logo === qrCode;
    this.placementOverlaps.qrCode =
      qrCode === northArrow || qrCode === scaleBar || qrCode === logo;

    // If any placement values are the same we return true and use it to display
    // error-message in render()
    return (
      this.placementOverlaps.northArrow ||
      this.placementOverlaps.scaleBar ||
      this.placementOverlaps.logoType ||
      this.placementOverlaps.qrCode
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
        <MenuItem value={"topLeft"}>
          {i18n.t("print.placement.topLeft")}
        </MenuItem>
        <MenuItem value={"topRight"}>
          {i18n.t("print.placement.topRight")}
        </MenuItem>
        {this.allowBottomRightPlacement() && (
          <MenuItem value={"bottomRight"}>
            {i18n.t("print.placement.bottomRight")}
          </MenuItem>
        )}
        <MenuItem value={"bottomLeft"}>
          {i18n.t("print.placement.bottomLeft")}
        </MenuItem>
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
        <MenuItem value={true}>{i18n.t("common.yes")}</MenuItem>
        <MenuItem value={false}>{i18n.t("common.no")}</MenuItem>
      </Select>
    );
  };

  render() {
    const showOverlapWarning = this.hasPlacementOverlap();

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
      includeQrCode,
      qrCodePlacement,
      includeLegendsInPdf,
      printOptionsOk,
      saveAsType,
    } = this.props;
    return (
      <>
        <Root>
          <FormControlContainer size={12}>
            <FormControl fullWidth={true}>
              <TextField
                value={mapTitle}
                fullWidth={true}
                onChange={handleChange}
                label={i18n.t("print.optionalTitle")}
                placeholder={i18n.t("print.canBeEmpty")}
                variant="standard"
                slotProps={{
                  input: {
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
                          <HajkToolTip title={i18n.t("print.textColorHint")}>
                            <IconButton
                              id="mapTextColor"
                              onClick={this.toggleColorPicker}
                              sx={{ marginRight: 0.5 }}
                              edge="start"
                              size="small"
                            >
                              <PaletteIcon />
                            </IconButton>
                          </HajkToolTip>
                        </Badge>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </FormControl>
          </FormControlContainer>
          <FormControlContainer size={12}>
            <FormControl fullWidth={true}>
              <TextField
                value={printComment}
                fullWidth={true}
                onChange={handleChange}
                label={i18n.t("print.optionalComment")}
                placeholder={i18n.t("print.canBeEmpty")}
                variant="standard"
                slotProps={{
                  input: {
                    id: "printComment",
                    name: "printComment",
                  },
                }}
              />
            </FormControl>
          </FormControlContainer>
          <FormControlContainer size={12}>
            <FormControl fullWidth={true} error={!printOptionsOk}>
              <InputLabel variant="standard" htmlFor="resolution">
                {i18n.t("print.resolution")}
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
                <FormHelperText>{i18n.t("print.cannotPrint")}</FormHelperText>
              )}
            </FormControl>
          </FormControlContainer>
          <FormControlContainer container>
            <Grid sx={{ paddingRight: "10px" }} size={6}>
              <FormControl fullWidth={true}>
                <InputLabel variant="standard" htmlFor="includeNorthArrow">
                  {i18n.t("print.includeNorthArrow")}
                </InputLabel>
                {this.renderIncludeSelect(
                  includeNorthArrow,
                  "includeNorthArrow",
                  handleChange
                )}
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl
                fullWidth={true}
                error={this.placementOverlaps.northArrow}
              >
                <InputLabel variant="standard" htmlFor="northArrowPlacement">
                  {i18n.t("print.placement.label")}
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
          <FormControlContainer container>
            <Grid sx={{ paddingRight: "10px" }} size={6}>
              <FormControl fullWidth={true}>
                <InputLabel variant="standard" htmlFor="includeScaleBar">
                  {i18n.t("print.includeScaleBar")}
                </InputLabel>
                {this.renderIncludeSelect(
                  includeScaleBar,
                  "includeScaleBar",
                  handleChange
                )}
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl
                fullWidth={true}
                error={this.placementOverlaps.scaleBar}
              >
                <InputLabel variant="standard" htmlFor="scaleBarPlacement">
                  {i18n.t("print.placement.label")}
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
          <FormControlContainer container>
            <Grid sx={{ paddingRight: "10px" }} size={6}>
              <FormControl fullWidth={true}>
                <InputLabel variant="standard" htmlFor="includeLogo">
                  {i18n.t("print.includeLogo")}
                </InputLabel>
                {this.renderIncludeSelect(
                  includeLogo,
                  "includeLogo",
                  handleChange
                )}
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl
                fullWidth={true}
                error={this.placementOverlaps.logoType}
              >
                <InputLabel variant="standard" htmlFor="logoPlacement">
                  {i18n.t("print.placement.label")}
                </InputLabel>
                {this.renderPlacementSelect(
                  logoPlacement,
                  "logoPlacement",
                  handleChange,
                  !includeLogo
                )}
              </FormControl>
            </Grid>
            <Grid size={12}></Grid>
          </FormControlContainer>
          {this.props.enableAppStateInHash && (
            <FormControlContainer container>
              <Grid sx={{ paddingRight: "10px" }} size={6}>
                <FormControl fullWidth={true}>
                  <InputLabel variant="standard" htmlFor="includeQrCode">
                    {i18n.t("print.includeQrCode")}
                  </InputLabel>
                  {this.renderIncludeSelect(
                    includeQrCode,
                    "includeQrCode",
                    handleChange
                  )}
                </FormControl>
              </Grid>
              <Grid size={6}>
                <FormControl
                  fullWidth={true}
                  error={this.placementOverlaps.qrCode}
                >
                  <InputLabel variant="standard" htmlFor="qrCodePlacement">
                    {i18n.t("print.placement.label")}
                  </InputLabel>
                  {this.renderPlacementSelect(
                    qrCodePlacement,
                    "qrCodePlacement",
                    handleChange,
                    !includeQrCode
                  )}
                </FormControl>
              </Grid>
              <Grid size={12}>
                {showOverlapWarning && (
                  <FormHelperText error={true}>
                    {i18n.t("print.placementsOverlap")}
                  </FormHelperText>
                )}
              </Grid>
            </FormControlContainer>
          )}
          {this.props.options.allowLegendsInPdfOutput &&
            saveAsType === "PDF" && (
              <FormControlContainer container>
                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        id="includeLegendsInPdf"
                        name="includeLegendsInPdf"
                        checked={includeLegendsInPdf}
                        onChange={handleChange}
                      />
                    }
                    label={i18n.t("print.includeLegend")}
                  />
                </Grid>
              </FormControlContainer>
            )}
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
              colors={MAP_TEXT_AVAILABLE_COLORS}
              onChangeComplete={this.handleMapTextColorChangeComplete}
            />
          </Popover>
        </Root>
      </>
    );
  }
}

export default AdvancedOptions;
