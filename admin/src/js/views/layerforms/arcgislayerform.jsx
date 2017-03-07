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
  layerType: "ArcGIS",
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
  layers: [],
  extent: [],
  opacity: 1,
  queryable: true,
  addedLayers: []
};

/**
 *
 */
class ArcGISLayerForm extends Component {

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

  appendLayer(checked, layer) {

    if (checked === true) {
      this.state.addedLayers.push({
        id: layer.id,
        name: layer.name
      });
    } else {
      this.state.addedLayers = this.state.addedLayers.filter(addedLayer =>
        !this.layerEqualityCompare(addedLayer, layer)
      );
    }

    if (this.state.legend === "" || /^data/.test(this.state.legend)) {
      this.props.model.getLegend(this.state, (legend) => {
        this.setState({
          legend: legend
        });
      });
    }

    this.validateField('layers');
  }

  describeLayer(layer) {
    this.props.model.getArcGISLayerDescription(this.state.url, layer, (info) => {
      this.props.parent.setState({
        layerProperties: info.fields,
        layerPropertiesLayer: layer.name + "_" + layer.id
      });
    });
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
      layers: this.getValue("layers"),
      extent: this.getValue("extent"),
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
    if (fieldName === 'layers') value = format_layers(this.state.addedLayers);
    if (fieldName === 'queryable') value = input.checked;
    if (fieldName === 'visibleAtStart') value = input.checked;
    if (fieldName === 'extent') value = value.split(',');

    return value;
  }

  validate() {
    var valid = true
    ,   validationFields = ["url", "caption", "projection", "extent", "layers"];

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
      case "extent":
        if (!extent(value)) {
          valid = false;
        }
        break;
      case "layers":
        if (!array(value) || empty(value)) {
          valid = false;
        }
        break;
      case "opacity":
        if (!number(value) || empty(value)) {
          valid = false;
        }
        break;
      case "url":
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
    return this.state.validationErrors.find(v => v === inputName) ? "validation-error" : "";
  }

  loadLegendImage(e) {
    $('#select-image').trigger('click');
  }

  loadWMSCapabilities(callback) {
    this.props.model.getArcGISCapabilities(this.state.url, (data) => {

      var extent = [
        data.fullExtent.xmin,
        data.fullExtent.ymin,
        data.fullExtent.xmax,
        data.fullExtent.ymax
      ];

      this.setState({
        layers: data.layers,
        extent: extent.join(','),
        projection: "EPSG:" + data.fullExtent.spatialReference.wkid
      });

      if (callback && callback.call) callback(data);

    });
  }

  loadLayers(layer, callback) {

    this.loadWMSCapabilities((data) => {

      var addedLayers = data.layers.filter(
        dataLayer => layer.layers.find(
          id => id === dataLayer.id.toString()
        )
      );

      addedLayers = addedLayers.map(l => {
        return {
          id: l.id,
          name: l.name
        }
      });

      this.setState({
        addedLayers: addedLayers
      });

      Object.keys(this.refs).forEach(element => {
        var elem = this.refs[element];
        if (this.refs[element].dataset.type == "arcgis-layer") {
          this.refs[element].checked = false;
        }
      });

      this.state.addedLayers.forEach(layer => {
        this.refs[layer.name + "_" + layer.id].checked = true;
      });

      if (callback) callback();

    });
  }

  layerEqualityCompare(a, b) {
    return a.name === b.name && a.id === b.id
  }

  renderLayersFromCapabilites() {
    if (this.state && this.state.layers) {
      var layers = [];

      var append = (layer) => {

        var classNames = this.props.parent.state.layerPropertiesLayer === layer.name + "_" + layer.id ?
                         "fa fa-info-circle active" : "fa fa-info-circle";

        var i = Math.floor(Math.random() * 1E8);

        return (
          <li key={"fromCapability_" + i}>
            <input
              ref={layer.name + "_" + layer.id}
              id={"layer" + i}
              type="checkbox"
              data-type="arcgis-layer"
              checked={this.state.addedLayers.find(addedLayer => this.layerEqualityCompare(addedLayer, layer))}
              onChange={(e) => {
                this.appendLayer(e.target.checked, layer)
              }} />&nbsp;
            <label htmlFor={"layer" + i}>{layer.id} {layer.name}</label>
            <i className={classNames} onClick={(e) => this.describeLayer(layer)}></i>
          </li>
        )
      };

      this.state.layers.forEach((layer) => {
        layers.push(append(layer));
      });

      return layers;

    } else {
      return null;
    }
  }

  renderSelectedLayers() {
    if (!this.state.addedLayers) return null;

    function uncheck(layer) {
      this.appendLayer(false, layer);
      this.refs[layer.name + "_" + layer.id].checked = false;
      this.validateField('layers');
    }

    return this.state.addedLayers.map((layer, i) =>
      <li className="layer" key={"addedLayer_" + i}>
        <span>{layer.name}</span>&nbsp;
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
        <legend>ArcGIS MapServer-lager</legend>
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
          <label>Utbredning*</label>
          <input
            type="text"
            ref="input_extent"
            value={this.state.extent}
            className={this.getValidationClass("extent")}
            onChange={(e) => {
              this.setState({extent: e.target.value});
              this.validateField("extent");
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
          <label>Valda lager*</label>
          <div ref="input_layers" className={this.getValidationClass("layers") + " layer-list-choosen"} >
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

export default ArcGISLayerForm
