import React from "react";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import Input from "@mui/material/Input";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import NativeSelect from "@mui/material/NativeSelect";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Button, FormHelperText, Typography } from "@mui/material";
import Chip from "@mui/material/Chip";

const StyledGrid = styled(Grid)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(1),
}));

class AttributeEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formValues: undefined,
      feature: undefined,
    };
    this.formErrors = {};
    props.observer.subscribe("feature-to-update-view", (feature) => {
      this.setState({
        formValues: this.initFormValues(feature),
        feature: feature,
      });
    });
    props.editSource?.editableFields?.forEach((field, i) => {
      field.initialRender = true;
    });

    props.editSource?.nonEditableFields?.forEach((field, i) => {
      field.initialRender = true;
    });
  }

  componentWillUnmount() {
    this.props.observer.unsubscribe("feature-to-update-view");
  }

  initFormValues = (feature) => {
    const { editSource } = this.props;
    if (!feature || !editSource) return;

    const featureProps = feature.getProperties();
    let valueMap = {};

    editSource.editableFields.forEach((field) => {
      if (featureProps[field.name] !== null) {
        if (field.textType === "flerval" && featureProps[field.name] !== "") {
          valueMap[field.name] = field.values.map((value) => {
            return {
              name: value,
              checked:
                typeof featureProps[field.name] === "string"
                  ? featureProps[field.name]
                      .split(";")
                      .find((v) => v === value) !== undefined
                  : false,
            };
          });
        } else if (field.textType === "boolean") {
          if (field.dataType === "boolean") {
            valueMap[field.name] =
              featureProps[field.name] || field.defaultValue === "ja" || false;
          } else {
            valueMap[field.name] =
              featureProps[field.name] || field.defaultValue === 1 || 0;
          }
        } else {
          //If the feature has field: "" it will be changed to the default value.
          //Not sure if we want this behavior?
          //QGIS-server, object that returns as a string results in [object] [Object]
          featureProps[field.name]?.["xsi:nil"] === "true"
            ? (valueMap[field.name] = "")
            : (valueMap[field.name] =
                featureProps[field.name] || field.defaultValue || "");
        }
      }
    });
    return valueMap;
  };

  updateFeature() {
    const featureProps = this.props.model.editFeature.getProperties();
    Object.keys(this.state.formValues).forEach((key) => {
      let value = this.state.formValues[key];
      if (value === "") value = null;
      if (Array.isArray(value)) {
        value = value
          .filter((v) => v.checked)
          .map((v) => v.name)
          .join(";");
      }
      featureProps[key] = value;
    });

    this.props.editSource?.nonEditableFields?.forEach((field) => {
      let value = field.defaultValue;
      if (value === "") value = null;
      if (Array.isArray(value)) {
        value = value
          .filter((v) => v.checked)
          .map((v) => v.name)
          .join(";");
      }
      let geomName = this.props.model.editFeature.getGeometryName();
      if (!geomName) {
        geomName = "geom";
      }
      if (field.name !== geomName) {
        // should not overwrite the feature's geom
        featureProps[field.name] = value;
      }
    });
    this.props.model.editFeature.setProperties(featureProps);
  }

  checkInteger(name, value) {
    let formValues = Object.assign({}, this.state.formValues);
    if (/^\d+$/.test(value) || value === "") {
      formValues[name] = value;
    } else {
      if (!this.state.formValues[name]) {
        formValues[name] = "";
      }
    }
    this.setState(
      {
        formValues: formValues,
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkBoolean(name, value) {
    let formValues = Object.assign({}, this.state.formValues);
    if (value === "ja") {
      value = true;
    } else if (value === "nej") {
      value = false;
    }

    formValues[name] = value;
    this.setState(
      {
        formValues: formValues,
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkNumber(name, value) {
    let formValues = Object.assign({}, this.state.formValues);
    if (/^\d+([.,](\d+)?)?$/.test(value) || value === "") {
      value = value.replace(",", ".");
      formValues[name] = value;
    } else {
      if (!this.state.formValues[name]) {
        formValues[name] = "";
      }
    }
    this.setState(
      {
        formValues: formValues,
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkUrl(name, value) {
    let regex =
      /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|\/|\?)*)?$/i;
    let valid = regex.test(value);
    let formValues = Object.assign({}, this.state.formValues);
    if (valid || value === "") {
      formValues[name] = value;
      delete this.formErrors[name];
    } else {
      formValues[name] = "";
      this.formErrors[name] =
        "Ange en giltig url. t.ex. https://www.example.com";
    }
    this.setState(
      {
        formValues: formValues,
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkText(name, value) {
    let formValues = Object.assign({}, this.state.formValues);
    formValues[name] = value;
    this.setState(
      {
        formValues: formValues,
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkSelect(name, value) {
    let formValues = Object.assign({}, this.state.formValues);
    formValues[name] = value;
    this.setState(
      {
        formValues: formValues,
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkMultiple(name, checked, value, index) {
    let formValues = Object.assign({}, this.state.formValues);
    formValues[name][index].checked = checked;
    this.setState(
      {
        formValues: formValues,
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkDate(name, date) {
    let formValues = Object.assign({}, this.state.formValues);
    formValues[name] = date;
    this.updateFeature();
    this.setState(
      {
        formValues: formValues,
      },
      () => {
        this.updateFeature();
      }
    );
  }

  setChanged() {
    if (
      this.props.model.editFeature.modification !== "added" &&
      this.props.model.editFeature.modification !== "removed"
    ) {
      this.props.model.editFeature.modification = "updated";
    }
  }

  getValueMarkup(field, editable) {
    if (typeof field.alias === "undefined" || field.alias === "") {
      field.alias = field.name;
    }

    // Add a default texttype if none is set
    if (!field.textType || field.textType === "") {
      if (field.dataType === "int" || field.dataType === "integer") {
        field.textType = "heltal";
      }

      if (field.dataType === "number" || field.dataType === "decimal") {
        field.textType = "nummer";
      }

      if (field.dataType === "date") {
        field.textType = "datum";
      }

      if (field.dataType === "date-time" || field.dataType === "dateTime") {
        field.textType = "date-time";
      }

      if (field.dataType === "boolean") {
        field.textType = "boolean";
      }
    }
    let value = this.state.formValues[field.name];

    if (value === undefined || value === null) {
      value = "";
    }

    if (value === "" && field.initialRender) {
      if (field.defaultValue !== null) {
        value = field.defaultValue;
      }
    }

    if (field.name === "SURVEYID" && field.initialRender) {
      value = this.props.surveyname.enkatnamn;
    }

    if (field.name === "SURVEYANSWERID" && field.initialRender) {
      value = this.props.surveyname.svarsID;
    }

    switch (field.textType) {
      case "heltal":
        return (
          <TextField
            id={field.id}
            label={field.alias}
            fullWidth={true}
            margin="normal"
            variant="outlined"
            disabled={!editable}
            value={value}
            error={this.formErrors.hasOwnProperty(field.name)}
            helperText={
              this.formErrors[field.name]?.length >= 0
                ? this.formErrors[field.name]
                : field.description
            }
            onChange={(e) => {
              this.setChanged();
              this.checkInteger(field.name, e.target.value);
              field.initialRender = false;
            }}
          />
        );
      case "nummer":
        return (
          <TextField
            id={field.id}
            label={field.alias}
            fullWidth={true}
            margin="normal"
            variant="outlined"
            disabled={!editable}
            value={value}
            error={this.formErrors.hasOwnProperty(field.name)}
            helperText={
              this.formErrors[field.name]?.length >= 0
                ? this.formErrors[field.name]
                : field.description
            }
            onChange={(e) => {
              this.setChanged();
              this.checkNumber(field.name, e.target.value);
              field.initialRender = false;
            }}
          />
        );
      case "datum":
        return (
          <TextField
            id={field.id}
            label={field.alias}
            fullWidth={true}
            margin="normal"
            type="date"
            variant="outlined"
            disabled={!editable}
            value={value}
            error={this.formErrors.hasOwnProperty(field.name)}
            helperText={
              this.formErrors[field.name]?.length >= 0
                ? this.formErrors[field.name]
                : field.description
            }
            onChange={(e) => {
              this.setChanged();
              this.checkDate(field.name, e.target.value);
              field.initialRender = false;
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        );
      case "date-time":
        return (
          <TextField
            id={field.id}
            label={field.alias || field.name}
            fullWidth={true}
            margin="normal"
            type="datetime-local"
            variant="outlined"
            disabled={!editable}
            value={value}
            error={this.formErrors.hasOwnProperty(field.name)}
            helperText={
              this.formErrors[field.name]?.length >= 0
                ? this.formErrors[field.name]
                : field.description
            }
            onChange={(e) => {
              this.setChanged();
              this.checkDate(field.name, e.target.value);
              field.initialRender = false;
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        );
      case "url":
        return (
          <>
            <TextField
              id={field.id}
              label={field.alias}
              size="small"
              fullWidth={true}
              margin="normal"
              variant="outlined"
              disabled={!editable}
              error={this.formErrors.hasOwnProperty(field.name)}
              helperText={
                this.formErrors[field.name]?.length >= 0
                  ? this.formErrors[field.name]
                  : field.description
              }
              value={value}
              onChange={(e) => {
                this.setChanged();
                this.checkText(field.name, e.target.value);
                field.initialRender = false;
              }}
              onBlur={(e) => {
                this.setChanged();
                if (field.textType === "url") {
                  this.checkUrl(field.name, e.target.value);
                }
                field.initialRender = false;
              }}
            />
          </>
        );
      case "fritext":
        return (
          <>
            <TextField
              id={field.id}
              label={field.alias}
              size="small"
              fullWidth={true}
              margin="normal"
              variant="outlined"
              disabled={!editable}
              multiline
              error={this.formErrors.hasOwnProperty(field.name)}
              helperText={
                this.formErrors[field.name]?.length >= 0
                  ? this.formErrors[field.name]
                  : field.description
              }
              value={value}
              onChange={(e) => {
                this.setChanged();
                this.checkText(field.name, e.target.value);
                field.initialRender = false;
              }}
              onBlur={(e) => {
                this.setChanged();
                if (field.textType === "url") {
                  this.checkUrl(field.name, e.target.value);
                }
                field.initialRender = false;
              }}
            />
          </>
        );
      case "flerval":
        let defaultValues = [];
        if (typeof field.defaultValue === "string") {
          defaultValues = field.defaultValue.split(",");
        }
        if (field.initialRender) {
          defaultValues.forEach((defaultValue) => {
            value.forEach((val) => {
              if (defaultValue === val.name) {
                val.checked = true;
              }
            });
          });
        }

        let checkboxes = field.values.map((val, i) => {
          let id = field.name + i,
            item = value.find((item) => item.name === val) || {
              checked: false,
            };

          return (
            <FormControlLabel
              key={id}
              control={
                <Checkbox
                  checked={item.checked}
                  disabled={!editable}
                  color="primary"
                  onChange={(e) => {
                    this.setChanged();
                    this.checkMultiple(field.name, e.target.checked, val, i);
                    field.initialRender = false;
                  }}
                />
              }
              label={val}
            />
          );
        });
        return (
          <>
            <FormControl fullWidth margin="normal" component="fieldset">
              <FormLabel component="legend">{field.alias}</FormLabel>
              <FormGroup>{checkboxes}</FormGroup>
              <FormHelperText
                style={{ marginTop: "0px", marginBottom: "10px" }}
              ></FormHelperText>
            </FormControl>
            <br />
          </>
        );
      case "lista":
        let options = null;
        if (Array.isArray(field.values)) {
          options = field.values.map((val, i) => (
            <option key={i} value={val}>
              {val}
            </option>
          ));
        }
        return (
          <>
            <FormControl fullWidth={true} component="fieldset">
              <FormLabel component="legend">{field.alias}</FormLabel>
              <NativeSelect
                value={value}
                variant="outlined"
                disabled={!editable}
                input={<Input name={field.name} id={field.name} />}
                onChange={(e) => {
                  this.setChanged();
                  this.checkSelect(field.name, e.target.value);
                  field.initialRender = false;
                }}
              >
                <option value="" disabled>
                  -Välj värde-
                </option>
                {options}
              </NativeSelect>
              <FormHelperText>{field.description}</FormHelperText>
            </FormControl>
          </>
        );
      case "boolean":
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={
                  (field.dataType === "boolean" && field.value === "ja") ||
                  (field.dataType === "int" && field.value === 1)
                }
                color="primary"
                disabled={!editable}
                onChange={(e) => {
                  this.setChanged();
                  if (e.target.checked) {
                    if (field.dataType === "boolean") {
                      field.value = "ja";
                    } else {
                      field.value = 1;
                    }
                  } else {
                    if (field.dataType === "boolean") {
                      field.value = "nej";
                    } else {
                      field.value = 0;
                    }
                  }
                  field.initialRender = false;
                  this.checkBoolean(field.name, field.value);
                  this.forceUpdate();
                }}
              />
            }
            label={field.alias || field.name}
          />
        );
      case null:
        return <span>{value}</span>;
      default:
        return <span>{value}</span>;
    }
  }

  render() {
    const { formValues } = this.state;
    const { model } = this.props;

    // If no source is selected, don't render anything
    if (
      (!formValues && this.props.editSource?.simpleEditWorkflow !== true) ||
      this.props.editSource === undefined
    )
      return null;

    // If source is selected and the source does not allow editing the
    // geometries, it means that we're in a "Simple Edit mode". If so,
    // let's render a label that tells user to click on a feature to start
    // editing its attributes.
    if (!formValues && this.props.editSource?.simpleEditWorkflow === true)
      return (
        <Typography>
          Klicka på ett objekt i kartan för att redigera dess attribut
        </Typography>
      );

    const markup = this.props.editSource?.editableFields?.map((field, i) => {
      const valueMarkup = this.getValueMarkup(field, true);
      return (
        <Grid item xs={12} key={i} ref={field.name} sx={{ textAlign: "left" }}>
          {valueMarkup}
        </Grid>
      );
    });

    const markupNonEdit = this.props.editSource?.nonEditableFields
      ?.filter((item) => item.hidden === false)
      .map((field, i) => {
        const valueMarkup = this.getValueMarkup(field, false);
        return (
          <Grid item xs={12} key={i} ref={field.name}>
            {valueMarkup}
          </Grid>
        );
      });

    return (
      <>
        <StyledGrid item xs={12}>
          <Chip
            variant="outlined"
            color="primary"
            label="Ange objektets attribut:"
          />
        </StyledGrid>
        <StyledGrid item xs={12}>
          <p>Editerbara fält:</p>
          {markup}
          {markupNonEdit?.length > 2 ? "Icke-editerbara fält:" : ""}
          {markupNonEdit}
        </StyledGrid>
        <StyledGrid item xs={12}>
          <Button
            color="primary"
            sx={{ width: "100px" }}
            variant="contained"
            onClick={model.resetEditFeature}
          >
            OK
          </Button>
        </StyledGrid>
      </>
    );
  }
}

export default AttributeEditor;
