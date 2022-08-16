import React from "react";
import Grid from "@mui/material/Grid";
import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";
import {
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Input,
} from "@mui/material";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";

const Root = styled(Grid)(() => ({
  display: "flex",
  flexWrap: "wrap",
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  margin: theme.spacing(1),
  width: "100%",
}));

class GeneralOptions extends React.PureComponent {
  state = {
    anchorEl: null,
    useCustomScale: false,
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

  // Handles interaction with the scale-selector. We cannot let the
  // parent handler (handleChange) take care of this on its own since
  // we have an extra vale ("CUSTOM_SCALE") that should not affect the selected
  // scale, but instead update the state so that a scale-input is shown.
  handleScaleSelectChange = (e) => {
    const { handleChange } = this.props;
    const { value } = e.target;
    // If we're not dealing with a custom scale, just update the scale, otherwise
    // update the local state so that the user can set a custom scale.
    value !== "CUSTOM_SCALE"
      ? handleChange(e)
      : this.setState({ useCustomScale: true });
  };

  // Handles when the custom scale input is to be hidden, and the scale-selector
  // is to be shown. We have to make sure to update the scale to the option closest
  // to the current value.
  handleDisableCustomScaleInput = () => {
    const { handleChange, scales, scale } = this.props;
    // First we'll have to grab the closest scale option
    const closestScaleOption = scales.reduce((prev, curr) =>
      Math.abs(curr - scale) < Math.abs(prev - scale) ? curr : prev
    );
    // Then we'll update the scale to that value
    handleChange({ target: { name: "scale", value: closestScaleOption } });
    // And then we'll toggle the scale-input.
    this.setState({ useCustomScale: false });
  };

  renderPaperSizeSelector = () => {
    const { format, handleChange } = this.props;
    return (
      <Select
        variant="standard"
        value={format}
        onChange={handleChange}
        inputProps={{
          name: "format",
          id: "format",
        }}
      >
        {this.props.options.paperFormats.map((value, index) => {
          return (
            <MenuItem key={"paperFormat_" + index} value={value}>
              {value.toUpperCase()}
            </MenuItem>
          );
        })}
      </Select>
    );
  };

  renderUseMarginSelector = () => {
    const { useMargin, handleChange } = this.props;
    return (
      <Select
        variant="standard"
        value={useMargin}
        onChange={handleChange}
        inputProps={{
          name: "useMargin",
          id: "useMargin",
        }}
      >
        <MenuItem value={true}>Ja</MenuItem>
        <MenuItem value={false}>Nej</MenuItem>
      </Select>
    );
  };

  renderOrientationSelector = () => {
    const { orientation, handleChange } = this.props;
    return (
      <Select
        variant="standard"
        value={orientation}
        onChange={handleChange}
        inputProps={{
          name: "orientation",
          id: "orientation",
        }}
      >
        <MenuItem value={"landscape"}>Liggande</MenuItem>
        <MenuItem value={"portrait"}>Stående</MenuItem>
      </Select>
    );
  };

  renderScaleSelector = () => {
    const { model, scales, scale } = this.props;
    // We're gonna have to create a new array with an object for each scale-value.
    // The objects contain the actual scale-value, along with a user-friendly label.
    // For example, scale: 1000, label: 1:1 000
    // We also add the extra option ("CUSTOM_SCALE"), allowing the user to select a
    // a custom scale value.
    const scaleSelectorOptions = [
      ...scales.map((s) => {
        return { value: s, label: model.getUserFriendlyScale(s) };
      }),
      { value: "CUSTOM_SCALE", label: "Ange egen skala..." },
    ];
    return (
      <Select
        variant="standard"
        value={scale}
        onChange={this.handleScaleSelectChange}
        inputProps={{
          name: "scale",
          id: "scale",
        }}
      >
        {scaleSelectorOptions.map((scale, i) => {
          // Note: it is crucial to keep the scale value (in state) divided by 1000 from what is shown to user!
          return (
            <MenuItem key={i} value={scale.value}>
              {scale.label}
            </MenuItem>
          );
        })}
      </Select>
    );
  };

  renderScaleInput = () => {
    return (
      <Input
        value={this.props.scale}
        type="number"
        startAdornment={<InputAdornment position="start">1:</InputAdornment>}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle custom scale selector"
              onClick={this.handleDisableCustomScaleInput}
            >
              <FormatListNumberedIcon />
            </IconButton>
          </InputAdornment>
        }
        inputProps={{
          name: "scale",
          id: "scale",
        }}
        onChange={this.props.handleChange}
      />
    );
  };

  renderSaveAsTypeSelector = () => {
    const { saveAsType, handleChange } = this.props;
    return (
      <Select
        variant="standard"
        value={saveAsType}
        onChange={handleChange}
        inputProps={{
          name: "saveAsType",
          id: "saveAsType",
        }}
      >
        <MenuItem value={"PDF"}>PDF</MenuItem>
        <MenuItem value={"PNG"}>PNG</MenuItem>
      </Select>
    );
  };

  render() {
    const { printOptionsOk } = this.props;
    return (
      <>
        <Root>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="format">
              Format
            </InputLabel>
            {this.renderPaperSizeSelector()}
          </StyledFormControl>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="useMargin">
              Marginaler runt kartbilden
            </InputLabel>
            {this.renderUseMarginSelector()}
          </StyledFormControl>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="orientation">
              Orientering
            </InputLabel>
            {this.renderOrientationSelector()}
          </StyledFormControl>
          <StyledFormControl error={!printOptionsOk}>
            <InputLabel variant="standard" htmlFor="scale">
              Skala
            </InputLabel>
            {this.state.useCustomScale
              ? this.renderScaleInput()
              : this.renderScaleSelector()}
            {!printOptionsOk && (
              <FormHelperText>
                Bilden kommer inte kunna skrivas ut korrekt. Testa med en lägre
                upplösning eller mindre skala.
              </FormHelperText>
            )}
          </StyledFormControl>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="saveAsType">
              Spara som
            </InputLabel>
            {this.renderSaveAsTypeSelector()}
          </StyledFormControl>
        </Root>
      </>
    );
  }
}

export default withSnackbar(GeneralOptions);
