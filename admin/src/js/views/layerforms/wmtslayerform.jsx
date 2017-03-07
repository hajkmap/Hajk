import React from "react";
import { Component } from 'react';
import $ from 'jquery';

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
  url: "",
  visibleAtStart: false,
  queryable: true,
  drawOrder: 1,
  layer: 'topowebb',
  matrixSet: '3006',
  style: 'default',
  projection: 'EPSG:3006',
  origin: [-1200000, 8500000],
  resolutions: [4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
  matrixIds: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"],
  layerType: "WMTS"
};

/**
 *
 */
class WMTSLayerForm extends Component {

  componentDidMount() {
    defaultState.url = this.props.url;
    this.setState(defaultState);
    this.props.model.on('change:legend', () => {
      this.setState({
        legend: this.props.model.get('legend')
      });
    });
  }

  componentWillUnmount() {
    this.props.model.off('change:legend');
  }

  constructor() {
    super();
    this.state = defaultState;
    this.layer = {};
  }

  loadLegendImage(e) {
    $('#select-image').trigger('click');
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
      layer: this.getValue("layer"),
      matrixSet: this.getValue("matrixSet"),
      style: this.getValue("style"),
      projection: this.getValue("projection"),
      origin: this.getValue("origin"),
      resolutions: this.getValue("resolutions"),
      matrixIds: this.getValue("matrixIds")
    }
  }

  getValue(fieldName) {

    function format_url() {

    }

    function create_date() {
      return (new Date()).getTime();
    }

    function format_layers(layers) {
      return layers.map(layer => layer);
    }

    var input = this.refs["input_" + fieldName]
    ,   value = input ? input.value : "";

    if (fieldName === 'date') value = create_date();
    if (fieldName === 'layers') value = format_layers(this.state.addedLayers);
    if (fieldName === 'visibleAtStart') value = input.checked;
    if (fieldName === 'singleTile') value = input.checked;
    if (fieldName === 'imageFormat') value = input.value;
    if (fieldName === 'queryable') value = input.checked;
    if (fieldName === 'tiled') value = input.checked;
    if (fieldName === 'searchFields') value = value.split(',');
    if (fieldName === 'displayFields') value = value.split(',');
    if (fieldName === 'origin') value = value.split(',');
    if (fieldName === 'resolutions') value = value.split(',');
    if (fieldName === 'matrixIds') value = value.split(',');

    return value;
  }

  validate() {
    var valid = true
    ,   validationFields = ["url", "caption", "layer", "matrixSet", "style",
                            "projection", "origin", "resolutions", "matrixIds"];

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

    switch (fieldName) {
      case "origin":
      case "resolutions":
      case "matrixIds":
        if (value.length === 1 && value[0] === "") {
          valid = false;
        }
        break;
      case "url":
      case "caption":
      case "layer":
      case "matrixSet":
      case "style":
      case "projection":
      case "origin":
      case "resolutions":
        if (value === "") {
          valid = false;
        }
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
    return this.state.validationErrors.find(v => v === inputName) ? "validation-error" : "";
  }

  render() {

    var loader = this.state.load ? <i className="fa fa-refresh fa-spin"></i> : null;
    var imageLoader = this.state.imageLoad ? <i className="fa fa-refresh fa-spin"></i> : null

    return (
      <fieldset>
        <legend>WMTS-lager</legend>
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
          <span onClick={(e) => {this.props.parent.loadLegendImage(e)}} className="btn btn-default">Välj fil {imageLoader}</span>
        </div>
        <div>
          <label>Synligt vid start</label>
          <input
            type="checkbox"
            ref="input_visibleAtStart"
            onChange={
              (e) => {
                this.setState({visibleAtStart: e.target.checked})
              }
            }
            checked={this.state.visibleAtStart}

          />
        </div>
        <div>
          <label>Lager*</label>
          <input
            type="text"
            ref="input_layer"
            onChange={(e) => {
              this.setState({layer: e.target.value});
              this.validateField("layer", e);
            }}
            value={this.state.layer}
            className={this.getValidationClass("layer")}
          />
        </div>
        <div>
          <label>Matrisuppsättning*</label>
          <input
            type="text"
            ref="input_matrixSet"
            onChange={(e) => {
              this.setState({matrixSet: e.target.value});
              this.validateField("matrixSet", e);
            }}
            value={this.state.matrixSet}
            className={this.getValidationClass("matrixSet")}
          />
        </div>
        <div>
          <label>Stilsättning*</label>
          <input
            type="text"
            ref="input_style"
            onChange={(e) => {
              this.setState({style: e.target.value});
              this.validateField("style", e)}
            }
            value={this.state.style}
            className={this.getValidationClass("style")}
          />
        </div>
        <div>
          <label>Projektion*</label>
          <input
            type="text"
            ref="input_projection"
            onChange={(e) => {
              this.setState({projection: e.target.value});
              this.validateField("projection", e)
            }}
            value={this.state.projection}
            className={this.getValidationClass("projection")}
          />
        </div>
        <div>
          <label>Startkoordinat för rutnät*</label>
          <input
            type="text"
            ref="input_origin"
            onChange={(e) => {
              this.setState({origin: e.target.value});
              this.validateField("origin", e);
            }}
            value={this.state.origin}
            className={this.getValidationClass("origin")}
          />
        </div>
        <div>
          <label>Upplösningar (resolutions)*</label>
          <input
            type="text"
            ref="input_resolutions"
            onChange={(e) => {
              this.setState({resolutions: e.target.value});
              this.validateField("resolutions", e);
            }}
            value={this.state.resolutions}
            className={this.getValidationClass("resolutions")}
          />
        </div>
        <div>
          <label>Matrisnivåer*</label>
          <input
            type="text"
            ref="input_matrixIds"
            onChange={(e) => {
              this.setState({matrixIds: e.target.value});
              this.validateField("matrixIds", e);
            }}
            value={this.state.matrixIds}
            className={this.getValidationClass("matrixIds")}
          />
        </div>
      </fieldset>
    );
  }

}

export default WMTSLayerForm;
