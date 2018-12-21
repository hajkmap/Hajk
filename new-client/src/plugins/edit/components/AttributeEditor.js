import React from "react";
import { MuiPickersUtilsProvider } from "material-ui-pickers";
import DateFnsUtils from "@date-io/date-fns";
import { DateTimePicker } from "material-ui-pickers";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({});

class AttributeEditor extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      disabled: true,
      formValues: {}
    };
  }

  componentDidMount() {
    this.props.observer.on("editFeature", attr => {
      var valueMap = {},
        feature = this.props.model.get("editFeature"),
        source = this.props.model.get("editSource"),
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
        formValues: this.state.formValues
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
        formValues: this.state.formValues
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
    } else {
      formValues[name] = "";
      // TODO: present show info about the error;s
    }
    this.setState(
      {
        formValues: this.state.formValues
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
        formValues: this.state.formValues
      },
      () => {
        this.updateFeature();
      }
    );
  }

  checkDate(name, date) {
    var value = "";
    if (date.format) {
      value = date.format("Y-MM-DD HH:mm:ss");
    } else {
      value = date;
    }
    var formValues = Object.assign({}, this.state.formValues);
    formValues[name] = value;
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

  getValueMarkup(field) {
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

    if (value === "" && field.initialRender) {
      value = field.defaultValue;
      // var formValues = Object.assign({}, this.state.formValues);
      // formValues[field.name] = value;
      // this.setState({
      //   formValues: formValues
      // });
    }

    switch (field.textType) {
      case "heltal":
        return (
          <input
            className="form-control"
            type="text"
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
          <input
            className="form-control"
            type="text"
            value={value}
            onChange={e => {
              this.setChanged();
              this.checkNumber(field.name, e.target.value);
              field.initialRender = false;
            }}
          />
        );
      case "datum":
        if (typeof value === "string") {
          value = value.replace("T", " ").replace("Z", "");
        }
        return (
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <DateTimePicker
              value={value}
              onChange={date => {
                this.checkDate(date);
              }}
            />
          </MuiPickersUtilsProvider>
        );
      case "url":
      case "fritext":
        return (
          <input
            className="form-control"
            type="text"
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
            <div key={i}>
              <input
                type="checkbox"
                id={id}
                checked={item.checked}
                onChange={e => {
                  this.setChanged();
                  this.checkMultiple(field.name, e.target.checked, val, i);
                  field.initialRender = false;
                }}
              />
              <label htmlFor={id}>{val}</label>
            </div>
          );
        });
        return <div>{checkboxes}</div>;
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
          <select
            className="form-control"
            value={value}
            onChange={e => {
              this.setChanged();
              this.checkSelect(field.name, e.target.value);
              field.initialRender = false;
            }}
          >
            <option value="">-Välj värde-</option>
            {options}
          </select>
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
      var value = this.getValueMarkup(field);
      this.updateFeature();
      return (
        <div key={i} ref={field.name} className="field">
          <div>{field.name}</div>
          <div>{value}</div>
        </div>
      );
    });

    return <div>{markup}</div>;
  }
}

export default withStyles(styles)(AttributeEditor);
