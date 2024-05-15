import React from "react";
import { Component } from "react";
import Alert from "../views/alert.jsx";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/SaveSharp";
import AddIcon from "@material-ui/icons/Add";
import CancelIcon from "@material-ui/icons/Cancel";
import { withStyles } from "@material-ui/core/styles";
import { red, green, blue } from "@material-ui/core/colors";

const ColorButtonRed = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

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
  capabilities: false,
  validationErrors: [],
  mode: "add",
  layers: [],
  addedLayers: [],
  id: "",
  caption: "",
  internalLayerName: "",
  date: "Fylls i per automatik",
  searchFields: "",
  infobox: "",
  aliasDict: "",
  displayFields: "",
  secondaryLabelFields: "",
  shortDisplayFields: "",
  geometryField: "",
  url: "",
  outputFormat: undefined,
  serverType: "geoserver",
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
class Search extends Component {
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
    this.setState({
      mode: "edit",
      id: layer.id,
      caption: layer.caption,
      internalLayerName: layer.internalLayerName || layer.caption,
      searchFields: layer.searchFields,
      infobox: layer.infobox,
      aliasDict: layer.aliasDict,
      displayFields: layer.displayFields,
      secondaryLabelFields: layer.secondaryLabelFields,
      shortDisplayFields: layer.shortDisplayFields,
      geometryField: layer.geometryField,
      outputFormat: layer.outputFormat || "GML3",
      serverType: layer.serverType || "geoserver",
      url: layer.url,
      addedLayers: [],
    });

