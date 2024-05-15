import React, { Component } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Parser from "html2json";
import Button from "@mui/material/Button";
import Input from "@mui/material/Input";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import NativeSelect from "@mui/material/NativeSelect";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Slide from "@mui/material/Slide";
import Toolbar from "./Toolbar.js";
import { withSnackbar } from "notistack";

const PageContent = styled("div")(() => ({
  height: "calc(100% - 60px)",
  overflowX: "hidden",
  borderBottom: "1px solid #ccc",
}));

const PageContentInner = styled("div")(() => ({
  paddingBottom: "10px",
}));

class Page extends Component {
  constructor(props) {
    super(props);
    if (props.page.text) {
      var json = Parser.html2json(props.page.text);
      this.state = {
        json: json,
        displayThankYou: false,
      };
      this.formErrors = {};
    }
  }

  getError(field) {
    return this.formErrors.hasOwnProperty(field.name) ? (
      <div>{this.formErrors[field.name]}</div>
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
    var regex =
      /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|\/|\?)*)?$/i;
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

  getValueMarkup(field, label) {
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

    if (Array.isArray(label)) {
      label = label.join(" ");
    }

    switch (field.textType) {
      case "heltal":
        return (
          <TextField
            id={field.id}
            label={label || field.name}
            sx={{ minWidth: "60%" }}
            margin="normal"
            value={value}
            onChange={(e) => {
              this.checkInteger(field.name, e.target.value);
              field.initialRender = false;
            }}
          />
        );
      case "nummer":
        return (
          <TextField
            id={field.id}
            label={label || field.name}
            sx={{ minWidth: "60%" }}
            margin="normal"
            value={value}
            onChange={(e) => {
              this.checkNumber(field.name, e.target.value);
              field.initialRender = false;
            }}
          />
        );
      case "datum":
        return (
          <TextField
            id={field.id}
            label={label || field.name}
            sx={{ minWidth: "60%" }}
            type="datetime-local"
            margin="normal"
            value={value}
            onChange={(e) => {
              this.checkDate(field.name, e.target.value);
              field.initialRender = false;
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        );
      case "url":
      case "fritext":
        return (
          <>
            <TextField
              id={field.id}
              multiline
              label={label || field.name}
              sx={{ minWidth: "60%" }}
              margin="normal"
              value={value}
              onChange={(e) => {
                this.checkText(field.name, e.target.value);
                field.initialRender = false;
              }}
              onBlur={(e) => {
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
          defaultValues.forEach((defaultValue) => {
            value.forEach((val) => {
              if (defaultValue === val.value) {
                val.checked = true;
              }
            });
          });
        }

        let checkboxes = field.values.map((val, i) => {
          var id = field.name + i,
            item = (Array.isArray(value) &&
              value.find((item) => item.value === val)) || {
              checked: false,
            };

          return (
            <FormControlLabel
              key={id}
              control={
                <Checkbox
                  checked={item.checked}
                  onChange={(e) => {
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
          <div>
            <FormControl component="fieldset">
              <FormLabel component="legend">{label || field.name}</FormLabel>
              <FormGroup>{checkboxes}</FormGroup>
            </FormControl>
          </div>
        );
      case "lista":
        let options = [];
        if (Array.isArray(field.values)) {
          options = field.values.map((val, i) => (
            <option key={i} value={val}>
              {val}
            </option>
          ));
          if (field.defaultValue === undefined || field.defaultValue === "") {
            options.unshift(
              <option key="-1" value="">
                -Välj värde-
              </option>
            );
          }
        }

        if ((!value || value === "") && field.defaultValue) {
          value = field.defaultValue;
          if (field.initialRender !== false) {
            setTimeout(() => {
              this.checkSelect(field.name, value);
            }, 0);
          }
        }

        return (
          <div>
            <FormControl component="fieldset">
              <FormLabel component="legend">{label || field.name}</FormLabel>
              <NativeSelect
                value={value}
                input={<Input name={field.name} id={field.name} />}
                onChange={(e) => {
                  this.checkSelect(field.name, e.target.value);
                  field.initialRender = false;
                }}
              >
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
      (field) => field.name === fieldName
    );
  }

  renderFromAttribute(attr) {
    if (attr) {
      if (attr.type && attr.type === "toolbar") {
        return (
          <Toolbar
            ref="toolbar"
            field={attr.field}
            geotype={attr.geotype}
            serviceConfig={this.props.serviceConfig}
            enabled={true}
            model={this.props.model}
            onChangeTool={() => {
              if (window.innerWidth < 600) {
                this.props.model.globalObserver.publish("core.minimizeWindow");
                this.props.enqueueSnackbar(
                  "Klicka i kartan för att rita objekt"
                );
              }
            }}
          />
        );
      }
      if (attr.field) {
        return this.getValueMarkup(this.getFieldConfig(attr.field), attr.label);
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
            case "p":
              return (
                <p key={i}>
                  {this.renderFromAttribute(child.attr)}
                  {this.renderFromJsonDom(child)}
                </p>
              );
            case "label":
              return <label key={i}>{this.renderFromJsonDom(child)}</label>;
            case "h1":
              return (
                <Typography variant="h1" key={i}>
                  {this.renderFromJsonDom(child)}
                </Typography>
              );
            case "h2":
              return (
                <Typography variant="h2" key={i}>
                  {this.renderFromJsonDom(child)}
                </Typography>
              );
            case "h3":
              return (
                <Typography variant="h3" key={i}>
                  {this.renderFromJsonDom(child)}
                </Typography>
              );
            case "h4":
              return (
                <Typography variant="h4" key={i}>
                  {this.renderFromJsonDom(child)}
                </Typography>
              );
            case "h5":
              return (
                <Typography variant="h5" key={i}>
                  {this.renderFromJsonDom(child)}
                </Typography>
              );
            case "h6":
              return (
                <Typography variant="h6" key={i}>
                  {this.renderFromJsonDom(child)}
                </Typography>
              );
            case "a":
              return (
                <a
                  key={i}
                  href={child.attr["href"]}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {this.renderFromJsonDom(child)}
                </a>
              );
            case "ul":
              return <ul key={i}>{this.renderFromJsonDom(child)}</ul>;
            case "li":
              return <li key={i}>{this.renderFromJsonDom(child)}</li>;
            case "br":
              return <br key={i} />;
            case "img":
              return (
                <img
                  key={i}
                  src={child.attr["src"]}
                  width={child.attr["width"]}
                  height={child.attr["height"]}
                  alt={child.attr["alt"]}
                >
                  {this.renderFromJsonDom(child)}
                </img>
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

  save = () => {
    this.props.model.save(
      (r) => {
        if (
          r &&
          r.TransactionResponse &&
          r.TransactionResponse.TransactionSummary &&
          r.TransactionResponse.TransactionSummary.totalInserted
        ) {
          const ins =
            r.TransactionResponse.TransactionSummary.totalInserted.toString();
          if (Number(ins) > 0) {
            if (this.props.options.showThankYou) {
              this.setState({
                displayThankYou: true,
              });
            } else {
              this.setState(
                {
                  displayThankYou: true,
                },
                () => {
                  this.props.model.observer.publish("abort");
                }
              );
            }
          } else {
            this.saveError();
          }
        } else {
          this.saveError();
        }
      },
      (error) => {
        this.saveError();
      }
    );
  };

  saveError = () => {
    this.props.model.globalObserver.publish(
      "core.alert",
      "Det gick inte att spara, försök igen senare."
    );
  };

  renderButtons() {
    const { page, numPages, onPrevPage, onNextPage } = this.props;

    const prevButton = (
      <Button
        variant="contained"
        sx={{ float: "left", margin: 1 }}
        onClick={() => {
          if (typeof this.refs.toolbar !== "undefined") {
            this.refs.toolbar.storeValues();
          }
          onPrevPage();
        }}
      >
        <ArrowBackIcon />
      </Button>
    );

    const nextButton = (
      <Button
        variant="contained"
        sx={{ float: "right", margin: 1 }}
        onClick={() => {
          if (typeof this.refs.toolbar !== "undefined") {
            this.refs.toolbar.storeValues();
          }
          onNextPage();
        }}
      >
        <ArrowForwardIcon />
      </Button>
    );

    const sendButton = (
      <Button
        variant="contained"
        sx={{ float: "right", margin: 1 }}
        onClick={this.save}
      >
        Skicka
      </Button>
    );

    const okButton = (
      <Button
        variant="contained"
        sx={{ float: "right", margin: 1 }}
        onClick={() => {
          this.props.model.observer.publish("abort");
        }}
      >
        {this.props.options.collectAgain ? "Tyck till igen" : "Stäng"}
      </Button>
    );

    const closeButton = (
      <Button
        variant="contained"
        sx={{ float: "right", margin: 1 }}
        onClick={() => {
          this.props.model.app.windows.forEach((window) => {
            if (window.type === "collector") {
              window.closeWindow();
            }
          });
        }}
      >
        Stäng
      </Button>
    );

    if (this.state.displayThankYou) {
      if (this.props.options.collectAgain) {
        return (
          <div>
            {okButton}
            {closeButton}
          </div>
        );
      } else {
        return <div>{okButton}</div>;
      }
    }

    if (numPages === 1) {
      return <div>{sendButton}</div>;
    }
    if (numPages > 1 && page.order === numPages - 1) {
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

  createMarkup = () => {
    return {
      __html: this.props.options.thankYou,
    };
  };

  renderThankYou() {
    return <div dangerouslySetInnerHTML={this.createMarkup()}></div>;
  }

  renderSlide() {
    const { page } = this.props;
    const { json } = this.state;
    return (
      <Slide
        direction={this.props.direction || "left"}
        in={true}
        mountOnEnter
        unmountOnExit
        sx={{ height: "100%" }}
      >
        <div>
          <Typography variant="h4">{page.header}</Typography>
          <PageContentInner>{this.renderFromJsonDom(json)}</PageContentInner>
        </div>
      </Slide>
    );
  }

  render() {
    const { displayThankYou } = this.state;
    return (
      this.props.active && (
        <Box sx={{ height: "100%" }}>
          <PageContent>
            {displayThankYou ? this.renderThankYou() : this.renderSlide()}
          </PageContent>
          <div>{this.renderButtons()}</div>
        </Box>
      )
    );
  }
}

export default withSnackbar(Page);
