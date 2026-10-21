import React from "react";
import Grid from "@mui/material/Grid";
import { styled } from "@mui/material/styles";
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
import HajkToolTip from "components/HajkToolTip";
import i18n from "src/i18n";

const Root = styled(Grid)(() => ({
  display: "flex",
  flexWrap: "wrap",
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  margin: theme.spacing(1),
  width: "100%",
}));

// Not translated: a scale notation and file formats.
const SCALE_PREFIX = "1:";
const SAVE_AS_TYPES = ["PDF", "PNG"];

class GeneralOptions extends React.PureComponent {
  state = {
    useCustomScale: false,
  };

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
        <MenuItem value={true}>{i18n.t("common.yes")}</MenuItem>
        <MenuItem value={false}>{i18n.t("common.no")}</MenuItem>
      </Select>
    );
  };

  renderTextIconInMarginsSelector = () => {
    const { useMargin, useTextIconsInMargin, handleChange } = this.props;
    return (
      <Select
        variant="standard"
        value={useTextIconsInMargin}
        onChange={handleChange}
        disabled={!useMargin}
        inputProps={{
          name: "useTextIconsInMargin",
          id: "useTextIconsInMargin",
        }}
      >
        <MenuItem value={true}>{i18n.t("common.yes")}</MenuItem>
        <MenuItem value={false}>{i18n.t("common.no")}</MenuItem>
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
        <MenuItem value={"landscape"}>{i18n.t("print.landscape")}</MenuItem>
        <MenuItem value={"portrait"}>{i18n.t("print.portrait")}</MenuItem>
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
      { value: "CUSTOM_SCALE", label: i18n.t("print.customScale") },
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
        startAdornment={
          <InputAdornment position="start">{SCALE_PREFIX}</InputAdornment>
        }
        endAdornment={
          <InputAdornment position="end">
            <HajkToolTip title={i18n.t("print.showPredefinedScales")}>
              <IconButton
                aria-label={i18n.t("print.showPredefinedScales")}
                onClick={this.handleDisableCustomScaleInput}
              >
                <FormatListNumberedIcon />
              </IconButton>
            </HajkToolTip>
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
        {SAVE_AS_TYPES.map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
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
              {i18n.t("print.format")}
            </InputLabel>
            {this.renderPaperSizeSelector()}
          </StyledFormControl>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="useMargin">
              {i18n.t("print.useMargin")}
            </InputLabel>
            {this.renderUseMarginSelector()}
          </StyledFormControl>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="useMargin">
              {i18n.t("print.textInMargins")}
            </InputLabel>
            {this.renderTextIconInMarginsSelector()}
          </StyledFormControl>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="orientation">
              {i18n.t("print.orientation")}
            </InputLabel>
            {this.renderOrientationSelector()}
          </StyledFormControl>
          <StyledFormControl error={!printOptionsOk}>
            <InputLabel variant="standard" htmlFor="scale">
              {i18n.t("print.scale")}
            </InputLabel>
            {this.state.useCustomScale
              ? this.renderScaleInput()
              : this.renderScaleSelector()}
            {!printOptionsOk && (
              <FormHelperText>{i18n.t("print.cannotPrint")}</FormHelperText>
            )}
          </StyledFormControl>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="saveAsType">
              {i18n.t("print.saveAs")}
            </InputLabel>
            {this.renderSaveAsTypeSelector()}
          </StyledFormControl>
        </Root>
      </>
    );
  }
}

export default GeneralOptions;
