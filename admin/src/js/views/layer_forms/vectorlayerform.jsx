// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/Johkar/Hajk2

const defaultState = {
  layerType: "Vector",
  load: false,
  imageLoad: false,
  validationErrors: [],
  id: "",
  caption: "",
  content: "",
  date: "Fylls i per automatik",
  infobox: "",
  legend: "",
  url: "",
  visibleAtStart: false,
  queryable: true,
  drawOrder: 1,
  projection: "",
  layer: "",
  opacity: 1,
  queryable: true
};

/**
 *
 */
class ArcGISLayerForm extends React.Component {

  componentDidMount() {
    defaultState.url = this.props.url;
    this.setState(defaultState);
  }

  componentWillUnmount() {
  }

  constructor() {
    super();
    this.state = defaultState;
    this.layer = {};
  }
  describeLayer(layer) {
    throw "Not implemented";
  }

  getLayer() {
    return {
      type: this.state.layerType,
      id: this.state.id,
      caption: this.getValue("caption"),
      url: this.getValue("url"),
      date: this.getValue("date"),
      content: this.getValue("content"),
      legend: this.getValue("legend"),
      visibleAtStart: this.getValue("visibleAtStart"),
      projection: this.getValue("projection"),
      layer: this.getValue("layer"),
      opacity: this.getValue("opacity"),
      queryable: this.getValue("queryable"),
      infobox: this.getValue("infobox")
    }
  }

  getValue(fieldName) {

    function create_date() {
      return (new Date()).getTime();
    }

    function format_layers(layers) {
      return layers.map(layer => layer.id.toString());
    }

    var input = this.refs["input_" + fieldName]
    ,   value = input ? input.value : "";

    if (fieldName === 'date') value = create_date();
    if (fieldName === 'queryable') value = input.checked;
    if (fieldName === 'visibleAtStart') value = input.checked;

    return value;
  }

  validate() {
    var valid = true
    ,   validationFields = ["url", "caption", "projection", "layer"];

    validationFields.forEach(field => {
      if (!this.validateField(field)) {
        valid = false;
      }
    })

    return valid;
  }

  validateField (fieldName, e) {

    var value = this.getValue(fieldName)
    ,   valid = true;

    function number(v) {
      return !empty(v) && !isNaN(Number(v));
    }

    function empty(v) {
      return typeof v === "string" ? v.trim() === "" : Array.isArray(v) ? v[0] === "" : false;
    }

    function array(v) {
      return Array.isArray(v) && v.length > 0;
    }

    function extent(v) {
      return v.length === 4 && v.every(number);
    }

    switch (fieldName) {
      case "opacity":
        if (!number(value) || empty(value)) {
          valid = false;
        }
        break;
      case "url":
      case "layer":
      case "caption":
      case "projection":
        if (empty(value)) {
          valid = false;
        }
        break;
      default:
        break;
    }

    if (!valid) {
      this.state.validationErrors.push(fieldName);
    } else {
      this.state.validationErrors = this.state.validationErrors.filter(v => v !== fieldName);
    }

    if (e) {
      let state = {};
      state[fieldName] = e.target.value;
      this.setState(state);
    } else {
      this.forceUpdate();
    }

    return valid;
  }

  getValidationClass(inputName) {
    return valid = this.state.validationErrors.find(v => v === inputName) ? "validation-error" : "";
  }

  loadLegendImage(e) {
    $('#select-image').trigger('click');
  }

  loadLayers(layer, callback) {
      if (callback) callback();
  }

  renderLayersFromCapabilites() {
  }

  render() {

    var loader = this.state.load ? <i className="fa fa-refresh fa-spin"></i> : null;
    var imageLoader = this.state.imageLoad ? <i className="fa fa-refresh fa-spin"></i> : null

    return (
      <fieldset>
        <legend>Vektor-lager</legend>
        <div>
          <label>Visningsnamn*</label>
          <input
            type="text"
            ref="input_caption"
            value={this.state.caption}
            className={this.getValidationClass("caption")}
            onChange={(e) => {
              this.setState({caption: e.target.value});
              this.validateField("caption");
            }}
          />
        </div>
        <div>
          <label>Url*</label>
          <input
            type="text"
            ref="input_url"
            value={this.state.url}
            className={this.getValidationClass("url")}
            onChange={(e) => {
              this.setState({url: e.target.value});
              this.validateField("url");
            }}
          />
          <span onClick={(e) => {this.loadWMSCapabilities(e)}} className="btn btn-default">Ladda {loader}</span>
        </div>
        <div>
          <label>Senast ändrad</label>
          <span ref="input_date"><i>{this.props.model.parseDate(this.state.date)}</i></span>
        </div>
        <div>
          <label>Innehåll</label>
          <input
            type="text"
            ref="input_content"
            value={this.state.content}
            onChange={(e) => {
              this.setState({content: e.target.value})
            }}
          />
        </div>
        <div>
          <label>Teckenförklaring</label>
          <input
            type="text"
            ref="input_legend"
            value={this.state.legend}
            onChange={(e) => this.setState({legend: e.target.value})}
          />
          <span onClick={(e) => {this.loadLegendImage(e)}} className="btn btn-default">Välj fil {imageLoader}</span>
        </div>
        <div>
          <label>Projektion*</label>
          <input
            type="text"
            ref="input_projection"
            value={this.state.projection}
            className={this.getValidationClass("projection")}
            onChange={(e) => {
              this.setState({projection: e.target.value});
              this.validateField("projection");
            }}
          />
        </div>
        <div>
          <label>Opacitet*</label>
          <input
            type="text"
            ref="input_opacity"
            value={this.state.opacity}
            className={this.getValidationClass("opacity")}
            onChange={(e) => {
              this.setState({opacity: e.target.value});
              this.validateField("opacity");
            }}
          />
        </div>
        <div>
          <label>Infoklickbar</label>
          <input
            type="checkbox"
            ref="input_queryable"
            onChange={(e) => {
              this.setState({queryable: e.target.checked})
            }}
            checked={this.state.queryable}
          />
        </div>
        <div>
          <label>Synligt vid start</label>
          <input
            type="checkbox"
            ref="input_visibleAtStart"
            onChange={(e) => {
              this.setState({visibleAtStart: e.target.checked})
            }}
            checked={this.state.visibleAtStart}
          />
        </div>
        <div>
          <label>Lager*</label>
          <input
            type="text"
            ref="input_layer"
            value={this.state.layer}
            className={this.getValidationClass("layer")}
            onChange={(e) => {
              this.setState({layer: e.target.value});
              this.validateField("layer");
            }}
          />
        </div>
        <div>
          <label>Inforuta</label>
          <textarea
            ref="input_infobox"
            value={this.state.infobox}
            onChange={(e) => this.setState({'infobox': e.target.value})}
          />
        </div>
      </fieldset>
    );
  }
}

module.exports = ArcGISLayerForm;
