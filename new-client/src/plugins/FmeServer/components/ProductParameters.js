import React from "react";
import { Grid, IconButton, TextField, Typography } from "@material-ui/core";
import { FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { Slider } from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";

import InformationWrapper from "./InformationWrapper";
import ListBoxSelector from "./ListBoxSelector";

// All parameters will be checked against an array of allowed
// parameter types to make sure that the parameter type is supported in the renderer.
import { ALLOWED_FME_PARAMETERS } from "../constants";

const ProductParameters = (props) => {
  // We're gonna need the model for some shared methods
  const { model } = props;

  // Checks wether all parameters can be rendered or not.
  // A parameter cannot be rendered if the parameter type is not
  // included in the allowedFmeTypes-array.
  function allParametersCantBeRendered() {
    return props.parameters.some((parameter) => {
      return !ALLOWED_FME_PARAMETERS.includes(parameter.type);
    });
  }

  // Checks wether there are no parameters to render or not.
  function noParametersToRender() {
    return props.parameters.length === 0;
  }

  // When the parameters change, we must make sure to
  // set the updated value on the corresponding parameter.
  function handleParameterChange(value, index) {
    const { parameters } = props;
    parameters[index].value = value;
    props.setProductParameters(parameters);
    return;
  }

  // Checks wether the infoUrl from props is valid
  // (A string that is not empty).
  function infoUrlIsValid() {
    return props.infoUrl?.length > 0;
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

  function renderInformationUrl() {
    return (
      <Grid container item xs={12} wrap="nowrap" justify="space-between">
        <Typography style={{ alignSelf: "center", marginLeft: 8 }}>
          Oklart hur produkten fungerar? Tryck på frågetecknet för mer
          information.
        </Typography>
        <IconButton
          aria-label="Hjälp"
          onClick={() => window.open(props.infoUrl, "_blank")}
        >
          <HelpIcon />
        </IconButton>
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
    const { value, step } = model.getRangeSliderValueAndStep(parameter);
    const sliderMin = model.getRangeSliderMinimum(parameter, step);
    const sliderMax = model.getRangeSliderMaximum(parameter, step);
    return (
      <Grid
        key={`${parameter.type}-${index}`}
        item
        xs={12}
        style={{ padding: 8 }}
      >
        <Grid item xs={12}>
          <Typography variant="caption">{parameter.description}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Slider
            value={value}
            min={sliderMin}
            max={sliderMax}
            step={step}
            marks={[
              { value: sliderMin, label: sliderMin.toString() },
              { value: sliderMax, label: sliderMax.toString() },
            ]}
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
            case "STRING":
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
      {infoUrlIsValid() && renderInformationUrl()}
      {allParametersCantBeRendered() && renderParameterRenderingError()}
      {noParametersToRender() && renderNoParametersToRenderError()}
      {renderParameters()}
    </Grid>
  );
};

export default ProductParameters;
