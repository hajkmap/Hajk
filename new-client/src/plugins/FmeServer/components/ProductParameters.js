import React from "react";
import { Grid, TextField, Typography } from "@material-ui/core";
import { FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import Slider from "@material-ui/core/Slider";

import InformationWrapper from "./InformationWrapper";
import ListBoxSelector from "./ListBoxSelector";

const ProductParameters = (props) => {
  const allowedFmeTypes = [
    "CHOICE",
    "LOOKUP_CHOICE",
    "LISTBOX",
    "LOOKUP_LISTBOX",
    "RANGE_SLIDER",
    "PASSWORD",
    "TEXT",
  ];

  // Checks wether all parameters can be rendered or not.
  // A parameter cannot be rendered if the parameter type is not
  // included in the allowedFmeTypes-array.
  function allParametersCantBeRendered() {
    return props.parameters.some((parameter) => {
      return !allowedFmeTypes.includes(parameter.type);
    });
  }

  // Checks wether there are no parameters to render or not.
  function noParametersToRender() {
    return props.parameters.length === 0;
  }

  // Returns a stepSize that corresponds to the supplied decimalPrecision
  // E.g. decimalPrecision: 0 => step: 1,
  //      decimalPrecision: 1 => step: 0.1,
  //      decimalPrecision: 2 => step: 0.01
  function getStepSize(decimalPrecision) {
    // Special case, 0 precision should just return 1
    if (decimalPrecision === 0) {
      return 1;
    }
    // Otherwise we use the padStart string function to create
    // a float with a fitting number of decimals.
    return Number(`0.${"1".padStart(decimalPrecision, "0")}`);
  }

  // Calculates a fitting stepSize and fetches the current value for
  // the range slider.
  function getRangeSliderValueAndStep(parameter) {
    // First we get a stepSize that fits the decimalPrecision supplied
    const step = getStepSize(parameter.decimalPrecision);
    // Then we get the parameter value (that might be set) or return the
    // minimum (or the step over the minimum if that should be excluded).
    const value = parameter.value ?? getRangeSliderMinimum(parameter, step);
    // And return everything
    return { value, step };
  }

  // Returns the range slider minimum or the step above if
  // minimum should be excluded.
  function getRangeSliderMinimum(parameter, step) {
    return parameter.minimumExclusive
      ? parameter.minimum + step
      : parameter.minimum;
  }

  // Returns the range slider maximum or the step below if
  // minimum should be excluded.
  function getRangeSliderMaximum(parameter, step) {
    return parameter.maximumExclusive
      ? parameter.maximum - step
      : parameter.maximum;
  }

  // When the parameters change, we must make sure to
  // set the updated value on the corresponding parameter.
  function handleParameterChange(value, index) {
    const { parameters } = props;
    parameters[index].value = value;
    props.setProductParameters(parameters);
    return;
  }

  function renderParameterRenderingError() {
    return (
      <Grid item xs={12} style={{ padding: 8 }}>
        <InformationWrapper type="error">
          <Typography>
            Observera att vissa publicerade parametrar inte kunde renderas! Det
            är inte säkert att beställningen går att genomföra.
          </Typography>
        </InformationWrapper>
      </Grid>
    );
  }

  function renderNoParametersToRenderError() {
    return (
      <Grid item xs={12} style={{ padding: 8 }}>
        <InformationWrapper type="info">
          <Typography>
            Det finns inga publicerade parametrar att rendera! Du kan fortsätta
            direkt till nästa steg!
          </Typography>
        </InformationWrapper>
      </Grid>
    );
  }

  function renderChoice(parameter, index) {
    return (
      <Grid
        key={`${parameter.type}-${index}`}
        item
        xs={12}
        style={{ padding: 8 }}
      >
        <FormControl fullWidth size="small" required={!parameter.optional}>
          <InputLabel
            variant="outlined"
            id={`fme-lookup-choice-label-${index}`}
          >
            {parameter.description}
          </InputLabel>
          <Select
            labelId={`fme-lookup-choice-label-${index}`}
            id={`fme-lookup-choice-${index}`}
            variant="outlined"
            value={parameter.value ?? parameter.defaultValue ?? ""}
            label={parameter.description}
            onChange={(e) => handleParameterChange(e.target.value, index)}
          >
            {parameter.listOptions.map((option, index) => {
              return (
                <MenuItem key={index} value={option.value}>
                  {option.caption}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>
    );
  }

  function renderListBox(parameter, index) {
    return (
      <ListBoxSelector
        key={`${parameter.type}-${index}`}
        parameter={parameter}
        index={index}
        onChange={handleParameterChange}
      />
    );
  }

  function renderRangeSlider(parameter, index) {
    const { value, step } = getRangeSliderValueAndStep(parameter);
    return (
      <Grid
        key={`${parameter.type}-${index}`}
        item
        xs={12}
        style={{ padding: 8 }}
      >
        <Grid item xs={12}>
          <Typography>{`${parameter.description} (${value})`}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Slider
            value={value}
            min={getRangeSliderMinimum(parameter, step)}
            max={getRangeSliderMaximum(parameter, step)}
            step={step}
            valueLabelDisplay="auto"
            onChange={(e, newValue) => handleParameterChange(newValue, index)}
          />
        </Grid>
      </Grid>
    );
  }

  function renderText(parameter, index) {
    return (
      <Grid
        key={`${parameter.type}-${index}`}
        item
        xs={12}
        style={{ padding: 8 }}
      >
        <TextField
          id={`fme-text-${index}`}
          size="small"
          type={parameter.type === "PASSWORD" ? "password" : "text"}
          required={!parameter.optional}
          label={parameter.description}
          onChange={(e) => handleParameterChange(e.target.value, index)}
          fullWidth
          variant="outlined"
          value={parameter.value ?? parameter.defaultValue ?? ""}
        />
      </Grid>
    );
  }

  function renderParameters() {
    return (
      <Grid container>
        {props.parameters.map((parameter, index) => {
          switch (parameter.type) {
            case "CHOICE":
              return renderChoice(parameter, index);
            case "LOOKUP_CHOICE":
              return renderChoice(parameter, index);
            case "LISTBOX":
              return renderListBox(parameter, index);
            case "LOOKUP_LISTBOX":
              return renderListBox(parameter, index);
            case "RANGE_SLIDER":
              return renderRangeSlider(parameter, index);
            case "TEXT":
            case "PASSWORD":
              return renderText(parameter, index);
            default:
              return null;
          }
        })}
      </Grid>
    );
  }

  return (
    <Grid container>
      {allParametersCantBeRendered() && renderParameterRenderingError()}
      {noParametersToRender() && renderNoParametersToRenderError()}
      {renderParameters()}
    </Grid>
  );
};

export default ProductParameters;
