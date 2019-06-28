import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography/Typography";
import Parser from "html2json";
import Button from "@material-ui/core/Button";
import Input from "@material-ui/core/Input";
import TextField from "@material-ui/core/TextField";
import Checkbox from "@material-ui/core/Checkbox";
import NativeSelect from "@material-ui/core/NativeSelect";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import Slide from "@material-ui/core/Slide";
import Toolbar from "./Toolbar.js";

const styles = theme => ({
  button: {
    margin: theme.spacing(1)
  },
  buttonLeft: {
    float: "left",
    margin: theme.spacing(1)
  },
  buttonRight: {
    float: "right",
    margin: theme.spacing(1)
  },
  input: {
    display: "none"
  },
  page: {
    height: "100%"
  },
  pageContent: {
    height: "calc(100% - 60px)",
    overflowX: "hidden",
    borderBottom: "1px solid #ccc"
  },
  buttons: {}
});

class Page extends Component {
  constructor(props) {
    super(props);
    if (props.page.text) {
      var json = Parser.html2json(props.page.text);
      this.state = {
        json: json
      };
      this.formErrors = {};
    }
  }

  getError(field) {
    const { classes } = this.props;
    return this.formErrors.hasOwnProperty(field.name) ? (
      <div className={classes.error}>{this.formErrors[field.name]}</div>
    ) : null;
  }

  checkInteger(name, value) {
    var formValues = Object.assign({}, this.props.model.formValues);
    if (/^\d+$/.test(value) || value === "") {
      formValues[name] = value;
    } else {
      if (!this.props.model.formValues[name]) {
        formValues[name] = "";
      }
    }
    this.props.model.formValues = formValues;
    this.forceUpdate();
  }

  checkNumber(name, value) {
    var formValues = Object.assign({}, this.props.model.formValues);
    if (/^\d+([.,](\d+)?)?$/.test(value) || value === "") {
      value = value.replace(",", ".");
      formValues[name] = value;
    } else {
      if (!this.props.model.formValues[name]) {
        formValues[name] = "";
      }
    }
    this.props.model.formValues = formValues;
    this.forceUpdate();
  }

  checkUrl(name, value) {
    var regex = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|\/|\?)*)?$/i;
    var valid = regex.test(value);
    var formValues = Object.assign({}, this.props.model.formValues);
    if (valid || value === "") {
      formValues[name] = value;
      delete this.formErrors[name];
    } else {
      formValues[name] = "";
      this.formErrors[name] =
        "Ange en giltig url. t.ex. https://www.example.com";
    }
    this.props.model.formValues = formValues;
    this.forceUpdate();
  }

  checkText(name, value) {
    var formValues = Object.assign({}, this.props.model.formValues);
    formValues[name] = value;
    this.props.model.formValues = formValues;
    this.forceUpdate();
  }

  checkSelect(name, value) {
    var formValues = Object.assign({}, this.props.model.formValues);
    formValues[name] = value;
    this.props.model.formValues = formValues;
    this.forceUpdate();
  }

  checkMultiple(name, checked, value, index) {
    var formValues = Object.assign({}, this.props.model.formValues);
    formValues[name][index].checked = checked;
    this.props.model.formValues = formValues;
    this.forceUpdate();
  }

  checkDate(name, date) {
    var formValues = Object.assign({}, this.props.model.formValues);
    formValues[name] = date;
    this.props.model.formValues = formValues;
    this.forceUpdate();
  }

  getValueMarkup(field) {
    const { classes } = this.props;

    if (!field) return null;

    if (field.dataType === "int") {
      field.textType = "heltal";
    }

    if (field.dataType === "number") {
      field.textType = "nummer";
    }

    if (field.dataType === "date") {
      field.textType = "datum";
    }

    var value = this.props.model.formValues[field.name];

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
                this.checkText(field.name, e.target.value);
                field.initialRender = false;
              }}
              onBlur={e => {
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
              if (defaultValue === val.value) {
                val.checked = true;
              }
            });
          });
        }

        let checkboxes = field.values.map((val, i) => {
          var id = field.name + i,
            item = (Array.isArray(value) &&
              value.find(item => item.value === val)) || {
              checked: false
            };

          return (
            <FormControlLabel
              key={id}
              control={
                <Checkbox
                  checked={item.checked}
                  onChange={e => {
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

  getFieldConfig(fieldName) {
    return this.props.serviceConfig.editableFields.find(
      field => field.name === fieldName
    );
  }

  renderFromAttribute(attr) {
    if (attr) {
      if (attr.type && attr.type === "toolbar") {
        return (
          <Toolbar
            ref="toolbar"
            serviceConfig={this.props.serviceConfig}
            observer={this.props.model.observer}
            enabled={true}
            model={this.props.model}
          />
        );
      }
      if (attr.field) {
        return this.getValueMarkup(this.getFieldConfig(attr.field));
      }
    } else {
      return null;
    }
  }

  renderFromJsonDom(json) {
    if (json && json.child) {
      return json.child.map((child, i) => {
        if (child.node === "element") {
          switch (child.tag) {
            case "div":
              return (
                <div key={i}>
                  {this.renderFromAttribute(child.attr)}
                  {this.renderFromJsonDom(child)}
                </div>
              );
            case "h5":
              return (
                <Typography variant="h5" key={i}>
                  {this.renderFromJsonDom(child)}
                </Typography>
              );
            default:
              return null;
          }
        }
        if (child.node === "text") {
          return <span key={i}>{child.text}</span>;
        }
        return null;
      });
    } else {
      return null;
    }
  }

  renderButtons() {
    const { page, numPages, classes, onPrevPage, onNextPage } = this.props;

    const prevButton = (
      <Button
        variant="outlined"
        color="primary"
        className={classes.buttonLeft}
        onClick={() => {
          onPrevPage();
        }}
      >
        <ArrowBackIcon />
      </Button>
    );

    const nextButton = (
      <Button
        variant="outlined"
        color="primary"
        className={classes.buttonRight}
        onClick={() => {
          onNextPage();
        }}
      >
        <ArrowForwardIcon />
      </Button>
    );

    const sendButton = (
      <Button
        variant="outlined"
        color="primary"
        className={classes.buttonRight}
        onClick={() => {
          this.props.model.save(response => {
            console.log(response);
          });
        }}
      >
        Skicka
      </Button>
    );

    if (page.order === numPages - 1) {
      return (
        <div>
          {prevButton}
          {sendButton}
        </div>
      );
    }
    if (page.order > 0 && page.order < numPages - 1) {
      return (
        <div>
          {prevButton}
          {nextButton}
        </div>
      );
    }
    if (page.order === 0) {
      return <div>{nextButton}</div>;
    }

    return null;
  }

  render() {
    const { classes, page } = this.props;
    const { json } = this.state;
    return (
      this.props.active && (
        <div className={classes.page}>
          <div className={classes.pageContent}>
            <Slide
              direction={this.props.direction || "left"}
              in={true}
              mountOnEnter
              unmountOnExit
              className={classes.page}
            >
              <div>
                <Typography variant="h4">{page.header}</Typography>
                <div>{this.renderFromJsonDom(json)}</div>
              </div>
            </Slide>
          </div>
          <div className={classes.buttons}>{this.renderButtons()}</div>
        </div>
      )
    );
  }
}

export default withStyles(styles)(Page);
