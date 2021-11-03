import React from "react";
import { Grid, TextField, Typography } from "@material-ui/core";
import { FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import Slider from "@material-ui/core/Slider";

import InformationWrapper from "./InformationWrapper";

const ProductParameters = (props) => {
  const allowedFmeTypes = [
    "CHOICE",
    "LOOKUP_CHOICE",
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

  // The range slider and it's helper functions
  // are obviously TODO: !
  function getRangeSliderValueAndStep(parameter) {
    if (parameter.decimalPrecision > 0) {
    }
    const value = parameter.value
      ? parameter.decimalPrecision > 0
        ? parseFloat(parameter.value)
        : parseInt(parameter.value)
      : parameter.defaultValue
      ? parameter.decimalPrecision > 0
        ? parseFloat(parameter.defaultValue)
        : parseInt(parameter.defaultValue)
      : parameter.minimum;

    const step = 1;

    return { value, step };
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

  function handleParameterChange(value, index, type) {
    const { parameters } = props;
    // Choice, lookup_choice, and text should all only have
    // a single value, so the same handler should get the job
    // done. Lookup_listbox permits several values, and must be
    // handled separately.
    switch (type) {
      case "CHOICE":
      case "LOOKUP_CHOICE":
      case "PASSWORD":
      case "TEXT":
        parameters[index].value = value;
        props.setProductParameters(parameters);
        return;
      case "LOOKUP_LISTBOX":
        parameters[index].value = value;
        props.setProductParameters(parameters);
        return;
      case "RANGE_SLIDER":
        parameters[index].value = value;
        props.setProductParameters(parameters);
        return;
      default:
        return null;
    }
  }

  function renderChoice(parameter, index) {
    return (
      <Grid key={index} item xs={12} style={{ padding: 8 }}>
        <FormControl fullWidth size="small" required={!parameter.optional}>
          <InputLabel variant="outlined" id="fme-lookup-choice-label">
            {parameter.description}
          </InputLabel>
          <Select
            labelId="fme-lookup-choice-label"
            id={`fme-lookup-choice-${index}`}
            variant="outlined"
            value={parameter.value ?? parameter.defaultValue ?? ""}
            label={parameter.description}
            onChange={(e) =>
              handleParameterChange(e.target.value, index, "LOOKUP_CHOICE")
            }
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

  function renderLookupListbox(parameter, index) {
    return (
      <Grid key={index} item xs={12}>
        <h3>renderLookupListbox</h3>
      </Grid>
    );
  }

  function renderRangeSlider(parameter, index) {
    const { value, step } = getRangeSliderValueAndStep(parameter);
    return (
      <Grid key={index} item xs={12} style={{ padding: 8 }}>
        <Grid item xs={12}>
          <Typography>{`${parameter.description} (${value})`}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Slider
            value={value}
            min={parameter.minimum}
            max={parameter.maximum}
            step={step}
            valueLabelDisplay="auto"
            onChange={(e, newValue) =>
              handleParameterChange(newValue, index, "RANGE_SLIDER")
            }
          />
        </Grid>
      </Grid>
    );
  }

  function renderText(parameter, index) {
    return (
      <Grid key={index} item xs={12} style={{ padding: 8 }}>
        <TextField
          id={`fme-text-${index}`}
          size="small"
          type={parameter.type === "PASSWORD" ? "password" : "text"}
          required={!parameter.optional}
          label={parameter.description}
          onChange={(e) => handleParameterChange(e.target.value, index, "TEXT")}
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
              // TODO: Should be the same as choice? Right!?
              return renderChoice(parameter, index);
            case "LOOKUP_LISTBOX":
              return renderLookupListbox(parameter, index);
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
