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

import React from "react";
import { Component } from 'react';
import $ from 'jquery';

const defaultState = {
  layerType: "Vector",
  load: false,
  imageLoad: false,
  validationErrors: [],
  addedLayers: [],
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
  symbolXOffset: 0,
  symbolYOffset: 0,
  queryable: true
};

/**
 *
 */
class VectorLayerForm extends Component {

  componentDidMount() {
    defaultState.url = this.props.url;
    this.setState(defaultState);
    this.props.model.on('change:legend', () => {
      this.setState({
        legend: this.props.model.get('legend')
      });
      this.validateField('legend');
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

  describeLayer(layer) {
    this.props.model.getWFSLayerDescription(this.state.url, this.state.addedLayers[0], layerDescription => {
      this.props.parent.setState({
        layerProperties: layerDescription.map(d => {
            return {
              name: d.name,
              type: d.localType
            }
        })
      });
    });
  }

  getLayer() {
    return {
      type: this.state.layerType,
      dataFormat: this.getValue("dataFormat"),
      id: this.state.id,
      caption: this.getValue("caption"),
      url: this.getValue("url"),
      date: this.getValue("date"),
      content: this.getValue("content"),
      legend: this.getValue("legend"),
      visibleAtStart: this.getValue("visibleAtStart"),
      projection: this.getValue("projection"),
      layer: this.state.addedLayers[0],
      opacity: this.getValue("opacity"),
      symbolXOffset: this.getValue("symbolXOffset"),
      symbolYOffset: this.getValue("symbolYOffset"),
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
    ,   validationFields = ["url", "caption", "projection", "legend"];

    if (this.state.dataFormat !== "GeoJSON") {
      validationFields.push("layer");
    }

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
      case "layer":
        if (this.state &&
            this.state.addedLayers &&
            this.state.addedLayers.length === 0) {
          valid = false;
        }
        break;
      case "symbolXOffset":
      case "symbolYOffset":
      case "opacity":
        if (!number(value) || empty(value)) {
          valid = false;
        }
        break;
      case "url":
      case "caption":
      case "legend":
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
    return this.state.validationErrors.find(v => v === inputName) ? "validation-error" : "";
  }

  loadWFSCapabilities(e, callback) {
    if (e)
      e.preventDefault();

    this.setState({
      load: true,
      addedLayers: [],
      capabilities: false,
      layerProperties: undefined,
      layerPropertiesName: undefined
    });

    if (this.state.capabilities) {
      this.state.capabilities.forEach((layer, i) => {
        this.refs[layer.name].checked = false;
      });
    }

    this.props.model.getWFSCapabilities(this.state.url, (capabilities) => {

      var projection = "";
      if (Array.isArray(capabilities) && capabilities.length > 0) {
        projection = capabilities[0].projection;
      }

      this.setState({
        capabilities: capabilities,
        projection: this.state.projection || (projection || ""),
        legend: this.state.legend || (capabilities.legend || ""),
        load: false
      });

      this.validate();

      if (capabilities === false) {
        this.props.application.setState({
          alert: true,
          alertMessage: "Servern svarar inte. Försök med en annan URL."
        })
      }
      if (callback) {
        callback();
      }
    });
  }

  loadLegendImage(e) {
    $('#select-image').trigger('click');
  }

  appendLayer(e, checkedLayer) {
    this.state.addedLayers.splice(0, this.state.addedLayers.length);
    if (e.target.checked === true) {
      this.state.addedLayers.push(checkedLayer);
    } else {
      this.state.addedLayers = this.state.addedLayers.filter(layer =>
        layer !== checkedLayer
      );
    }
    this.forceUpdate();
    this.validate("layers");
  }

  loadLayers(layer, callback) {
    if (this.state.dataFormat === "WFS") {
      this.loadWFSCapabilities(undefined, () => {
        this.setState({
          addedLayers: [layer.layer]
        });
        Object.keys(this.refs).forEach(element => {
          var elem = this.refs[element];
          if (this.refs[element].dataset.type == "wms-layer") {
            this.refs[element].checked = false;
          }
        });
        this.refs[layer.layer].checked = true;
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  }

  renderLayersFromCapabilites() {
    if (this.state && this.state.capabilities) {
      return this.state.capabilities.map((layer, i) => {

        var classNames = this.state.layerPropertiesName === layer.name ?
                         "fa fa-info-circle active" : "fa fa-info-circle";
        return (
          <li key={i}>
            <input ref={layer.name} id={"layer" + i} type="radio" name="featureType" data-type="wms-layer" onChange={(e) => { this.appendLayer(e, layer.name) }}/>&nbsp;
            <label htmlFor={"layer" + i}>{layer.title}</label>
            <i className={classNames} onClick={(e) => this.describeLayer(e, layer.name)}></i>
          </li>
        )
      });
    } else {
      return null;
    }
  }

  renderSelectedLayers() {

    if (!this.state.addedLayers) return null;

    function uncheck(layer) {
      this.appendLayer({
        target: {
          checked: false
        }
      }, layer);
      this.refs[layer].checked = false;
    }

    return this.state.addedLayers.map((layer, i) =>
      <li className="layer" key={i}>
        <span>{layer}</span>&nbsp;
        <i className="fa fa-times" onClick={uncheck.bind(this, layer)}></i>
      </li>
    )
  }

  renderLayerList() {
    var layers = this.renderLayersFromCapabilites();
    return (
      <div className="layer-list">
        <ul>
          {layers}
        </ul>
      </div>
    )
  }

  render() {

    var loader = this.state.load ? <i className="fa fa-refresh fa-spin"></i> : null;
    var imageLoader = this.state.imageLoad ? <i className="fa fa-refresh fa-spin"></i> : null

    return (
      <fieldset>
        <legend>Vektor-lager</legend>
        <div>
          <label>Dataformat*</label>
          <select
            ref="input_dataFormat"
            value={this.state.dataFormat}
            onChange={(e) => {
              this.setState({
                dataFormat: e.target.value
              })
            }}
            >
            <option>WFS</option>
            <option>GeoJSON</option>
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
        <span onClick={(e) => {this.loadWFSCapabilities(e)}} className="btn btn-default">Ladda {loader}</span>
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
              this.setState({content: e.target.value});
            }}
          />
        </div>
        <div>
          <label>Ikon*</label>
          <input
            type="text"
            ref="input_legend"
            value={this.state.legend}
            className={this.getValidationClass("legend")}
            onChange={(e) => {
              this.setState({legend: e.target.value})
              this.validateField("legend");
            }}
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
          <label>Ikonförskjutning X</label>
          <input
            type="text"
            ref="input_symbolXOffset"
            value={this.state.symbolXOffset}
            className={this.getValidationClass("symbolXOffset")}
            onChange={(e) => {
              this.setState({symbolXOffset: e.target.value});
              this.validateField("symbolXOffset");
            }}
          />
        </div>
        <div>
          <label>Ikonförskjutning Y</label>
          <input
            type="text"
            ref="input_symbolYOffset"
            value={this.state.symbolYOffset}
            className={this.getValidationClass("symbolYOffset")}
            onChange={(e) => {
              this.setState({symbolYOffset: e.target.value});
              this.validateField("symbolYOffset");
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
          <label>Valt lager*</label>
          <div ref="input_layer" className={"layer-list-choosen " + this.getValidationClass("layer")}>
            <ul>
              {this.renderSelectedLayers()}
            </ul>
          </div>
        </div>
        <div>
          <label>Lagerlista</label>
          {this.renderLayerList()}
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

export default VectorLayerForm;
