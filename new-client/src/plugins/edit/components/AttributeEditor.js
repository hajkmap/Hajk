import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Input from "@material-ui/core/Input";
import TextField from "@material-ui/core/TextField";
import Checkbox from "@material-ui/core/Checkbox";
import NativeSelect from "@material-ui/core/NativeSelect";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";

const styles = theme => ({
  container: {
    display: "flex",
    flexWrap: "wrap"
  },
  textField: {
    marginLeft: 0,
    marginRight: 0,
    width: "100%"
  },
  dense: {
    marginTop: 16
  },
  menu: {
    width: 200
  },
  formControl: {
    marginTop: "8px",
    marginBottom: "8px"
  },
  error: {
    color: "rgb(255, 50, 50)",
    backgroundColor: "rgb(255, 150, 150)",
    padding: "5px",
    border: "1px solid rgb(255, 50, 50)",
    borderRadius: "4px"
  }
});

class AttributeEditor extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      disabled: true,
      formValues: {}
    };
    this.formErrors = {};
  }

  componentDidMount() {
    this.props.observer.subscribe("editFeature", attr => {
      var valueMap = {},
        feature = this.props.model.editFeature,
        source = this.props.model.editSource,
        props,
        defaultValue = "";

      if (!feature || !source) return;

      props = feature.getProperties();
      source.editableFields.forEach(field => {
        field.initialRender = true;
        if (field.textType === "flerval") {
          valueMap[field.name] = field.values.map(value => {
            return {
              name: value,
              checked:
                typeof props[field.name] === "string"
                  ? props[field.name].split(";").find(v => v === value) !==
                    undefined
                  : false
            };
          });
        } else {
          valueMap[field.name] = props[field.name] || defaultValue;
        }
      });

      this.setState({
        formValues: valueMap
      });
    });
  }

  updateFeature(formValues) {
    var props = this.props.model.editFeature.getProperties();
    Object.keys(this.state.formValues).forEach(key => {
      var value = this.state.formValues[key];
      if (value === "") value = null;
      if (Array.isArray(value)) {
        value = value
          .filter(v => v.checked)
          .map(v => v.name)
          .join(";");
      }
      props[key] = value;
    });
    this.props.model.editFeature.setProperties(props);
  }

  checkInteger(name, value) {
    var formValues = Object.assign({}, this.state.formValues);
    if (/^\d+$/.test(value) || value === "") {
      formValues[name] = value;
    } else {
      if (!this.state.formValues[name]) {
        formValues[name] = "";
      }
    }
    this.setState(
      {
        formValues: formValues
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkNumber(name, value) {
    var formValues = Object.assign({}, this.state.formValues);
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
        formValues: formValues
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkUrl(name, value) {
    var regex = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|\/|\?)*)?$/i;
    var valid = regex.test(value);
    var formValues = Object.assign({}, this.state.formValues);
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
        formValues: formValues
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkText(name, value) {
    var formValues = Object.assign({}, this.state.formValues);
    formValues[name] = value;
    this.setState(
      {
        formValues: formValues
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkSelect(name, value) {
    var formValues = Object.assign({}, this.state.formValues);
    formValues[name] = value;
    this.setState(
      {
        formValues: formValues
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkMultiple(name, checked, value, index) {
    var formValues = Object.assign({}, this.state.formValues);
    formValues[name][index].checked = checked;
    this.setState(
      {
        formValues: formValues
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkDate(name, date) {
    var formValues = Object.assign({}, this.state.formValues);
    formValues[name] = date;
    this.updateFeature();
    this.setState(
      {
        formValues: formValues
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

  getError(field) {
    const { classes } = this.props;
    return this.formErrors.hasOwnProperty(field.name) ? (
      <div className={classes.error}>{this.formErrors[field.name]}</div>
    ) : null;
  }

  getValueMarkup(field) {
    const { classes } = this.props;
    if (field.dataType === "int") {
      field.textType = "heltal";
    }

    if (field.dataType === "number") {
      field.textType = "nummer";
    }

    if (field.dataType === "date") {
      field.textType = "datum";
    }

    var value = this.state.formValues[field.name];

    if (value === undefined || value === null) {
      value = "";
    }

    if (value === "" && field.initialRender) {
      if (field.defaultValue !== null) {
        value = field.defaultValue;
      }
    }

    switch (field.textType) {
      case "heltal":
        return (
          <TextField
            id={field.id}
            label={field.name}
            className={classes.textField}
            margin="normal"
            variant="outlined"
            value={value}
            onChange={e => {
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
            label={field.name}
            className={classes.textField}
            margin="normal"
            variant="outlined"
            value={value}
            onChange={e => {
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
            label={field.name}
            className={classes.textField}
            type="datetime-local"
            margin="normal"
            variant="outlined"
            value={value}
            onChange={e => {
              this.setChanged();
              this.checkDate(field.name, e.target.value);
              field.initialRender = false;
            }}
            InputLabelProps={{
              shrink: true
            }}
          />
        );
      case "url":
      case "fritext":
        return (
          <>
            <TextField
              id={field.id}
              label={field.name}
              className={classes.textField}
              margin="normal"
              variant="outlined"
              value={value}
              onChange={e => {
                this.setChanged();
                this.checkText(field.name, e.target.value);
                field.initialRender = false;
              }}
              onBlur={e => {
                this.setChanged();
                if (field.textType === "url") {
                  this.checkUrl(field.name, e.target.value);
                }
                field.initialRender = false;
              }}
            />
            {this.getError(field)}
          </>
        );
      case "flerval":
        let defaultValues = [];
        if (typeof field.defaultValue === "string") {
          defaultValues = field.defaultValue.split(",");
        }
        if (field.initialRender) {
          defaultValues.forEach(defaultValue => {
            value.forEach(val => {
              if (defaultValue === val.name) {
                val.checked = true;
              }
            });
          });
        }

        let checkboxes = field.values.map((val, i) => {
          var id = field.name + i,
            item = value.find(item => item.name === val) || { checked: false };

          return (
            <FormControlLabel
              key={id}
              control={
                <Checkbox
                  checked={item.checked}
                  onChange={e => {
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
          <div className={classes.root}>
            <FormControl component="fieldset" className={classes.formControl}>
              <FormLabel component="legend">{field.name}</FormLabel>
              <FormGroup>{checkboxes}</FormGroup>
            </FormControl>
          </div>
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
          <div className={classes.root}>
            <FormControl component="fieldset" className={classes.formControl}>
              <FormLabel component="legend">{field.name}</FormLabel>
              <NativeSelect
                value={value}
                input={<Input name={field.name} id={field.name} />}
                onChange={e => {
                  this.setChanged();
                  this.checkSelect(field.name, e.target.value);
                  field.initialRender = false;
                }}
              >
                <option value="">-Välj värde-</option>
                {options}
              </NativeSelect>
            </FormControl>
          </div>
        );
      case null:
        return <span>{value}</span>;
      default:
        return <span>{value}</span>;
    }
  }

  render() {
    if (!this.props.feature) {
      return null;
    }

    var markup = this.props.source.editableFields.map((field, i) => {
      var valueMarkup = this.getValueMarkup(field);
      this.updateFeature();
      return (
        <div key={i} ref={field.name}>
          {valueMarkup}
        </div>
      );
    });

    return <div>{markup}</div>;
  }
}

export default withStyles(styles)(AttributeEditor);
