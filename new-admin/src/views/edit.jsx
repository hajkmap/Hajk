import React from "react";
import { Component } from "react";
import Alert from "../views/alert.jsx";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/SaveSharp";
import AddIcon from "@material-ui/icons/Add";
import CancelIcon from "@material-ui/icons/Cancel";
import { withStyles } from "@material-ui/core/styles";
import { green, blue } from "@material-ui/core/colors";
import TextArea from "antd/lib/input/TextArea";

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

const defaultState = {
  load: false,
  capabilities: [],
  validationErrors: [],
  mode: "add",
  layers: [],
  addedLayers: [],
  id: "",
  caption: "",
  internalLayerName: "",
  url: "",
  uri: "",
  projection: "",
  point: false,
  multipoint: false,
  linestring: false,
  multilinestring: false,
  polygon: false,
  multipolygon: false,
  layerProperties: [],
  alert: false,
  corfirm: false,
  alertMessage: "",
  content: "",
  confirmAction: () => {},
  denyAction: () => {},
};
/**
 *
 */
class Edit extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
  }
  /**
   *
   */
  componentDidMount() {
    this.props.model.set("config", this.props.config);
    this.props.model.getConfig(this.props.config.url_layers);
    this.props.model.on("change:layers", () => {
      this.setState({
        layers: this.props.model.get("layers"),
      });
    });

    defaultState.url = this.props.config.url_default_server;

    this.setState(defaultState);
  }
  /**
   *
   */
  componentWillUnmount() {
    this.props.model.off("change:layers");
  }
  /**
   *
   */
  removeLayer(e, layer) {
    this.setState({
      alert: true,
      confirm: true,
      alertMessage: "Lagret kommer att tas bort. Är detta ok?",
      confirmAction: () => {
        this.props.model.removeLayer(layer, (success) => {
          if (success) {
            this.props.model.getConfig(this.props.config.url_layers);
            this.setState({
              alert: true,
              alertMessage: `Lagret ${layer.caption} togs bort!`,
            });
            if (this.state.id === layer.id) {
              this.abort();
            }
          } else {
            this.setState({
              alert: true,
              alertMessage: "Lagret kunde inte tas bort. Försök igen senare.",
            });
          }
        });
      },
    });
    e.stopPropagation();
  }
  /**
   *
   */
  loadLayer(e, layer) {
    this.abort();
    this.setState({
      mode: "edit",
      id: layer.id,
      caption: layer.caption,
      internalLayerName: layer.internalLayerName || layer.caption,
      url: layer.url,
      uri: layer.uri,
      projection: layer.projection || "EPSG:3006",
      addedLayers: [],
      point: layer.editPoint,
      multipoint: layer.editMultiPoint,
      linestring: layer.editLine,
      multilinestring: layer.editMultiLine,
      polygon: layer.editPolygon,
      multipolygon: layer.editMultiPolygon,
    });

    setTimeout(() => {
      this.validateField("caption", true);
      this.validateField("url", true);
      this.loadWMSCapabilities(undefined, () => {
        this.setState({
          addedLayers: layer.layers,
        });

        this.validateField("layers");

        Object.keys(this.refs).forEach((element) => {
          if (this.refs[element].dataset.type === "wms-layer") {
            this.refs[element].checked = false;
          }
        });

        layer.layers.forEach((layer) => {
          // Sometimes 'layer' has been removed and the ref is non-exiting, so there's no .checked-property to check.
          // Do a check first, so it doesn't render as error if property isn't found.
          if (this.refs.hasOwnProperty(layer)) {
            this.refs[layer].checked = true;
          }
        });

        this.describeLayer(undefined, layer.layers[0], layer);
      });
    }, 0);
  }
  /**
   *
   */
  loadWMSCapabilities(e, callback) {
    if (e) {
      e.preventDefault();
    }

    this.setState({
      load: true,
      addedLayers: [],
      capabilities: false,
      layerProperties: undefined,
      layerPropertiesName: undefined,
    });

    if (this.state.capabilities) {
      this.state.capabilities.forEach((layer, i) => {
        this.refs[layer.name].checked = false;
      });
    }

    this.props.model.getWMSCapabilities(this.state.url, (capabilities) => {
      this.setState({
        capabilities: capabilities,
        load: false,
      });
      if (capabilities === false) {
        this.setState({
          alert: true,
          alertMessage: "Servern svarar inte. Försök med en annan URL.",
        });
      }
      if (callback) {
        callback();
      }
    });
  }
  /**
   *
   */
  appendLayer(e, checkedLayer) {
    this.setState(
      {
        addedLayers: [checkedLayer],
      },
      () => this.validateField("layers")
    );
  }
  /**
   *
   */
  filterLayers(e) {
    this.setState({
      filter: e.target.value,
    });
  }
  /**
   *
   */
  getLayersWithFilter(filter) {
    return this.props.model.get("layers").filter((layer) => {
      return (
        new RegExp(this.state.filter.toLowerCase()).test(
          layer.caption.toLowerCase()
        ) ||
        new RegExp(this.state.filter.toLowerCase()).test(
          layer.internalLayerName?.toLowerCase()
        )
      );
    });
  }
  /**
   *
   */
  abort(e) {
    this.setState(defaultState);
  }
  /**
   *
   */
  validateField(fieldName, updateState) {
    var value = this.getValue(fieldName),
      valid = true;

    switch (fieldName) {
      case "layers":
        if (value.length === 0) {
          valid = false;
        }
        break;
      case "url":
      case "caption":
        if (value === "") {
          valid = false;
        }
        break;
      default:
        break;
    }

    if (updateState !== false) {
      if (!valid) {
        this.setState({
          validationErrors: [...this.state.validationErrors, fieldName],
        });
      } else {
        this.setState({
          validationErrors: this.state.validationErrors.filter(
            (v) => v !== fieldName
          ),
        });
      }
    }

    return valid;
  }
  /**
   *
   */
  getEditableFields() {
    var filter, mapper;
    mapper = (item) => {
      return {
        index: item.index,
        name: item.name,
        alias: item.alias || item.name,
        description: item.description || "",
        dataType: item.localType,
        textType: item.textType || null,
        values: item.listValues || null,
        hidden: item.hidden,
        defaultValue: item.defaultValue,
      };
    };

    filter = (item) => item.checked === true;

    return this.state.layerProperties.filter(filter).map(mapper);
  }

  /**
   *
   */
  getNonEditableFields() {
    var filter, mapper;
    mapper = (item) => {
      return {
        index: item.index,
        name: item.name,
        alias: item.alias || item.name,
        description: item.description || "",
        dataType: item.localType,
        textType: item.textType || null,
        values: item.listValues || null,
        hidden: item.hidden,
        defaultValue: item.defaultValue,
      };
    };

    filter = (item) => !item.checked || item.checked === false; // checked is missing if the checkbox has not been touched

    return this.state.layerProperties.filter(filter).map(mapper);
  }

  /**
   *
   */
  getValue(fieldName) {
    function create_date() {
      return new Date().getTime().toString();
    }

    function format_layers(layers) {
      return layers.map((layer) => layer);
    }

    var input = this.refs["input_" + fieldName],
      value = input ? input.value : "";

    if (fieldName === "date") value = create_date();
    if (fieldName === "layers") value = format_layers(this.state.addedLayers);
    if (fieldName === "editableFields") value = this.getEditableFields();
    if (fieldName === "point") value = input.checked;
    if (fieldName === "polygon") value = input.checked;
    if (fieldName === "linestring") value = input.checked;
    if (fieldName === "multipoint") value = input.checked;
    if (fieldName === "multipolygon") value = input.checked;
    if (fieldName === "multilinestring") value = input.checked;

    return value;
  }
  /**
   *
   */
  createGuid(layers) {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  }
  /**
   *
   */
  parseDate() {
    var parsed = parseInt(this.state.date, 10);
    return isNaN(parsed) ? this.state.date : new Date(parsed).toLocaleString();
  }
  /**
   *
   */
  getValidationClass(inputName) {
    return this.state.validationErrors.find((v) => v === inputName)
      ? "validation-error"
      : "";
  }
  /**
   *
   */
  describeLayer(e, layerName, layer) {
    this.props.model.getLayerDescription(
      this.refs.input_url.value,
      layerName,
      (properties) => {
        if (layer) {
          if (layer?.editableFields)
            layer.editableFields.forEach((editableField) => {
              properties[editableField.index].listValues = editableField.values;
              properties[editableField.index].textType = editableField.textType;
              properties[editableField.index].alias = editableField.alias;
              properties[editableField.index].description =
                editableField.description;
              properties[editableField.index].checked = true;
              properties[editableField.index].hidden = editableField.hidden;
              properties[editableField.index].defaultValue =
                editableField.defaultValue;
            });
        }

        if (layer?.nonEditableFields) {
          layer.nonEditableFields.forEach((nonEditableField) => {
            properties[nonEditableField.index].listValues =
              nonEditableField.values;
            properties[nonEditableField.index].textType =
              nonEditableField.textType;
            properties[nonEditableField.index].alias = nonEditableField.alias;
            properties[nonEditableField.index].description =
              nonEditableField.description;
            properties[nonEditableField.index].checked = false;
            properties[nonEditableField.index].hidden = nonEditableField.hidden;
            properties[nonEditableField.index].defaultValue =
              nonEditableField.defaultValue;
          });
        }

        this.setState({
          layerProperties: properties,
          layerPropertiesName: layerName,
        });
      }
    );
  }
  /**
   *
   */
  closeDetails() {
    this.setState({
      layerProperties: undefined,
      layerPropertiesName: undefined,
    });
  }
  /**
   *
   */
  addListValue(index, e) {
    if (this.state.layerProperties[index] && e.target.value !== "") {
      let props = this.state.layerProperties[index];
      if (!Array.isArray(props.listValues)) {
        props.listValues = [];
      }
      props.listValues.push(e.target.value);
    }
  }

  tooltipText(type) {
    if (type === "string") {
      return "Skriv in en text. För lista, skriv in ett värde och tryck på enterknappen för att lägga till som valbart element.";
    } else if (type === "int") {
      return "Skriv in ett heltal. Vid ja/nej så ange 1 för ja och 0 för nej";
    } else if (type === "date") {
      return "Skriv in ett datum på följande format: YYYY-MM-DD. Exempel 2021-08-09";
    } else if (type === "date-time") {
      return "Skriv in ett datum samt tid på följande format: YYYY-MM-DDThh:mm. Exempel 2021-08-09T01:23";
    } else if (type === "number") {
      return "Skriv in ett tal";
    } else if (type === "boolean") {
      return "Skriv antingen ja eller nej";
    }
    return "";
  }

  validateEditableFields() {
    let errors = [];

    // Check the entered values
    this.getEditableFields().forEach((field) => {
      if (field.dataType === "string") {
        if (field.value && typeof field.value !== "string") {
          errors.push(
            field.name + " is not a string. Was " + typeof field.value
          );
        }
      } else if (field.dataType === "date") {
        if (field.value) {
          const d = new Date(field.value);
          try {
            d.getDate();
          } catch (error) {
            errors.push(
              field.name + " is not a valid date. Was " + field.value
            );
          }
        }
      } else if (field.dataType === "date-time") {
        if (field.value) {
          const d = new Date(field.value);
          try {
            d.getDate();
          } catch (error) {
            errors.push(
              field.name + " is not a valid date time. Was " + field.value
            );
          }
        }
      } else if (field.dataType === "int") {
        if (field.value && isNaN(parseInt(field.value))) {
          errors.push(
            field.name + " is not a integer. Value was " + field.value
          );
        } else if (field.localType === "Positiva heltal") {
          if (field.value && parseInt(field.value) <= 0) {
            errors.push(
              field.name + " is not a positive number. Was " + field.value
            );
          }
        }
      } else if (field.dataType === "number") {
        if (field.value && isNaN(parseFloat(field.value))) {
          errors.push(
            field.name + " is not a number. Value was " + field.value
          );
        }
      } else if (field.dataType === "boolean") {
        if (field.value && field.value !== "ja" && field.value !== "nej") {
          errors.push(
            field.name + " is not a ja or nej. Value was " + field.value
          );
        }
      }
    });

    // Check the entered default values
    this.getEditableFields().forEach((field) => {
      if (field.dataType === "string") {
        if (field.defaultValue && typeof field.defaultValue !== "string") {
          errors.push(
            field.name +
              " default value is not a string. Was " +
              typeof field.defaultValue
          );
        }
      } else if (field.dataType === "date") {
        if (field.defaultValue) {
          const d = new Date(field.defaultValue);
          try {
            d.getDate();
          } catch (error) {
            errors.push(
              field.name +
                " default value is not a valid date. Was " +
                field.defaultValue
            );
          }
        }
      } else if (field.dataType === "date-time") {
        if (field.defaultValue) {
          const d = new Date(field.defaultValue);
          try {
            d.getDate();
          } catch (error) {
            errors.push(
              field.name +
                " default value is not a valid date time. Was " +
                field.defaultValue
            );
          }
        }
      } else if (field.dataType === "int") {
        if (field.defaultValue && isNaN(parseInt(field.defaultValue))) {
          errors.push(
            field.name +
              " default value is not a integer. Value was " +
              field.defaultValue
          );
        } else if (field.localType === "Positiva heltal") {
          if (field.defaultValue && parseInt(field.defaultValue) <= 0) {
            errors.push(
              field.name +
                " default value is not a positive number. Was " +
                field.defaultValue
            );
          }
        }
      } else if (field.dataType === "number") {
        if (field.defaultValue && isNaN(parseFloat(field.defaultValue))) {
          errors.push(
            field.name +
              " default value is not a number. Value was " +
              field.defaultValue
          );
        }
      } else if (field.dataType === "boolean") {
        if (
          field.defaultValue &&
          field.defaultValue !== "ja" &&
          field.defaultValue !== "nej"
        ) {
          errors.push(field.name + " default value is not ja or nej.");
        }
      }
    });
    return errors;
  }

  modifyBooleans(layer) {
    layer.editableFields.forEach((field) => {
      if (field.textType === "boolean") {
        field.defaultValue = field.defaultValue === "ja";
      }
      console.log(field);
    });
  }

  /**
   *
   */
  submit(e) {
    var validationErrors = [];
    var validations = ["caption", "url", "layers"];
    validations.forEach((fieldName) => {
      var valid = this.validateField(fieldName, false);
      if (!valid) {
        validationErrors.push(fieldName);
      }
    });
    var editableErrors = this.validateEditableFields();
    this.setState({
      validationErrors: validationErrors,
      editableErrors: editableErrors,
    });

    if (validationErrors.length === 0 && editableErrors.length === 0) {
      let layer = {
        id: this.state.id,
        caption: this.getValue("caption"),
        internalLayerName: this.getValue("internalLayerName"),
        url: this.getValue("url"),
        uri: this.getValue("uri"),
        layers: this.getValue("layers"),
        projection: this.getValue("projection"),
        editableFields: this.getValue("editableFields"),
        nonEditableFields: this.getNonEditableFields(),
        editPoint: this.getValue("point"),
        editMultiPoint: this.getValue("multipoint"),
        editPolygon: this.getValue("polygon"),
        editMultiPolygon: this.getValue("multipolygon"),
        editLine: this.getValue("linestring"),
        editMultiLine: this.getValue("multilinestring"),
      };

      this.modifyBooleans(layer);

      if (this.state.mode === "add") {
        layer.id = this.createGuid(this.props.model.get("layers"));

        this.props.model.addLayer(layer, (success) => {
          if (success) {
            this.props.model.getConfig(this.props.config.url_layers);
            this.abort();
            this.setState({
              alert: true,
              alertMessage:
                "Lagret har lagt till i listan av tillgängliga lager.",
            });
          } else {
            this.setState({
              alert: true,
              alertMessage:
                "Lagret kunde inte läggas till. Försök igen senare.",
            });
          }
        });
      }

      if (this.state.mode === "edit") {
        this.props.model.updateLayer(layer, (success) => {
          if (success) {
            this.props.model.getConfig(this.props.config.url_layers);
            this.setState({
              alert: true,
              alertMessage: "Uppdateringen lyckades!",
            });
            this.setState({
              date: layer.date,
            });
          } else {
            this.setState({
              alert: true,
              alertMessage: "Uppdateringen misslyckades.",
            });
          }
        });
      }
    } else {
      let errorString = "Felaktig indata, se nedan\n";
      errorString += validationErrors.join("\n");
      if (editableErrors.length !== 0 && validationErrors.length !== 0) {
        errorString += "\n";
      }
      errorString += editableErrors.join("\n");
      alert(errorString);
    }
    e.preventDefault();
  }
  /**
   *
   */
  renderLayersFromConfig(layers) {
    layers = this.state.filter
      ? this.getLayersWithFilter()
      : this.props.model.get("layers");

    var startsWith = [];
    var alphabetically = [];

    if (this.state.filter) {
      layers.forEach((layer) => {
        layer.caption.toLowerCase().indexOf(this.state.filter.toLowerCase()) ===
          0 ||
        layer.internalLayerName
          ?.toLowerCase()
          .indexOf(this.state.filter.toLowerCase()) === 0
          ? startsWith.push(layer)
          : alphabetically.push(layer);
      });

      startsWith.sort(function (a, b) {
        let aName = a.internalLayerName ? a.internalLayerName : a.caption;
        aName = aName.toLowerCase();
        let bName = b.internalLayerName ? b.internalLayerName : b.caption;
        bName = bName.toLowerCase();
        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      });

      alphabetically.sort(function (a, b) {
        let aName = a.internalLayerName ? a.internalLayerName : a.caption;
        aName = aName.toLowerCase();
        let bName = b.internalLayerName ? b.internalLayerName : b.caption;
        bName = bName.toLowerCase();
        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      });

      layers = startsWith.concat(alphabetically);
    }
    return layers.map((layer, i) => (
      <li onClick={(e) => this.loadLayer(e, layer)} key={Math.random()}>
        <span>
          {layer.internalLayerName?.length > 0
            ? layer.internalLayerName
            : layer.caption}
        </span>
        <i
          title="Radera lager"
          onClick={(e) => this.removeLayer(e, layer)}
          className="fa fa-trash"
        />
      </li>
    ));
  }
  /**
   *
   */
  renderSelectedLayers() {
    if (!this.state.addedLayers) return null;

    function uncheck(layer) {
      this.refs[layer].checked = false;
      this.setState({
        addedLayers: [],
      });
    }

    return this.state.addedLayers.map((layer, i) => (
      <li className="layer noselect" key={i}>
        <span>{layer}</span>
        &nbsp;
        <i className="fa fa-times" onClick={uncheck.bind(this, layer)} />
      </li>
    ));
  }
  /**
   *
   */
  renderListValues(index) {
    if (
      this.state.layerProperties[index] &&
      this.state.layerProperties[index].listValues
    ) {
      return this.state.layerProperties[index].listValues.map((value, i) => {
        return (
          <span className="list-value noselect" key={i}>
            {value}{" "}
            <i
              className="fa fa-times"
              onClick={() => {
                this.state.layerProperties[index].listValues.splice(i, 1);
                this.forceUpdate();
              }}
            />
          </span>
        );
      });
    } else {
      return null;
    }
  }
  /**
   *
   */
  renderLayerProperties() {
    if (this.state.layerProperties === undefined) {
      return null;
    }
    if (this.state.layerProperties === false) {
      return (
        <div>
          <div>Information saknas</div>
        </div>
      );
    }

    var rows = this.state.layerProperties.map((property, i) => {
      var stringDataTypes = (type) => {
        if (type === "string") {
          if (!property.textType) {
            property.textType = "fritext";
          }
          return (
            <select
              defaultValue={property.textType}
              onChange={(e) => {
                property.textType = e.target.value;
              }}
            >
              <option value="fritext">Fritext</option>
              <option value="datum">Datum</option>
              <option value="lista">Lista</option>
              <option value="flerval">Flerval</option>
              <option value="url">Url</option>
            </select>
          );
        } else if (type === "date") {
          return (
            <select
              defaultValue={property.textType}
              onChange={(e) => {
                property.textType = e.target.value;
              }}
            >
              <option value="datum">Datum</option>
            </select>
          );
        } else if (type === "date-time") {
          return (
            <>
              <select
                defaultValue={property.textType}
                onChange={(e) => {
                  property.textType = e.target.value;
                }}
              >
                <option value="datumtid">Datum & Tid</option>
                <option value="datum">Datum</option>
              </select>
            </>
          );
        } else if (type === "int") {
          return (
            <select
              defaultValue={property.textType}
              onChange={(e) => {
                property.textType = e.target.value;
              }}
            >
              <option value="heltal">Heltal</option>
              <option value="positive">Positiva heltal</option>
              <option value="negative">Negativa heltal</option>
              <option value="boolean">Ja/nej</option>
            </select>
          );
        } else if (type === "number") {
          return (
            <select
              defaultValue={property.textType}
              onChange={(e) => {
                property.textType = e.target.value;
              }}
            >
              <option value="tal">Reella tal</option>
              <option value="heltal">Heltal</option>
            </select>
          );
        } else if (type === "boolean") {
          return (
            <select
              defaultValue={property.textType}
              onChange={(e) => {
                property.textType = e.target.value;
              }}
            >
              <option value="boolean">Ja/nej</option>
            </select>
          );
        }
        return null;
      };

      var listEditor = (type) => {
        if (type === "string") {
          return (
            <div>
              <input
                onKeyDown={(e) => {
                  if (e.keyCode === 13) {
                    e.preventDefault();
                    this.addListValue(i, e);
                    this.forceUpdate();
                    e.target.value = "";
                  }
                }}
                type="text"
              />
              <div className="editable-list">{this.renderListValues(i)}</div>
            </div>
          );
        }
        return null;
      };

      var defaultValueEditor = (type, value) => {
        if (type === "boolean") {
          if (value === "true") {
            value = "ja";
          } else if (value === "false") {
            value = "nej";
          }
          property.defaultValue = value;
        }
        return (
          <>
            <div className="grid  edit-fields-table-default">
              <div className="row">
                <div className="col-sm">
                  <input
                    defaultValue={value}
                    type="text"
                    onChange={(e) => {
                      property.defaultValue = e.target.value;
                    }}
                  />
                  {"  "}
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title={this.tooltipText(property.localType)}
                  />
                </div>
              </div>
            </div>
          </>
        );
      };

      var aliasEditor = (type, value) => {
        return (
          <div>
            <input
              defaultValue={value}
              type="text"
              onChange={(e) => {
                property.alias = e.target.value;
              }}
            />
          </div>
        );
      };

      var descriptionEditor = (type, value) => {
        return (
          <div>
            <TextArea
              defaultValue={value}
              rows={3}
              onChange={(e) => {
                property.description = e.target.value;
              }}
            />
          </div>
        );
      };

      if (!property.hasOwnProperty("hidden")) {
        property.hidden = false;
      }

      property.index = i;

      // Don't render the geometry column as editable field
      if (property.type.includes("gml:")) {
        return null;
      }

      return (
        <tr key={parseInt(Math.random() * 1e8, 10)}>
          <td>
            <input
              type="checkbox"
              defaultChecked={property.checked}
              onChange={(e) => {
                property.checked = e.target.checked;
              }}
            />
          </td>
          <td>
            <input
              type="checkbox"
              defaultChecked={property.hidden}
              onChange={(e) => {
                property.hidden = e.target.checked;
              }}
            />
          </td>
          <td>{property.name}</td>
          <td>{aliasEditor(property.localType, property.alias)}</td>
          <td>{descriptionEditor(property.localType, property.description)}</td>
          <td>{stringDataTypes(property.localType)}</td>
          <td>{property.localType}</td>
          <td>{listEditor(property.localType)}</td>
          <td>
            {defaultValueEditor(property.localType, property.defaultValue)}
          </td>
        </tr>
      );
    });

    return (
      <table className="edit-fields-table">
        <thead>
          <tr>
            <th>Redigerbar</th>
            <th>Dold</th>
            <th>Namn</th>
            <th>Alias</th>
            <th>Beskrivning</th>
            <th>Typ</th>
            <th>Datatyp</th>
            <th>Listvärden</th>
            <th>Standardvärde</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }
  /**
   *
   */
  renderLayersFromCapabilites() {
    if (this.state && this.state.capabilities) {
      return this.state.capabilities.map((layer, i) => {
        return (
          <li key={i}>
            <input
              ref={layer.name}
              id={"layer" + i}
              type="radio"
              name="featureType"
              data-type="wfs-layer"
              onChange={(e) => {
                this.appendLayer(e, layer.name);
                this.describeLayer(e, layer.name);
              }}
            />
            &nbsp;
            <label htmlFor={"layer" + i}>{layer.name}</label>
          </li>
        );
      });
    } else {
      return null;
    }
  }
  /**
   *
   */
  renderProjections() {
    var render = (projection, i) => (
      <option key={i} value={projection}>
        {projection}
      </option>
    );
    var options = this.props.config.projections.map(render);

    return (
      <select
        ref="input_projection"
        value={this.state.projection}
        className="control-fixed-width"
        onChange={(e) => {
          this.setState({
            projection: e.target.value,
          });
        }}
      >
        {options}
      </select>
    );
  }
  /**
   *
   */
  renderLayerList() {
    var layers = this.renderLayersFromCapabilites();
    return (
      <div className="layer-list">
        <ul>{layers}</ul>
      </div>
    );
  }

  getAlertOptions() {
    return {
      visible: this.state.alert,
      message: this.state.alertMessage,
      confirm: this.state.confirm,
      confirmAction: () => {
        this.state.confirmAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: "",
        });
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: "",
        });
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: "",
        });
      },
    };
  }
  /**
   *
   */
  render() {
    var loader = this.state.load ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    var abort =
      this.state.mode === "edit" ? (
        <ColorButtonBlue
          variant="contained"
          className="btn btn-danger"
          onClick={(e) => this.abort(e)}
          startIcon={<CancelIcon />}
        >
          Avbryt
        </ColorButtonBlue>
      ) : null;

    return (
      <section className="tab-pane active">
        <Alert options={this.getAlertOptions()} />
        <aside>
          <input
            placeholder="filtrera"
            type="text"
            onChange={(e) => this.filterLayers(e)}
          />
          <ul className="config-layer-list">{this.renderLayersFromConfig()}</ul>
        </aside>
        <article>
          <form
            method="post"
            action=""
            onSubmit={(e) => {
              this.submit(e);
            }}
          >
            <fieldset>
              <legend>Lägg till WFST-tjänst</legend>
              <div className="separator">Anslutning</div>
              <div>
                <label>Url*</label>
                <input
                  type="text"
                  ref="input_url"
                  value={this.state.url}
                  onChange={(e) => {
                    var v = e.target.value;
                    this.setState(
                      {
                        url: v,
                      },
                      () => this.validateField("url")
                    );
                  }}
                  className={this.getValidationClass("url")}
                />
                <span
                  onClick={(e) => {
                    this.loadWMSCapabilities(e);
                  }}
                  className="btn btn-default"
                >
                  Ladda lager {loader}
                </span>
              </div>
              <div>
                <label>Namespace Uri</label>
                <input
                  type="text"
                  ref="input_uri"
                  value={this.state.uri}
                  onChange={(e) => {
                    var v = e.target.value;
                    this.setState(
                      {
                        uri: v,
                      },
                      () => this.validateField("uri")
                    );
                  }}
                  className={this.getValidationClass("uri")}
                />
              </div>
              <div className="separator">Tillgängliga lager</div>
              <div>
                <label>Lagerlista</label>
                {this.renderLayerList()}
              </div>
              <div className="separator">Hantera valt lager</div>
              <div>
                <label>Valt lager*</label>
                <div
                  ref="input_layers"
                  className={
                    "layer-list-choosen " + this.getValidationClass("layers")
                  }
                >
                  <ul>{this.renderSelectedLayers()}</ul>
                </div>
              </div>
              <div>
                <label>Visningsnamn*</label>
                <input
                  type="text"
                  ref="input_caption"
                  value={this.state.caption}
                  onChange={(e) => {
                    var v = e.target.value;
                    this.setState(
                      {
                        caption: v,
                      },
                      () => this.validateField("caption")
                    );
                  }}
                  className={this.getValidationClass("caption")}
                />
              </div>
              <div>
                <label>Visningsnamn Admin</label>
                <input
                  type="text"
                  ref="input_internalLayerName"
                  value={this.state.internalLayerName || ""}
                  onChange={(e) => {
                    this.setState({ internalLayerName: e.target.value });
                    this.validateField("internalLayerName");
                  }}
                />
              </div>
              <div>
                <label>Projektion</label>
                {this.renderProjections()}
              </div>
              <div>
                <label>Geometrityper</label>
                <div className="geometry-types">
                  <input
                    checked={this.state.point}
                    onChange={(e) => {
                      const newSt = { point: e.target.checked };
                      if (e.target.checked) {
                        newSt["multipoint"] = false;
                      }
                      this.setState(newSt, () =>
                        this.validateField("point", true)
                      );
                    }}
                    ref="input_point"
                    name="point"
                    id="point"
                    type="checkbox"
                  />
                  <label htmlFor="point">&nbsp;Punkter</label>
                  <br />
                  <input
                    checked={this.state.multipoint}
                    onChange={(e) => {
                      const newSt = { multipoint: e.target.checked };
                      if (e.target.checked) {
                        newSt["point"] = false;
                      }
                      this.setState(newSt, () =>
                        this.validateField("multipoint", true)
                      );
                    }}
                    ref="input_multipoint"
                    name="multipoint"
                    id="multipoint"
                    type="checkbox"
                  />
                  <label htmlFor="multipoint">&nbsp;Multipunkter</label>
                  <br />
                  <input
                    checked={this.state.linestring}
                    onChange={(e) => {
                      const newSt = { linestring: e.target.checked };
                      if (e.target.checked) {
                        newSt["multilinestring"] = false;
                      }
                      this.setState(newSt, () =>
                        this.validateField("linestring", true)
                      );
                    }}
                    ref="input_linestring"
                    name="linestring"
                    id="linestring"
                    type="checkbox"
                  />
                  <label htmlFor="linestring">&nbsp;Linjer</label>
                  <br />
                  <input
                    checked={this.state.multilinestring}
                    onChange={(e) => {
                      const newSt = { multilinestring: e.target.checked };
                      if (e.target.checked) {
                        newSt["linestring"] = false;
                      }
                      this.setState(newSt, () =>
                        this.validateField("multilinestring", true)
                      );
                    }}
                    ref="input_multilinestring"
                    name="multilinestring"
                    id="multilinestring"
                    type="checkbox"
                  />
                  <label htmlFor="multilinestring">&nbsp;Multilinjer</label>
                  <br />
                  <input
                    checked={this.state.polygon}
                    onChange={(e) => {
                      const newSt = { polygon: e.target.checked };
                      if (e.target.checked) {
                        newSt["multipolygon"] = false;
                      }
                      this.setState(newSt, () =>
                        this.validateField("polygon", true)
                      );
                    }}
                    ref="input_polygon"
                    name="polygon"
                    id="polygon"
                    type="checkbox"
                  />
                  <label htmlFor="polygon">&nbsp;Ytor</label>
                  <br />
                  <input
                    checked={this.state.multipolygon}
                    onChange={(e) => {
                      const newSt = { multipolygon: e.target.checked };
                      if (e.target.checked) {
                        newSt["polygon"] = false;
                      }
                      this.setState(newSt, () =>
                        this.validateField("multipolygon", true)
                      );
                    }}
                    ref="input_multipolygon"
                    name="multipolygon"
                    id="multipolygon"
                    type="checkbox"
                  />
                  <label htmlFor="multipolygon">&nbsp;Multiytor</label>
                </div>
              </div>
              <div>
                <label>Redigerbara fält</label>
                {this.renderLayerProperties()}
              </div>
            </fieldset>
            {this.state.mode === "edit" ? (
              <ColorButtonBlue
                variant="contained"
                className="btn"
                type="submit"
                startIcon={<SaveIcon />}
              >
                Spara
              </ColorButtonBlue>
            ) : (
              <ColorButtonGreen
                variant="contained"
                className="btn"
                type="submit"
                startIcon={<AddIcon />}
              >
                Lägg till
              </ColorButtonGreen>
            )}
            &nbsp;
            {abort}
          </form>
        </article>
      </section>
    );
  }
}

export default Edit;
