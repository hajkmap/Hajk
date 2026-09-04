import React from "react";
import { Component } from "react";
import $ from "jquery";

// X2JS keeps namespace-prefixed elements (e.g. ows:Title) as objects
// { __text: "value", __prefix: "ows" } instead of plain strings. An empty prefixed
// element such as <ows:Identifier/> yields { __prefix: "ows" } with no __text at all,
// which is legal in WMTS - GeoServer uses it for the empty default style.
function textValue(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return val.__text != null ? String(val.__text) : "";
  }
  return String(val);
}

// X2JS keeps the namespace prefix on attribute names (unlike element names, where
// the local name is used), so xlink:href ends up as "_xlink:href".
function attrValue(obj) {
  if (!obj) return "";
  for (var i = 1; i < arguments.length; i++) {
    var v = obj["_" + arguments[i]];
    if (v != null) return String(v);
  }
  return "";
}

// X2JS only produces arrays for the paths listed in arrayAccessFormPaths, and even
// those are absent when the element is missing altogether.
function toArray(val) {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
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

// "FORMAT_OPTIONS=dpi:90; TIME=2020" <-> { FORMAT_OPTIONS: "dpi:90", TIME: "2020" }
function parseDimensions(str) {
  var result = {};
  String(str || "")
    .split(";")
    .forEach((part) => {
      var eq = part.indexOf("=");
      if (eq < 1) return;
      var key = part.slice(0, eq).trim();
      var value = part.slice(eq + 1).trim();
      if (key !== "") result[key] = value;
    });
  return result;
}

function stringifyDimensions(obj) {
  if (!obj) return "";
  return Object.keys(obj)
    .map((key) => key + "=" + obj[key])
    .join("; ");
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
  layer: "",
  matrixSet: "",
  style: "",
  requestEncoding: "REST",
  imageFormat: "",
  dimensions: "",
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
  rotateMap: "n",
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
  availableStyles: [],
  availableDimensions: [],
  matrixSetLimits: {},
  getTileBaseUrl: "",
  allowedGetTileEncodings: [],
  urlWarning: "",
};

// Fallback when a server advertises no <Style> at all for a layer. WMTS requires a
// style identifier in both KVP and REST requests, and "default" is the conventional one.
const FALLBACK_STYLE = { id: "default", isDefault: true, legendUrl: "" };

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
        var layers = toArray(capabilities.Contents?.Layer);
        var tileMatrixSets = toArray(capabilities.Contents?.TileMatrixSet);

        return {
          capabilities,
          layers,
          tileMatrixSets,
          ...this.deriveServiceOptions(capabilities),
        };
      });
  }

  // Service-wide info from OperationsMetadata: where GetTile lives and which request
  // encodings the server actually advertises for it.
  deriveServiceOptions(capabilities) {
    var operations = toArray(capabilities.OperationsMetadata?.Operation);
    var getTile = operations.find((o) => o._name === "GetTile");
    var gets = toArray(getTile?.DCP?.HTTP?.Get);

    var getTileBaseUrl = "";
    var allowedGetTileEncodings = [];

    gets.forEach((get) => {
      var href = attrValue(get, "xlink:href", "href");
      if (href && !getTileBaseUrl) {
        getTileBaseUrl = href.replace(/\?$/, "");
      }
      toArray(get.Constraint)
        .filter((c) => c._name === "GetEncoding")
        .forEach((c) => {
          toArray(c.AllowedValues?.Value).forEach((v) => {
            var value = textValue(v).toUpperCase();
            if (value && allowedGetTileEncodings.indexOf(value) === -1) {
              allowedGetTileEncodings.push(value);
            }
          });
        });
    });

    // Fall back to the capabilities URL without its query string.
    if (!getTileBaseUrl) {
      getTileBaseUrl = String(this.state.capabilitiesUrl || "").split("?")[0];
    }

    return { getTileBaseUrl, allowedGetTileEncodings };
  }

  deriveLayerOptions(layers, layerIdentifier) {
    var empty = {
      availableMatrixSets: [],
      availableResources: [],
      availableStyles: [],
      availableDimensions: [],
      matrixSetLimits: {},
      title: "",
      abstract: "",
    };

    var selectedLayer = layers.find(
      (l) => textValue(l.Identifier) === layerIdentifier,
    );
    if (!selectedLayer) {
      return empty;
    }

    var links = toArray(selectedLayer.TileMatrixSetLink);
    var availableMatrixSets = links.map((link) =>
      textValue(link.TileMatrixSet),
    );

    // Per-matrix-set tile limits, keyed by matrix set name and then by TileMatrix
    // identifier. Keying by identifier (not array position) matters, since the
    // resulting sizes must line up with the matrixIds taken from the TileMatrixSet.
    var matrixSetLimits = {};
    links.forEach((link) => {
      var name = textValue(link.TileMatrixSet);
      var limits = toArray(link.TileMatrixSetLimits?.TileMatrixLimits);
      if (!name || limits.length === 0) return;
      matrixSetLimits[name] = {};
      limits.forEach((limit) => {
        matrixSetLimits[name][textValue(limit.TileMatrix)] = {
          maxTileCol: Number(textValue(limit.MaxTileCol)),
          maxTileRow: Number(textValue(limit.MaxTileRow)),
        };
      });
    });

    var availableResources = [];
    toArray(selectedLayer.ResourceURL)
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
      availableResources = toArray(selectedLayer.Format).map((f) => ({
        format: textValue(f),
        template: "",
      }));
    }

    var availableStyles = toArray(selectedLayer.Style).map((s) => ({
      // An empty <ows:Identifier/> is legal and yields "" here.
      id: textValue(s.Identifier),
      isDefault: s._isDefault === "true",
      legendUrl: attrValue(toArray(s.LegendURL)[0], "xlink:href", "href"),
    }));
    if (availableStyles.length === 0) {
      availableStyles = [FALLBACK_STYLE];
    }

    var availableDimensions = toArray(selectedLayer.Dimension).map((d) => ({
      id: textValue(d.Identifier),
      defaultValue: textValue(d.Default),
      values: toArray(d.Value).map(textValue),
    }));

    return {
      availableMatrixSets,
      availableResources,
      availableStyles,
      availableDimensions,
      matrixSetLimits,
      title: textValue(selectedLayer.Title),
      abstract: textValue(selectedLayer.Abstract),
    };
  }

  // REST when the server hands us a tile template, otherwise the KVP flavour it
  // advertises. Beats the previously hardcoded "REST".
  defaultRequestEncoding(options) {
    var hasTemplate = (options.availableResources || []).some(
      (r) => r.template,
    );
    if (hasTemplate) return "REST";
    return this.state.allowedGetTileEncodings.indexOf("KVP") > -1
      ? "KVP_TEMPLATE"
      : "KVP";
  }

  // A KVP GetTile query string where the per-tile parameters are left as
  // {placeholders}. OpenLayers substitutes {Layer}, {Style} and {TileMatrixSet} when
  // the source is built and the rest per tile. FORMAT has to be literal - OL does not
  // expose it to the template.
  buildKvpTemplateUrl(overrides) {
    var s = { ...this.state, ...overrides };
    if (!s.getTileBaseUrl) return s.url;

    var params = [
      "SERVICE=WMTS",
      "REQUEST=GetTile",
      "VERSION=1.0.0",
      "LAYER={Layer}",
      "STYLE={Style}",
      "FORMAT=" + (s.imageFormat || "image/png"),
      "TILEMATRIXSET={TileMatrixSet}",
      "TILEMATRIX={TileMatrix}",
      "TILEROW={TileRow}",
      "TILECOL={TileCol}",
    ];

    var dimensions = parseDimensions(s.dimensions);
    Object.keys(dimensions).forEach((key) => {
      params.push(key + "={" + key + "}");
    });

    return s.getTileBaseUrl + "?" + params.join("&");
  }

  // The Url field is derived from the encoding, but stays hand-editable afterwards.
  urlForRequestEncoding(requestEncoding, overrides) {
    var s = { ...this.state, ...overrides };
    if (requestEncoding === "KVP_TEMPLATE") {
      return this.buildKvpTemplateUrl(overrides);
    }
    if (requestEncoding === "KVP") {
      return s.getTileBaseUrl || s.url;
    }
    var resource = s.availableResources[Number(s.selectedResource)];
    return resource && resource.template ? resource.template : s.url;
  }

  // Applies a state patch and re-derives the Url when the current encoding generates
  // it. Other encodings keep whatever is in the field, so hand edits survive.
  refreshGeneratedUrl(patch) {
    var next = { ...patch };
    var encoding = next.requestEncoding || this.state.requestEncoding;
    if (encoding === "KVP_TEMPLATE") {
      next.url = this.buildKvpTemplateUrl(next);
    }
    var url = next.url !== undefined ? next.url : this.state.url;
    next.urlWarning = this.urlWarningFor(url, encoding);
    this.setState(next, () => this.validateField("url"));
  }

  // Non-blocking hint: REST and KVP_TEMPLATE need {TileMatrix} in the URL, plain KVP
  // must not have it (OpenLayers appends those parameters itself).
  urlWarningFor(url, requestEncoding) {
    var hasPlaceholders = /\{TileMatrix\}/i.test(url || "");
    if (requestEncoding === "KVP" && hasPlaceholders) {
      return "Url innehåller {TileMatrix} men encoding är KVP. OpenLayers lägger själv till dessa parametrar.";
    }
    if (requestEncoding !== "KVP" && !hasPlaceholders) {
      return "Url saknar {TileMatrix}/{TileRow}/{TileCol} som krävs för vald encoding.";
    }
    return "";
  }

  loadWMTSCapabilities(e) {
    if (e) {
      e.preventDefault();
    }

    this.setState({ load: true });

    this.fetchCapabilities()
      .then((result) => {
        this.setState({
          load: false,
          wmtsCapabilities: result.capabilities,
          wmtsLayers: result.layers,
          wmtsTileMatrixSets: result.tileMatrixSets,
          getTileBaseUrl: result.getTileBaseUrl,
          allowedGetTileEncodings: result.allowedGetTileEncodings,
          layer: "",
          matrixSet: "",
          selectedResource: "",
          requestEncoding: "REST",
          imageFormat: "",
          dimensions: "",
          url: "",
          urlWarning: "",
          availableMatrixSets: [],
          availableResources: [],
          availableStyles: [],
          availableDimensions: [],
          matrixSetLimits: {},
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
      .then((result) => {
        // title/abstract are only used to prefill a *new* layer, never in edit mode.
        var { title, abstract, ...options } = this.deriveLayerOptions(
          result.layers,
          savedState.layer,
        );
        var selectedResourceIndex = options.availableResources.findIndex(
          (resource) =>
            resource.format === savedState.imageFormat &&
            resource.template === savedState.url,
        );

        var url = savedState.url || "";
        var hasPlaceholders = /\{TileMatrix\}|\{TileRow\}|\{TileCol\}/i.test(
          url,
        );
        var inferredRequestEncoding = !hasPlaceholders
          ? "KVP"
          : /[?&]SERVICE=WMTS/i.test(url)
            ? "KVP_TEMPLATE"
            : "REST";
        var requestEncoding =
          savedState.requestEncoding || inferredRequestEncoding;

        this.setState({
          load: false,
          wmtsCapabilities: result.capabilities,
          wmtsLayers: result.layers,
          wmtsTileMatrixSets: result.tileMatrixSets,
          getTileBaseUrl: result.getTileBaseUrl,
          allowedGetTileEncodings: result.allowedGetTileEncodings,
          selectedResource:
            selectedResourceIndex >= 0 ? String(selectedResourceIndex) : "",
          requestEncoding,
          urlWarning: this.urlWarningFor(url, requestEncoding),
          ...options,
        });
      })
      .catch((err) => {
        console.error("WMTS GetCapabilities failed:", err);
        this.setState({ load: false });
      });
  }

  // Attribution built from the service-level metadata, so the field isn't left empty.
  deriveAttribution() {
    var capabilities = this.state.wmtsCapabilities;
    if (!capabilities) return "";

    var parts = [];
    var provider = textValue(capabilities.ServiceProvider?.ProviderName);
    if (provider) parts.push(provider);
    var constraints = textValue(
      capabilities.ServiceIdentification?.AccessConstraints,
    );
    if (constraints && constraints.toUpperCase() !== "NONE") {
      parts.push(constraints);
    }
    return parts.join(" – ");
  }

  onLayerChange(identifier) {
    if (!identifier) {
      this.setState({
        layer: "",
        matrixSet: "",
        selectedResource: "",
        requestEncoding: "REST",
        imageFormat: "",
        dimensions: "",
        url: "",
        urlWarning: "",
        availableMatrixSets: [],
        availableResources: [],
        availableStyles: [],
        availableDimensions: [],
        matrixSetLimits: {},
      });
      return;
    }

    var { title, abstract, ...options } = this.deriveLayerOptions(
      this.state.wmtsLayers,
      identifier,
    );

    var defaultStyle =
      options.availableStyles.find((s) => s.isDefault) ||
      options.availableStyles[0];
    var resource = options.availableResources[0];
    var defaultDimensions = {};
    options.availableDimensions.forEach((d) => {
      if (d.id && d.defaultValue) defaultDimensions[d.id] = d.defaultValue;
    });

    var next = {
      ...options,
      layer: identifier,
      matrixSet: "",
      selectedResource: resource ? "0" : "",
      imageFormat: resource ? resource.format : "",
      dimensions: stringifyDimensions(defaultDimensions),
      style: defaultStyle ? defaultStyle.id : "",
    };
    next.requestEncoding = this.defaultRequestEncoding(options);
    next.url = this.urlForRequestEncoding(next.requestEncoding, next);
    next.urlWarning = this.urlWarningFor(next.url, next.requestEncoding);

    // Prefill metadata from the capabilities document, but never overwrite something
    // the user has already filled in.
    if (!this.state.caption && title) next.caption = title;
    if (!this.state.infoText && abstract) next.infoText = abstract;
    if (!this.state.legend && defaultStyle && defaultStyle.legendUrl) {
      next.legend = defaultStyle.legendUrl;
    }
    if (!this.state.attribution) {
      var attribution = this.deriveAttribution();
      if (attribution) next.attribution = attribution;
    }

    this.setState(next, () => {
      this.validateField("caption");
      this.validateField("url");
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
      dimensions: this.getValue("dimensions"),
      projection: this.getValue("projection"),
      origins: this.getValue("origins"),
      resolutions: this.getValue("resolutions"),
      matrixIds: this.getValue("matrixIds"),
      sizes: this.getValue("sizes"),
      tileSize: this.getValue("tileSize"),
      crossOrigin: this.getValue("crossOrigin"),
      rotateMap: this.getValue("rotateMap"),
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

    var input = this.refs["input_" + fieldName],
      value = input ? input.value : "";

    // We must cast the following to Number, as String won't be accepted for those:
    if (["maxZoom", "minZoom"].indexOf(fieldName) > -1) {
      value = Number(value);
      return value === 0 ? -1 : value;
    }

    if (fieldName === "date") value = create_date();
    if (fieldName === "dimensions") {
      value = parseDimensions(value);
      if (Object.keys(value).length === 0) value = undefined;
    }
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
      "imageFormat",
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
      case "imageFormat":
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

    // The style dropdown is driven by GetCapabilities, but a saved layer may carry a
    // style the current capabilities no longer advertise. Keep it selectable so that
    // merely opening the layer doesn't silently rewrite it.
    const styleOptions = this.state.availableStyles.some(
      (s) => s.id === this.state.style,
    )
      ? this.state.availableStyles
      : [
          { id: this.state.style, isDefault: false },
          ...this.state.availableStyles,
        ];

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
                  var matrices = toArray(fullSet.TileMatrix);
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
                    // Prefer the selected layer's TileMatrixSetLimits over the full
                    // matrix dimensions, so we don't request tiles outside the
                    // layer's data extent. Note that OpenLayers' sizes only bound
                    // the upper end, so MinTileRow/MinTileCol can't be expressed.
                    var limits = this.state.matrixSetLimits[v] || {};
                    stateUpdate.sizes = matrices
                      .map((m) => {
                        var limit = limits[textValue(m.Identifier)];
                        if (limit) {
                          return (
                            limit.maxTileCol + 1 + " " + (limit.maxTileRow + 1)
                          );
                        }
                        return (
                          textValue(m.MatrixWidth) +
                          " " +
                          textValue(m.MatrixHeight)
                        );
                      })
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
              const resource =
                this.state.availableResources[Number(selectedResource)];
              const patch = {
                selectedResource,
                imageFormat: resource ? resource.format : "",
              };
              // A REST encoding is only meaningful while the selected resource
              // actually carries a template - fall back to a KVP flavour if not.
              var encoding = this.state.requestEncoding;
              if (encoding === "REST" && !(resource && resource.template)) {
                encoding = this.defaultRequestEncoding(this.state);
                patch.requestEncoding = encoding;
              }
              if (encoding === "REST") {
                patch.url = resource.template;
              }
              this.refreshGeneratedUrl(patch);
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
          <label>Format (imageFormat)*</label>
          <input
            type="text"
            ref="input_imageFormat"
            value={this.state.imageFormat}
            className={this.getValidationClass("imageFormat")}
            onChange={(e) => {
              const v = e.target.value;
              this.refreshGeneratedUrl({ imageFormat: v });
              this.validateField("imageFormat", v);
            }}
          />
        </div>
        <div>
          <label>
            Dimensioner{" "}
            <abbr title="Extra WMTS-dimensioner som skickas med varje anrop, på formatet NYCKEL=VÄRDE; NYCKEL2=VÄRDE2. Fylls i automatiskt från GetCapabilities. GeoServer/GWC annonserar t ex FORMAT_OPTIONS=dpi:90, vilken krävs för att serverns egna REST-mallar ska fungera.">
              (?)
            </abbr>
          </label>
          <input
            type="text"
            ref="input_dimensions"
            placeholder="FORMAT_OPTIONS=dpi:90"
            value={this.state.dimensions}
            onChange={(e) => {
              this.refreshGeneratedUrl({ dimensions: e.target.value });
            }}
          />
        </div>
        <div>
          <label>Request encoding</label>
          <select
            ref="input_requestEncoding"
            style={{ width: "400px" }}
            value={this.state.requestEncoding}
            onChange={(e) => {
              const requestEncoding = e.target.value;
              this.refreshGeneratedUrl({
                requestEncoding,
                url: this.urlForRequestEncoding(requestEncoding, {
                  requestEncoding,
                }),
              });
            }}
          >
            <option value="REST">REST (mall från ResourceURL)</option>
            <option value="KVP">KVP (OpenLayers bygger anropet)</option>
            <option value="KVP_TEMPLATE">KVP (URL-mall)</option>
          </select>
        </div>
        <div>
          <label>Url*</label>
          <input
            type="text"
            ref="input_url"
            value={this.state.url}
            className={this.getValidationClass("url")}
            style={{ width: "400px" }}
            onChange={(e) => {
              const v = e.target.value;
              this.setState(
                {
                  url: v,
                  urlWarning: this.urlWarningFor(v, this.state.requestEncoding),
                },
                () => this.validateField("url", v),
              );
            }}
          />
        </div>
        {this.state.urlWarning ? (
          <div>
            <label />
            <i>{this.state.urlWarning}</i>
          </div>
        ) : null}
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
          <select
            ref="input_style"
            value={this.state.style}
            className={this.getValidationClass("style")}
            style={{ width: "400px" }}
            onChange={(e) => {
              const v = e.target.value;
              const selected = this.state.availableStyles.find(
                (s) => s.id === v,
              );
              const patch = { style: v };
              if (!this.state.legend && selected && selected.legendUrl) {
                patch.legend = selected.legendUrl;
              }
              this.refreshGeneratedUrl(patch);
            }}
          >
            {styleOptions.map((s, i) => (
              <option key={i} value={s.id}>
                {(s.id === "" ? "(tom)" : s.id) +
                  (s.isDefault ? " (standard)" : "")}
              </option>
            ))}
          </select>
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
        <div>
          <label>Uppåt i kartan är:</label>
          <select
            className="control-fixed-width"
            ref="input_rotateMap"
            value={this.state.rotateMap}
            onChange={(e) => {
              this.setState({ rotateMap: e.target.value });
            }}
          >
            <option value="n">Norr</option>
            <option value="e">Öst</option>
            <option value="s">Syd</option>
            <option value="w">Väst</option>
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
