import React from "react";
import { Grid, TextField, Typography } from "@material-ui/core";

const ProductParameters = (props) => {
  const allowedFmeTypes = ["CHOICE", "LOOKUP_CHOICE", "LOOKUP_LISTBOX", "TEXT"];

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

  function renderParameterRenderingError() {
    return (
      <Grid item xs={12}>
        <Typography>
          Observera att vissa publicerade parametrar inte kunde renderas! Det är
          inte säkert att beställningen går att genomföra.
        </Typography>
      </Grid>
    );
  }

  function renderNoParametersToRenderError() {
    return (
      <Grid item xs={12}>
        <Typography>
          Observera att vissa publicerade parametrar inte kunde renderas! Det är
          inte säkert att beställningen går att genomföra.
        </Typography>
      </Grid>
    );
  }

  function handleParameterChange(e, index, type) {
    const { parameters } = props;
    if (type === "TEXT") {
      parameters[index].value = e.target.value;
      props.setProductParameters(parameters);
    }
  }

  function renderChoice(parameter, index) {
    return (
      <Grid key={index} item xs={12}>
        <h3>CHOICE</h3>
      </Grid>
    );
  }

  function renderLookupChoice(parameter, index) {
    return (
      <Grid key={index} item xs={12}>
        <h3>renderLookupChoice</h3>
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

  function renderText(parameter, index) {
    return (
      <Grid key={index} item xs={12} style={{ padding: 8 }}>
        <TextField
          size="small"
          label={parameter.description}
          onChange={(e) => handleParameterChange(e, index, "TEXT")}
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
              return renderLookupChoice(parameter, index);
            case "LOOKUP_LISTBOX":
              return renderLookupListbox(parameter, index);
            case "TEXT":
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
