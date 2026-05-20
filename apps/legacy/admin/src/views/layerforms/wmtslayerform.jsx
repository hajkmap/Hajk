import React from "react";
import { Component } from "react";
import $ from "jquery";

// X2JS keeps namespace-prefixed elements (e.g. ows:Title) as objects
// { __text: "value", __prefix: "ows" } instead of plain strings.
function textValue(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val.__text != null) return String(val.__text);
  return String(val);
}

// Normalize CRS identifiers to "EPSG:CODE" format for OpenLayers.
// Handles OGC URN, OGC HTTP URI, and pass-through for already correct values.
function crsToEpsg(crs) {
  if (!crs) return "";
  var s = String(crs);
  var urn = s.match(/urn:ogc:def:crs:(\w+)::(\w+)/);
  if (urn) return urn[1] + ":" + urn[2];
  var uri = s.match(/\/def\/crs\/(\w+)\/\w+\/(\w+)/);
  if (uri) return uri[1] + ":" + uri[2];
  return s;
}

const defaultState = {
  load: false,
  imageLoad: false,
  validationErrors: [],
  id: "",
  caption: "",
  content: "",
  date: "Fylls i per automatik",
  infobox: "",
  legend: "",
  legendIcon: "",
  url: "",
  capabilitiesUrl: "",
  queryable: true,
  drawOrder: 1,
  layer: "",
  matrixSet: "",
  style: "default",
  requestEncoding: "REST",
  imageFormat: "",
  selectedResource: "",
  projection: "EPSG:3006",
  origins: "-1200000 8500000",
  resolutions: [4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
  matrixIds: [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
  ],
  sizes: "",
  tileSize: "",
  crossOrigin: "",
  layerType: "WMTS",
  attribution: "",
  infoVisible: false,
  infoTitle: "",
  infoText: "",
  infoUrl: "",
  infoUrlText: "",
  infoOpenDataLink: "",
  infoOwner: "",
  timeSliderVisible: false,
  timeSliderStart: "",
  timeSliderEnd: "",
  maxZoom: -1,
  minZoom: -1,
  wmtsCapabilities: null,
  wmtsLayers: [],
  wmtsTileMatrixSets: [],
  availableMatrixSets: [],
  availableResources: [],
};

/**
 *
 */
class WMTSLayerForm extends Component {
  componentDidMount() {
    defaultState.capabilitiesUrl =
      this.props.capabilitiesUrl || this.props.url || "";
    this.setState(defaultState);
    this.props.model.on("change:select-image", () => {
      this.setState({
        legend: this.props.model.get("select-image"),
      });
    });
    this.props.model.on("change:select-legend-icon", () => {
      this.setState({
        legendIcon: this.props.model.get("select-legend-icon"),
      });
    });
  }

  componentWillUnmount() {
    this.props.model.off("change:select-image");
    this.props.model.off("change:select-legend-icon");
  }

  constructor() {
    super();
    this.state = defaultState;
    this.layer = {};
  }

  loadLegend(e) {
    $("#select-image").attr("caller", "select-image");
    $("#select-image").trigger("click");
  }

  loadLegendIcon(e) {
    $("#select-legend-icon").attr("caller", "select-legend-icon");
    $("#select-legend-icon").trigger("click");
  }

  fetchCapabilities() {
    return this.props.model
      .getAllWMTSCapabilities(this.state.capabilitiesUrl)
      .then((capabilities) => {
        var layers = capabilities.Contents?.Layer || [];
        var tileMatrixSets = capabilities.Contents?.TileMatrixSet || [];

        if (!Array.isArray(layers)) {
          layers = [layers];
        }
        if (!Array.isArray(tileMatrixSets)) {
          tileMatrixSets = [tileMatrixSets];
        }

        return { capabilities, layers, tileMatrixSets };
      });
  }

  deriveLayerOptions(layers, layerIdentifier) {
    var selectedLayer = layers.find(
      (l) => textValue(l.Identifier) === layerIdentifier,
    );
    if (!selectedLayer) {
      return { availableMatrixSets: [], availableResources: [] };
    }

    var links = selectedLayer.TileMatrixSetLink || [];
    if (!Array.isArray(links)) {
      links = [links];
    }
    var availableMatrixSets = links.map((link) =>
      textValue(link.TileMatrixSet),
    );

    var resources = selectedLayer.ResourceURL || [];
    if (!Array.isArray(resources)) {
      resources = [resources];
    }
    var availableResources = [];
    resources
      .filter((r) => r._resourceType === "tile")
      .forEach((r) => {
        var format = textValue(r._format);
        var template = textValue(r._template);
        if (!format) return;
        availableResources.push({
          format,
          template: template || "",
        });
      });

    if (availableResources.length === 0) {
      var formats = selectedLayer.Format || [];
      if (!Array.isArray(formats)) {
        formats = [formats];
      }
      availableResources = formats.map((f) => ({
        format: textValue(f),
        template: "",
      }));
    }

    return { availableMatrixSets, availableResources };
  }

  loadWMTSCapabilities(e) {
    if (e) {
      e.preventDefault();
    }

    this.setState({ load: true });

    this.fetchCapabilities()
      .then(({ capabilities, layers, tileMatrixSets }) => {
        this.setState({
          load: false,
          wmtsCapabilities: capabilities,
          wmtsLayers: layers,
          wmtsTileMatrixSets: tileMatrixSets,
          layer: "",
          matrixSet: "",
          selectedResource: "",
          requestEncoding: "REST",
          imageFormat: "",
          url: "",
          availableMatrixSets: [],
          availableResources: [],
        });
      })
      .catch((err) => {
        console.error("WMTS GetCapabilities failed:", err);
        this.setState({
          load: false,
          wmtsLayers: [],
          wmtsTileMatrixSets: [],
        });
        if (this.props.parent) {
          this.props.parent.setState({
            alert: true,
            alertMessage:
              "Servern svarar inte eller blockeras av CORS.\nFörsök med en annan URL.",
          });
        }
      });
  }

  loadLayerState(savedState) {
    this.setState({ ...savedState, load: true });

    this.fetchCapabilities()
      .then(({ capabilities, layers, tileMatrixSets }) => {
        var options = this.deriveLayerOptions(layers, savedState.layer);
        var selectedResourceIndex = options.availableResources.findIndex(
          (resource) =>
            resource.format === savedState.imageFormat &&
            resource.template === savedState.url,
        );
        var inferredRequestEncoding =
          /\{TileMatrix\}|\{TileRow\}|\{TileCol\}/i.test(savedState.url || "")
            ? "REST"
            : "KVP";

        this.setState({
          load: false,
          wmtsCapabilities: capabilities,
          wmtsLayers: layers,
          wmtsTileMatrixSets: tileMatrixSets,
          selectedResource:
            selectedResourceIndex >= 0 ? String(selectedResourceIndex) : "",
          requestEncoding:
            savedState.requestEncoding || inferredRequestEncoding,
          ...options,
        });
      })
      .catch((err) => {
        console.error("WMTS GetCapabilities failed:", err);
        this.setState({ load: false });
      });
  }

  onLayerChange(identifier) {
    if (!identifier) {
      this.setState({
        layer: "",
        matrixSet: "",
        selectedResource: "",
        requestEncoding: "REST",
        imageFormat: "",
        url: "",
        availableMatrixSets: [],
        availableResources: [],
      });
      return;
    }

    var options = this.deriveLayerOptions(this.state.wmtsLayers, identifier);

    this.setState({
      layer: identifier,
      matrixSet: "",
      selectedResource: "",
      requestEncoding: "REST",
      imageFormat: "",
      url: "",
      ...options,
    });
  }

  getLayer() {
    return {
      type: this.state.layerType,
      id: this.state.id,
      caption: this.getValue("caption"),
      url: this.getValue("url"),
      capabilitiesUrl: this.getValue("capabilitiesUrl"),
      date: this.getValue("date"),
      content: this.getValue("content"),
      legend: this.getValue("legend"),
      legendIcon: this.getValue("legendIcon"),
      layer: this.getValue("layer"),
      matrixSet: this.getValue("matrixSet"),
      style: this.getValue("style"),
      requestEncoding: this.getValue("requestEncoding"),
      imageFormat: this.getValue("imageFormat"),
      projection: this.getValue("projection"),
      origins: this.getValue("origins"),
      resolutions: this.getValue("resolutions"),
      matrixIds: this.getValue("matrixIds"),
      sizes: this.getValue("sizes"),
      tileSize: this.getValue("tileSize"),
      crossOrigin: this.getValue("crossOrigin"),
      attribution: this.getValue("attribution"),
      infoVisible: this.getValue("infoVisible"),
      infoTitle: this.getValue("infoTitle"),
      infoText: this.getValue("infoText"),
      infoUrl: this.getValue("infoUrl"),
      infoUrlText: this.getValue("infoUrlText"),
      infoOpenDataLink: this.getValue("infoOpenDataLink"),
      infoOwner: this.getValue("infoOwner"),
      timeSliderVisible: this.getValue("timeSliderVisible"),
      timeSliderStart: this.getValue("timeSliderStart"),
      timeSliderEnd: this.getValue("timeSliderEnd"),
      maxZoom: this.getValue("maxZoom"),
      minZoom: this.getValue("minZoom"),
    };
  }

  getValue(fieldName) {
    function create_date() {
      return new Date().getTime().toString();
    }

    function format_layers(layers) {
      return layers.map((layer) => layer);
    }

    var input = this.refs["input_" + fieldName],
      value = input ? input.value : "";

    // We must cast the following to Number, as String won't be accepted for those:
    if (["maxZoom", "minZoom"].indexOf(fieldName) > -1) {
      value = Number(value);
      return value === 0 ? -1 : value;
    }

    if (fieldName === "date") value = create_date();
    if (fieldName === "layers") value = format_layers(this.state.addedLayers);
    if (fieldName === "singleTile") value = input.checked;
    if (fieldName === "imageFormat") value = input.value;
    if (fieldName === "queryable") value = input.checked;
    if (fieldName === "tiled") value = input.checked;
    if (fieldName === "searchFields") value = value.split(",");
    if (fieldName === "displayFields") value = value.split(",");
    if (fieldName === "origins")
      value = value
        .split(";")
        .map((pair) => pair.trim().split(/[\s,]+/))
        .filter((pair) => pair.length === 2 && pair[0] !== "");
    if (fieldName === "resolutions") value = value.split(",");
    if (fieldName === "matrixIds") value = value.split(",");
    if (fieldName === "sizes") {
      value = value
        .split(";")
        .map((pair) => pair.trim().split(/\s+/).map(Number))
        .filter(
          (pair) => pair.length === 2 && !isNaN(pair[0]) && !isNaN(pair[1]),
        );
      if (value.length === 0) value = undefined;
    }
    if (fieldName === "tileSize") {
      var parts = value.trim().split(/\s+/).map(Number);
      if (parts.length === 1 && !isNaN(parts[0]) && parts[0] > 0) {
        value = parts[0];
      } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        value = parts;
      } else {
        value = undefined;
      }
    }
    if (fieldName === "crossOrigin")
      value = value.trim() === "" ? undefined : value;
    if (fieldName === "infoVisible") value = input.checked;
    if (fieldName === "timeSliderVisible") value = input.checked;

    return value;
  }

  validate() {
    var validationFields = [
      "url",
      "capabilitiesUrl",
      "caption",
      "layer",
      "matrixSet",
      "projection",
      "origins",
      "resolutions",
      "matrixIds",
    ];
    var errors = [];

    validationFields.forEach((field) => {
      var valid = this.validateField(field, false, false);
      if (!valid) {
        errors.push(field);
      }
    });

    this.setState({
      validationErrors: errors,
    });

    return errors.length === 0;
  }

  validateField(fieldName, forcedValue, updateState) {
    var value = this.getValue(fieldName),
      valid = true;

    function number(v) {
      return !empty(v) && !isNaN(Number(v));
    }

    function empty(v) {
      return typeof v === "string"
        ? v.trim() === ""
        : Array.isArray(v)
        ? v[0] === ""
        : false;
    }

    switch (fieldName) {
      case "origins":
        if (value.length === 0) {
          valid = false;
        }
        break;
      case "resolutions":
      case "matrixIds":
        if (value.length === 1 && value[0] === "") {
          valid = false;
        }
        break;
      case "capabilitiesUrl":
      case "url":
      case "caption":
      case "layer":
      case "matrixSet":
      case "projection":
        if (value === "") {
          valid = false;
        }
        break;
      case "minZoom":
      case "maxZoom":
        if (!number(value) || empty(value)) {
          valid = false;
        }
        break;
      default:
        valid = true;
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
            (v) => v !== fieldName,
          ),
        });
      }
    }

    return valid;
  }

  getValidationClass(inputName) {
    return this.state.validationErrors.find((v) => v === inputName)
      ? "validation-error"
      : "";
  }

  render() {
    const imageLoader = this.state.imageLoad ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    const loader = this.state.load ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    const infoClass = this.state.infoVisible ? "tooltip-info" : "hidden";
    const timeSliderClass = this.state.timeSliderVisible
      ? "tooltip-timeSlider"
      : "hidden";

    return (
      <fieldset>
        <legend>WMTS-lager</legend>
        <div className="separator">Val av lager</div>
        <div>
          <label>CapabilitiesUrl*</label>
          <input
            type="text"
            ref="input_capabilitiesUrl"
            value={this.state.capabilitiesUrl}
            className={this.getValidationClass("capabilitiesUrl")}
            onChange={(e) => {
              this.setState({ capabilitiesUrl: e.target.value }, () =>
                this.validateField("capabilitiesUrl"),
              );
            }}
          />
          <span
            onClick={(e) => {
              this.loadWMTSCapabilities(e);
            }}
            className="btn btn-default"
          >
            Hämta {loader}
          </span>
        </div>
        <div>
          <label>Lager*</label>
          <select
            ref="input_layer"
            value={this.state.layer}
            className={this.getValidationClass("layer")}
            style={{ width: "400px" }}
            onChange={(e) => {
              this.onLayerChange(e.target.value);
              this.validateField("layer");
            }}
          >
            <option value="">Välj lager...</option>
            {this.state.wmtsLayers.map((l, i) => (
              <option key={i} value={textValue(l.Identifier)}>
                {textValue(l.Title) || textValue(l.Identifier)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Visningsnamn*</label>
          <input
            type="text"
            ref="input_caption"
            value={this.state.caption}
            className={this.getValidationClass("caption")}
            onChange={(e) => {
              this.setState({ caption: e.target.value }, () =>
                this.validateField("caption"),
              );
            }}
          />
        </div>
        <div>
          <label>Teckenförklaring</label>
          <input
            type="text"
            ref="input_legend"
            value={this.state.legend}
            onChange={(e) => this.setState({ legend: e.target.value })}
          />
          <span
            onClick={(e) => {
              this.loadLegend(e);
            }}
            className="btn btn-default"
          >
            Välj fil {imageLoader}
          </span>
        </div>
        <div>
          <label>
            Teckenförklar
            <br />
            ingsikon
          </label>
          <input
            type="text"
            ref="input_legendIcon"
            value={this.state.legendIcon}
            onChange={(e) => this.setState({ legendIcon: e.target.value })}
          />
          <span
            onClick={(e) => {
              this.loadLegendIcon(e);
            }}
            className="btn btn-default"
          >
            Välj fil {imageLoader}
          </span>
        </div>
        <div>
          <label>
            Min zoom{" "}
            <abbr title="Lägsta zoomnivå där lagret visas. OBS! Om man vill att lagret ska visas för skala 1:10 000, 1:5 000, 1:2 000 osv måste man ange den zoomnivå som skalsteget ovanför skala 1:10 000 har (t ex 1:20 000). Om 5 motsvarar 1:10 000 ska man då ange 4. Värdet på zoomnivån beror på aktuella inställningar i map_1.json, avsnitt ”map.resolutions”. '-1' betyder att lagret är synligt hela vägen till den lägsta zoomnivån. Se även inställning för Max zoom.">
              (?)
            </abbr>
          </label>
          <input
            type="number"
            step="1"
            min="-1"
            max="100"
            ref="input_minZoom"
            value={this.state.minZoom}
            className={
              (this.getValidationClass("minZoom"), "control-fixed-width")
            }
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ minZoom: v });
            }}
          />
        </div>
        <div>
          <label>
            Max zoom{" "}
            <abbr title="Högsta zoomnivå vid vilket lagret visas. Om man t ex anger 5 för skala 1:10 000 kommer lagret att visas för skala 1:10 000 men inte för skala 1:5000. Värdet på zoomnivån beror på aktuella inställningar i map_1.json, avsnitt ”map.resolutions”. '-1' betyder att lagret är synligt hela vägen till den sista zoomnivån. Se även inställning för Min zoom.">
              (?)
            </abbr>
          </label>
          <input
            type="number"
            step="1"
            min="-1"
            max="100"
            ref="input_maxZoom"
            value={this.state.maxZoom}
            className={
              (this.getValidationClass("minZoom"), "control-fixed-width")
            }
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ maxZoom: v }, () =>
                this.validateField("maxZoom"),
              );
            }}
          />
        </div>
        <div className="separator">Inställningar för request</div>
        <div>
          <label>Matrisuppsättning (matrixSet)*</label>
          <select
            ref="input_matrixSet"
            value={this.state.matrixSet}
            className={this.getValidationClass("matrixSet")}
            onChange={(e) => {
              const v = e.target.value;
              var stateUpdate = { matrixSet: v };
              if (v) {
                var fullSet = this.state.wmtsTileMatrixSets.find(
                  (tms) => textValue(tms.Identifier) === v,
                );
                if (fullSet) {
                  var projection = crsToEpsg(textValue(fullSet.SupportedCRS));
                  if (projection) {
                    stateUpdate.projection = projection;
                  }
                  var matrices = fullSet.TileMatrix || [];
                  if (!Array.isArray(matrices)) {
                    matrices = [matrices];
                  }
                  if (matrices.length > 0) {
                    // WMTS may report TopLeftCorner in CRS axis order.
                    // Swap only when the first value is positive.
                    stateUpdate.origins = matrices
                      .map((m) => {
                        var parts = textValue(m.TopLeftCorner)
                          .trim()
                          .split(/\s+/);
                        if (parts.length !== 2) {
                          return textValue(m.TopLeftCorner).trim();
                        }
                        var firstValue = Number(parts[0]);
                        return !Number.isNaN(firstValue) && firstValue > 0
                          ? parts[1] + " " + parts[0]
                          : parts[0] + " " + parts[1];
                      })
                      .filter(Boolean)
                      .join("; ");
                    stateUpdate.matrixIds = matrices
                      .map((m) => textValue(m.Identifier))
                      .join(",");
                    stateUpdate.resolutions = matrices
                      .map(
                        (m) => Number(textValue(m.ScaleDenominator)) * 0.00028,
                      )
                      .join(",");
                    stateUpdate.sizes = matrices
                      .map(
                        (m) =>
                          textValue(m.MatrixWidth) +
                          " " +
                          textValue(m.MatrixHeight),
                      )
                      .filter((s) => s.trim() !== "")
                      .join("; ");
                    var tw = textValue(matrices[0].TileWidth);
                    var th = textValue(matrices[0].TileHeight);
                    if (tw && th) {
                      stateUpdate.tileSize = tw === th ? tw : tw + " " + th;
                    }
                  }
                }
              }
              this.setState(stateUpdate, () =>
                this.validateField("matrixSet", v),
              );
            }}
          >
            <option value="">Välj matrisuppsättning...</option>
            {this.state.availableMatrixSets.map((name, i) => (
              <option key={i} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Resource</label>
          <select
            ref="input_resource"
            value={this.state.selectedResource}
            style={{ width: "400px" }}
            onChange={(e) => {
              const selectedResource = e.target.value;
              const selectedIndex = Number(selectedResource);
              const resource = this.state.availableResources[selectedIndex];
              const imageFormat = resource ? resource.format : "";
              const url = resource ? resource.template : "";
              const requestEncoding =
                resource && resource.template ? "REST" : "KVP";
              this.setState(
                { selectedResource, imageFormat, requestEncoding, url },
                () => this.validateField("url"),
              );
            }}
          >
            <option value="">Välj resource...</option>
            {this.state.availableResources.map((resource, i) => (
              <option key={i} value={String(i)}>
                {resource.format + " @ " + (resource.template || "")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Format (imageFormat)</label>
          <input
            type="text"
            ref="input_imageFormat"
            value={this.state.imageFormat}
            onChange={(e) => {
              this.setState({ imageFormat: e.target.value });
            }}
          />
        </div>
        <div>
          <label>Request encoding</label>
          <select
            ref="input_requestEncoding"
            value={this.state.requestEncoding}
            onChange={(e) => {
              this.setState({ requestEncoding: e.target.value });
            }}
          >
            <option value="REST">REST</option>
            <option value="KVP">KVP</option>
          </select>
        </div>
        <div>
          <label>Url*</label>
          <input
            type="text"
            ref="input_url"
            value={this.state.url}
            className={this.getValidationClass("url")}
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ url: v }, () => this.validateField("url", v));
            }}
          />
        </div>
        <div>
          <label>Projektion (projection)*</label>
          <input
            type="text"
            ref="input_projection"
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ projection: v }, () =>
                this.validateField("projection", v),
              );
            }}
            value={this.state.projection}
            className={this.getValidationClass("projection")}
          />
        </div>
        <div>
          <label>Startkoordinater (origins)*</label>
          <input
            type="text"
            ref="input_origins"
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ origins: v }, () =>
                this.validateField("origins", v),
              );
            }}
            value={this.state.origins}
            className={this.getValidationClass("origins")}
          />
        </div>
        <div>
          <label>Upplösningar (resolutions)*</label>
          <input
            type="text"
            ref="input_resolutions"
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ resolutions: v }, () =>
                this.validateField("resolutions", v),
              );
            }}
            value={this.state.resolutions}
            className={this.getValidationClass("resolutions")}
          />
        </div>
        <div>
          <label>Matrisnivåer (matrixIds)*</label>
          <input
            type="text"
            ref="input_matrixIds"
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ matrixIds: v }, () =>
                this.validateField("matrixIds", v),
              );
            }}
            value={this.state.matrixIds}
            className={this.getValidationClass("matrixIds")}
          />
        </div>
        <div>
          <label>Storlekar (sizes)</label>
          <input
            type="text"
            ref="input_sizes"
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ sizes: v });
            }}
            value={this.state.sizes}
          />
        </div>
        <div>
          <label>Rutstorlek (tileSize)</label>
          <input
            type="text"
            ref="input_tileSize"
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ tileSize: v });
            }}
            value={this.state.tileSize}
          />
        </div>
        <div>
          <label>Stilsättning</label>
          <input
            type="text"
            ref="input_style"
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ style: v }, () => this.validateField("style", v));
            }}
            value={this.state.style}
            className={this.getValidationClass("style")}
          />
        </div>
        <div>
          <label>Cross origin</label>
          <select
            ref="input_crossOrigin"
            value={this.state.crossOrigin || ""}
            onChange={(e) => {
              this.setState({ crossOrigin: e.target.value });
            }}
          >
            <option value="">Ej satt</option>
            <option value="anonymous">anonymous</option>
            <option value="use-credentials">use-credentials</option>
          </select>
        </div>
        <div className="separator">Metadata</div>
        <div>
          <label>Innehåll</label>
          <input
            type="text"
            ref="input_content"
            value={this.state.content}
            onChange={(e) => {
              this.setState({ content: e.target.value });
            }}
          />
        </div>
        <div>
          <label>Senast ändrad</label>
          <span ref="input_date">
            <i>{this.props.model.parseDate(this.state.date)}</i>
          </span>
        </div>
        <div>
          <label>Upphovsrätt</label>
          <input
            type="text"
            ref="input_attribution"
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ attribution: e.target.value }, () =>
                this.validateField("attribution", v),
              );
            }}
            value={this.state.attribution}
            className={this.getValidationClass("attribution")}
          />
        </div>
        <div className="info-container">
          <div>
            <input
              type="checkbox"
              ref="input_infoVisible"
              id="info-document"
              onChange={(e) => {
                this.setState({ infoVisible: e.target.checked });
              }}
              checked={this.state.infoVisible}
            />
            &nbsp;
            <label htmlFor="info-document">Infodokument</label>
          </div>
          <div className={infoClass}>
            <label>Rubrik</label>
            <input
              type="text"
              ref="input_infoTitle"
              onChange={(e) => {
                const v = e.target.value;
                this.setState({ infoTitle: v }, () =>
                  this.validateField("infoTitle", v),
                );
              }}
              value={this.state.infoTitle}
              className={this.getValidationClass("infoTitle")}
            />
          </div>
          <div className={infoClass}>
            <label>Text</label>
            <textarea
              type="text"
              ref="input_infoText"
              onChange={(e) => {
                const v = e.target.value;
                this.setState({ infoText: v }, () =>
                  this.validateField("infoText", v),
                );
              }}
              value={this.state.infoText}
              className={this.getValidationClass("infoText")}
            />
          </div>
          <div className={infoClass}>
            <label>Länk (ex. till PDF)</label>
            <input
              type="text"
              ref="input_infoUrl"
              onChange={(e) => {
                const v = e.target.value;
                this.setState({ infoUrl: v }, () =>
                  this.validateField("infoUrl", v),
                );
              }}
              value={this.state.infoUrl}
              className={this.getValidationClass("infoUrl")}
            />
          </div>
          <div className={infoClass}>
            <label>Länktext</label>
            <input
              type="text"
              ref="input_infoUrlText"
              onChange={(e) => {
                const v = e.target.value;
                this.setState({ infoUrlText: v }, () =>
                  this.validateField("infoUrlText", v),
                );
              }}
              value={this.state.infoUrlText}
              className={this.getValidationClass("infoUrlText")}
            />
          </div>
          <div className={infoClass}>
            <label>Länk till öppna data</label>
            <input
              type="text"
              ref="input_infoOpenDataLink"
              onChange={(e) => {
                const v = e.target.value;
                this.setState({ infoOpenDataLink: v }, () =>
                  this.validateField("infoOpenDataLink", v),
                );
              }}
              value={this.state.infoOpenDataLink}
              className={this.getValidationClass("infoOpenDataLink")}
            />
          </div>
          <div className={infoClass}>
            <label>Ägare</label>
            <input
              type="text"
              ref="input_infoOwner"
              onChange={(e) => {
                const v = e.target.value;
                this.setState({ infoOwner: v }, () =>
                  this.validateField("infoOwner", v),
                );
              }}
              value={this.state.infoOwner}
              className={this.getValidationClass("infoOwner")}
            />
          </div>
        </div>
        <div className="timeSlider-container">
          <div>
            <input
              type="checkbox"
              ref="input_timeSliderVisible"
              id="timeSlider"
              onChange={(e) => {
                this.setState({ timeSliderVisible: e.target.checked });
              }}
              checked={this.state.timeSliderVisible}
            />
            &nbsp;
            <label htmlFor="timeSlider">Tidslinjedatum</label>
          </div>
          <div className={timeSliderClass}>
            <label>Tidslinje start</label>
            <input
              type="text"
              placeholder="ÅÅÅÅMMDD"
              ref="input_timeSliderStart"
              onChange={(e) => {
                this.setState({ timeSliderStart: e.target.value });
              }}
              value={this.state.timeSliderStart}
            />
          </div>
          <div className={timeSliderClass}>
            <label>Tidslinje slut</label>
            <input
              type="text"
              placeholder="ÅÅÅÅMMDD"
              ref="input_timeSliderEnd"
              onChange={(e) => {
                this.setState({ timeSliderEnd: e.target.value });
              }}
              value={this.state.timeSliderEnd}
            />
          </div>
        </div>
      </fieldset>
    );
  }
}

export default WMTSLayerForm;