    setTimeout(() => {
      this.validateField("url", true);
      this.validateField("searchFields", true);
      this.validateField("displayFields", true);
      this.validateField("secondaryLabelFields", true);
      this.validateField("shortDisplayFields", true);
      this.validateField("geometryField", true);
      this.validateField("outputFormat", true);
      this.validateField("serverType", true);

      this.loadWMSCapabilities(undefined, () => {
        this.setState({
          addedLayers: layer.layers,
        });

        this.validateField("layers", true);

        Object.keys(this.refs).forEach((element) => {
          if (this.refs[element].dataset.type === "wms-layer") {
            this.refs[element].checked = false;
          }
        });

        layer.layers.forEach((layer) => {
          if (this && this.refs && this.refs[layer])
            this.refs[layer].checked = true;
        });
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
    if (e.target.checked === true) {
      this.setState(
        {
          addedLayers: [checkedLayer],
        },
        () => this.validateField("layers"),
        true
      );
    } else {
      this.setState(
        {
          addedLayers: this.state.addedLayers.filter(
            (layer) => layer !== checkedLayer
          ),
        },
        () => this.validateField("layers"),
        true
      );
    }
  }
  /**
   *
   */
  renderSelectedLayers() {
    if (!this.state.addedLayers) return null;

    function uncheck(layer) {
      this.appendLayer(
        {
          target: {
            checked: false,
          },
        },
        layer
      );
      this.refs[layer].checked = false;
    }

    return this.state.addedLayers.map((layer, i) => (
      <li className="layer" key={i}>
        <span>{layer}</span>
        &nbsp;
        <i className="fa fa-times" onClick={uncheck.bind(this, layer)} />
      </li>
    ));
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
  getLayersWithFilter() {
    return this.props.model.get("layers").filter((layer) => {
      const caption = layer.caption.toLowerCase();
      const internalLayerName = layer.internalLayerName?.toLowerCase() || "";
      const filter = this.state.filter.toLowerCase();
      return caption.includes(filter) || internalLayerName.includes(filter);
    });
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
  abort(e) {
    this.setState(defaultState);
  }

  validateField(fieldName, updateState) {
    var value = this.getValue(fieldName),
      valid = true;

    switch (fieldName) {
      case "displayFields":
      case "secondaryLabelFields":
      case "shortDisplayFields":
      case "searchFields":
        valid = value.every((val) =>
          // Ensure that we allow most glyphs from most languages but prevent some "invalid"
          // characters such as ` or ^ or %. See #1187.
          /^[\p{L}\u0590-\u05fe_-]+[\p{L}\p{N}\u0590-\u05fe_\-.]+(\s+[\p{L}\p{N}\u0590-\u05fe_-]+)*$/gu.test(
            val
          )
        );

        // Completely empty strings are valid too
        if (value.length === 1 && value[0] === "") {
          valid = true;
        }
        break;
      case "layers":
        if (value.length === 0) {
          valid = false;
        }
        break;
      case "url":
      case "caption":
      case "geometryField":
        if (value === "") {
          valid = false;
        }
        break;
      case "outputFormat":
      case "serverType":
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
    if (fieldName === "searchFields") value = value.split(",");
    if (fieldName === "displayFields") value = value.split(",");
    if (fieldName === "secondaryLabelFields") value = value.split(",");
    if (fieldName === "shortDisplayFields") value = value.split(",");

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
  submit(e) {
    var validationErrors = [],
      validationFields = [
        "caption",
        "url",
        "layers",
        "searchFields",
        "displayFields",
        "secondaryLabelFields",
        "shortDisplayFields",
        "geometryField",
        "outputFormat",
        "serverType",
      ];

    validationFields.forEach((fieldName) => {
      if (!this.validateField(fieldName, false)) {
        validationErrors.push(fieldName);
      }
    });

    this.setState({
      validationErrors: validationErrors,
    });

    if (validationErrors.length === 0) {
      let layer = {
        id: this.state.id,
        caption: this.getValue("caption"),
        internalLayerName: this.getValue("internalLayerName"),
        url: this.getValue("url"),
        layers: this.getValue("layers"),
        searchFields: this.getValue("searchFields"),
        infobox: this.getValue("infobox"),
        aliasDict: this.getValue("aliasDict"),
        displayFields: this.getValue("displayFields"),
        secondaryLabelFields: this.getValue("secondaryLabelFields"),
        shortDisplayFields: this.getValue("shortDisplayFields"),
        geometryField: this.getValue("geometryField"),
        outputFormat: this.getValue("outputFormat"),
        serverType: this.getValue("serverType"),
      };

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
    }
    e.preventDefault();
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
  describeLayer(e, layer) {
    var arcgis = /MapServer\/WFSServer$/.test(this.refs.input_url.value);
    this.props.model.getLayerDescription(
      this.refs.input_url.value,
      layer,
      arcgis,
      (properties) => {
        this.setState({
          layerProperties: properties,
          layerPropertiesName: layer.name,
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
  renderLayerProperties() {
    if (this.state.layerProperties === undefined) {
      return null;
    }
    if (this.state.layerProperties === false) {
      return (
        <div>
          <i className="fa fa-times" onClick={() => this.closeDetails()} />
          <div>Information saknas</div>
        </div>
      );
    }
    var rows = this.state.layerProperties.map((property, i) => (
      <tr key={i}>
        <td>{property.name}</td>
        <td>{property.localType}</td>
      </tr>
    ));
    return (
      <div>
        <i className="fa fa-times" onClick={() => this.closeDetails()} />
        <table>
          <thead>
            <tr>
              <th>Namn</th>
              <th>Typ</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  }
  /**
   *
   */
  renderLayersFromCapabilites() {
    if (this.state && this.state.capabilities) {
      return this.state.capabilities.map((layer, i) => {
        var classNames =
          this.state.layerPropertiesName === layer.name
            ? "fa fa-info-circle active"
            : "fa fa-info-circle";
        return (
          <li key={i}>
            <input
              ref={layer.name}
              id={"layer" + i}
              type="radio"
              name="featureType"
              data-type="wms-layer"
              onChange={(e) => {
                this.appendLayer(e, layer.name);
              }}
            />
            &nbsp;
            <label htmlFor={"layer" + i}>{layer.name}</label>
            <i
              className={classNames}
              onClick={(e) => this.describeLayer(e, layer)}
            />
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
        <ColorButtonRed
          variant="contained"
          className="btn btn-danger"
          onClick={(e) => this.abort(e)}
          startIcon={<CancelIcon />}
        >
          Avbryt
        </ColorButtonRed>
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
              <legend>Lägg till WFS-tjänst</legend>
              <div className="separator">Anslutning</div>
              <div>
                <label>Url*</label>
                <input
                  type="text"
                  ref="input_url"
                  value={this.state.url}
                  onChange={(e) => {
                    this.setState(
                      {
                        url: e.target.value,
                      },
                      () => this.validateField("url", true)
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
                <label>Responstyp</label>
                <select
                  ref="input_outputFormat"
                  value={this.state.outputFormat}
                  className="control-fixed-width"
                  onChange={(e) => {
                    this.setState(
                      {
                        outputFormat: e.target.value,
                      },
                      () => this.validateField("outputFormat", true)
                    );
                  }}
                >
                  <option value="application/json">application/json</option>
                  <option value="application/vnd.geo+json">
                    application/vnd.geo+json
                  </option>
                  <option value="GML3">GML3</option>
                  <option value="GML2">GML2</option>
                </select>
              </div>
              <div>
                <label>Servertyp</label>
                <select
                  ref="input_serverType"
                  value={this.state.serverType}
                  className="control-fixed-width"
                  onChange={(e) => {
                    this.setState(
                      {
                        serverType: e.target.value,
                      },
                      () => this.validateField("serverType", true)
                    );
                  }}
                >
                  <option value="geoserver">GeoServer</option>
                  <option value="qgis">QGIS Server</option>
                  <option value="arcgis">ArcGIS Server</option>
                  <option value="mapserver">MapServer</option>
                </select>
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
                <label>
                  Visningsnamn*{" "}
                  <abbr title="Visas för användaren i bland annat sökresultatlistan som namnet på datamängden man söker i.">
                    (?)
                  </abbr>
                </label>
                <input
                  type="text"
                  ref="input_caption"
                  value={this.state.caption}
                  onChange={(e) => {
                    this.setState(
                      {
                        caption: e.target.value,
                      },
                      () => this.validateField("caption", true)
                    );
                  }}
                  className={this.getValidationClass("caption")}
                />
              </div>
              <div>
                <label>
                  Visningsnamn Admin UI{" "}
                  <abbr title="Visas INTE för användaren. Lokalt namn som endast visas i administrationsgränssnittet och kan användas för att särskilja om flera lager behöver ha samma Visningsnamn utåt.">
                    (?)
                  </abbr>
                </label>
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
                <label>
                  Inforuta{" "}
                  <abbr title="Styr hur resultatet visas i detaljvyn. Referera till dokumentationen för Sökverktyget samt Infoclick (för tillåten syntax i infoboxen). Se Hajks Wiki på GitHub.">
                    (?)
                  </abbr>
                </label>
                <textarea
                  ref="input_infobox"
                  value={this.state.infobox}
                  onChange={(e) => this.setState({ infobox: e.target.value })}
                />
              </div>
              <div>
                <label>Attributmappning</label>
                <textarea
                  ref="input_aliasDict"
                  value={this.state.aliasDict}
                  onChange={(e) => {
                    this.setState({ aliasDict: e.target.value });
                  }}
                />
              </div>
              <div>
                <label>
                  Sökfält{" "}
                  <abbr title="Styr vilka attribut (kolumner i tabellen) som sökning sker mot. Anges som kommaseparerad lista.">
                    (?)
                  </abbr>
                </label>
                <input
                  type="text"
                  ref="input_searchFields"
                  onChange={(e) => {
                    this.setState(
                      {
                        searchFields: e.target.value,
                      },
                      () => this.validateField("searchFields", true)
                    );
                  }}
                  value={this.state.searchFields}
                  className={this.getValidationClass("searchFields")}
                />
              </div>
              <div>
                <label>
                  Primära visningsfält{" "}
                  <abbr title="Visas i sökresultatlistan. Dessutom kan visas som etikett i kartan när användaren selekterat ett sökresultat, om 'Visa resultat i kartan' är aktivt för sökverktyget. Anges som kommaseparerad lista.">
                    (?)
                  </abbr>
                </label>
                <input
                  type="text"
                  ref="input_displayFields"
                  onChange={(e) => {
                    this.setState(
                      {
                        displayFields: e.target.value,
                      },
                      () => this.validateField("displayFields", true)
                    );
                  }}
                  value={this.state.displayFields}
                  className={this.getValidationClass("displayFields")}
                />
              </div>
              <div>
                <label>
                  Sekundära visningsfält{" "}
                  <abbr title="Visas i sökresultat med något mindre text, under de primära visningsfälten. Anges som kommaseparerad lista.">
                    (?)
                  </abbr>
                </label>
                <input
                  type="text"
                  ref="input_secondaryLabelFields"
                  onChange={(e) => {
                    this.setState(
                      {
                        secondaryLabelFields: e.target.value,
                      },
                      () => this.validateField("secondaryLabelFields", true)
                    );
                  }}
                  value={this.state.secondaryLabelFields}
                  className={this.getValidationClass("secondaryLabelFields")}
                />
              </div>
              <div>
                <label>
                  Visningsfält i kartan{" "}
                  <abbr title="Visas som etikett bredvid sökresultat i ett första läge, om 'Visa resultat i kartan' är aktivt för sökverktyget. Anges som kommaseparerad lista.">
                    (?)
                  </abbr>
                </label>
                <input
                  type="text"
                  ref="input_shortDisplayFields"
                  onChange={(e) => {
                    this.setState(
                      {
                        shortDisplayFields: e.target.value,
                      },
                      () => this.validateField("shortDisplayFields", true)
                    );
                  }}
                  value={this.state.shortDisplayFields}
                  className={this.getValidationClass("shortDisplayFields")}
                />
              </div>
              <div>
                <label>Geometrifält</label>
                <input
                  type="text"
                  ref="input_geometryField"
                  onChange={(e) => {
                    this.setState(
                      {
                        geometryField: e.target.value,
                      },
                      () => this.validateField("geometryField", true)
                    );
                  }}
                  value={this.state.geometryField}
                  className={this.getValidationClass("geometryField")}
                />
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
        <div className="details">{this.renderLayerProperties()}</div>
      </section>
    );
  }
}

export default Search;
