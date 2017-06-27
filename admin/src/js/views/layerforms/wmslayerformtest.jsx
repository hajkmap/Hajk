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
// https://github.com/hajkmap/Hajk

import React from "react";
import { Component } from 'react';
import $ from 'jquery';
import InfoClick from '../infoclick.jsx';

const defaultState = {
  load: false,
  imageLoad: false,
  capabilities: false,
  validationErrors: [],
  layers: [],
  addedLayers: [],
  id: "",
  caption: "",  
  content: "",
  date: "Fylls i per automatik",
  infobox: "",
  legend: "",
  owner: "",
  url: "",
  searchFields: "",
  displayFields: "",
  visibleAtStart: false,
  queryable: true,
  tiled: false,
  singleTile: false,
  version: "1.3.0",
  imageFormat: "Välj ett bildformat",
  imageFormats: [],
  coordSystem: "",
  coordSystems:[],
  serverType: 'geoserver',
  drawOrder: 1,
  layerType: "WMSTest",
  attribution: ""
};


/**
 *
 */
class WMSLayerFormTest extends Component {

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

  reset() {
    this.setState(defaultState);
  }

  loadLegendImage(e) {
    $('#select-image').trigger('click');
  }

  renderLayerList() {    
    var layers = this.renderLayersFromCapabilites();

    return (              
      <div className="col-md-12 layer-list-test no-padding">
        <ul className="list-group no-padding no-margin-top">
          {layers}
        </ul>
      </div>      
    )
  }

  appendLayer(e, checkedLayer) {
    if (e.target.checked === true) {
      this.state.addedLayers.push(checkedLayer);
    } else {
      this.state.addedLayers = this.state.addedLayers.filter(layer =>
        layer !== checkedLayer
      );
    }
    this.validateField('layers');
    this.forceUpdate();
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
      this.validateField('layers');
    }

    return this.state.addedLayers.map((layer, i) =>
      <li className="layer" key={"addedLayer_" + i}>
        <span>{layer}</span>&nbsp;
        <i className="fa fa-times" onClick={uncheck.bind(this, layer)}></i>
      </li>
    )
  }

  createGuid() {
    return Math.floor((1 + Math.random()) * 0x1000000)
        .toString(16)
        .substring(1);
  }

  renderLayersFromCapabilites() {
    if (this.state && this.state.capabilities) {
      var layers = [];

      var append = (layer, index) => {

        var classNames = this.state.layerPropertiesName === layer.Name ?
                         "fa fa-info-circle active" : "fa fa-info-circle";

        var i = index;
        var title = /^\d+$/.test(layer.Name) ? <label>&nbsp;{layer.Title}</label> : null;

        var queryableIcon = this.state.queryable ? "fa fa-check" : "fa fa-remove";
        
        return (      
            <li key={"fromCapability_" + i} className="list-item">
              <div className="col-md-6 overflow-hidden">
                <input
                  ref={layer.Name}
                  id={"layer" + i}
                  type="checkbox"
                  data-type="wms-layer"
                  checked ={this.state.addedLayers.find(l => l === layer.Name)}
                  onChange={(e) => {
                    this.setState({'caption': layer.Title});
                    this.setState({'content': layer.Abstract});
                    this.appendLayer(e, layer.Name);
                  }} />&nbsp;
                <label htmlFor={"layer" + i}>{layer.Name}</label>{title}
              </div>
              <i style={{display:"none"}} className={classNames} onClick={(e) => this.describeLayer(e, layer.Name)}></i>
              <span className={queryableIcon + " col-md-1"}/>
              {<select key={"select_" + i} className="col-md-5 form-control layer-list-style-select-test">
                {this.setLayerListStyles(layer)}
              </select>}
            </li>
        )
      };

      this.state.capabilities.Capability.Layer.Layer.map((layer, index) => {
        if (layer.Layer) {
          layer.Layer.forEach((layer, subIndex) => {
            if (layer.Layer) {
              layer.Layer.forEach((layer, subSubIndex) => {
                layers.push(append(layer, subSubIndex));
              });
            } else {
              layers.push(append(layer, subIndex));
            }
          });
        } else {
          layers.push(append(layer, index));
        }
      });
      return layers;
    } else {
      return null;
    }

  }

  loadLayers(layer, callback) {
    this.loadWMSCapabilities(undefined, () => {
      this.setState({
        addedLayers: layer.layers
      });
      Object.keys(this.refs).forEach(element => {
        var elem = this.refs[element];
        if (this.refs[element].dataset.type == "wms-layer") {
          this.refs[element].checked = false;
        }
      });
      layer.layers.forEach(layer => {
        this.refs[layer].checked = true;
      });
      if (callback) callback();
    });
  }

  loadWMSCapabilities(e, callback) {
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
      this.state.capabilities.Capability.Layer.Layer.forEach((layer, i) => {
        this.refs[layer.Name].checked = false;
      });
    }
  
    this.props.model.getWMSCapabilities(this.state.url, (capabilities) => {
      this.setState({
        capabilities: capabilities,
        load: false
      });
      if (capabilities === false) {
        this.props.application.setState({
          alert: true,
          alertMessage: "Servern svarar inte. Försök med en annan URL."
        })
      }
      this.setImageFormats();
      this.setCoordSystems();
      if (callback) {
        callback();
      }
    });
  }

  /**
   * gets image format tags from capabilities document and builds option tags
   * which can populate a <select>. Stores these tags in this.state.imageFormats
   */
  setImageFormats() {
    var formats = this.state.capabilities.Capability.Request.GetMap.Format;
    for(let i = 0; i < formats.length; i++) {
        formats[i] = <option key={i}>{formats[i]}</option>;
    }
    this.setState({
      imageFormats: formats
    });
  }

  setCoordSystems() {
    var systems = this.state.capabilities.Capability.Layer.CRS;
    for (let i = 0; i < systems.length; i++) {
      systems[i] = <option key={i}>{systems[i]}</option>;
    }
    
    this.setState({
      coordSystems: systems
    });
  }

  setLayerListStyles(layer) {
    var styles = [];
    if (layer.Style !== undefined) {
      for (let i = 0; i < layer.Style.length; i++) {
        styles.push(<option key={i}>{layer.Style[i].Name}</option>);
      }
    }
    return styles;
  }
  
  getLayer() {
    return {
      type: this.state.layerType,
      id: this.state.id,
      caption: this.getValue("caption"),
      url: this.getValue("url"),
      owner: this.getValue("owner"),
      date: this.getValue("date"),
      content: this.getValue("content"),
      legend: this.getValue("legend"),
      layers: this.getValue("layers"),
      infobox: this.getValue("infobox"),
      searchFields: this.getValue("searchFields"),
      displayFields: this.getValue("displayFields"),
      visibleAtStart: this.getValue("visibleAtStart"),
      singleTile: this.getValue("singleTile"),
      imageFormat: this.getValue("imageFormat"),
      serverType: this.getValue("serverType"),
      queryable: this.getValue("queryable"),
      tiled: this.getValue("tiled"),
      drawOrder: this.getValue("drawOrder"),
      attribution: this.getValue("attribution"),
    };
  }

  getValue(fieldName) {
    function create_date() {
      return (new Date()).getTime();
    }

    function format_layers(layers) {
      return layers.map(layer => layer);
    }

    var input = this.refs["input_" + fieldName]
    ,   value = input ? input.value : "";

    if (fieldName === 'date') value = create_date();
    if (fieldName === 'visibleAtStart') value = input.checked;
    if (fieldName === 'singleTile') value = input.checked;
    if (fieldName === 'tiled') value = input.checked;
    if (fieldName === 'queryable') value = input.checked;
    if (fieldName === 'layers') value = format_layers(this.state.addedLayers);

    return value;
  }

  validate() {

    var valid = true;

    if (!this.validateField("url"))
      valid = false;

    if (!this.validateField("caption"))
      valid = false;

    if (!this.validateField("layers"))
      valid = false;

    return valid;
  }

  getValidationClass(inputName) {
    return this.state.validationErrors.find(v => v === inputName) ? "validation-error" : "";
  }

  validateField (fieldName, e) {

    var value = this.getValue(fieldName)
    ,   valid = true;

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

  render() {

    var loader = this.state.load ? <i className="fa fa-refresh fa-spin"></i> : null;
    var imageLoader = this.state.imageLoad ? <i className="fa fa-refresh fa-spin"></i> : null

    return (
      <fieldset className="article-wrapper">
        <legend>Lägg till lager</legend>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Url*</label>
              <input
                type="text"
                ref="input_url"
                value={this.state.url}
                onChange={(e) => {
                  this.setState({'url': e.target.value})
                  this.validateField('url');
                }}
                className={this.getValidationClass("url") + "form-control display-inline"}
              />
              <span onClick={(e) => {this.loadWMSCapabilities(e)}} className="btn btn-default btn-sm">Ladda {loader}</span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Bildformat</label>
              <select ref="input_imageFormat" value={this.state.imageFormat} onChange={(e) => this.setState({'imageFormat': e.target.value})} className="form-control">
                {this.state.imageFormats}
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label>Version</label>
              <p className="text-display">{this.state.version}</p>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Koordinatsystem</label>
              <select ref="input_coordSystems" value={this.state.coordSystem} onChange={(e) => this.setState({'coordSystem': e.target.value})} className="form-control">
                {this.state.coordSystems}
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label>Lagertyp</label>
              <p className="text-display">WMS</p>
            </div>
          </div>
        </div>
        <div className="row">
          <label className="col-md-5">Lagerlista</label>
          <label className="col-md-2">Infoklick</label>
          <label className="col-md-5">Stil</label>
        </div>
        <div className="row">
          {this.renderLayerList()}
        </div>
        <div className="row">
          <div className="col-md-12">
            <label className="label-block">Valda lager*</label>
            <div ref="input_layers" className={this.getValidationClass("layers") + " layer-list-choosen-test" + " form-control"} >
              <ul>
                {this.renderSelectedLayers()}
              </ul>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <label>Visningsnamn*</label>
            <input
              type="text"
              ref="input_caption"
              value={this.state.caption}
              onChange={(e) => {              
                this.setState({'caption': e.target.value});
                this.validateField('caption');
              }}
              className={this.getValidationClass("caption") + " form-control"} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <label>Innehåll</label>
            <input
              type="text"
              ref="input_content"
              value={this.state.content}
              onChange= { (e) => { 
                this.setState({'content': e.target.value});
              }}
              className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="form-group">
              <label>Teckenförklaring</label>
              <input
                type="text"
                ref="input_legend"
                value={this.state.legend}
                onChange={(e) => this.setState({'legend': e.target.value})}
                className="form-control"
              />
              <span onClick={(e) => {this.loadLegendImage(e)}} className="btn btn-default">Välj fil {imageLoader}</span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Senast Ändrad</label>
              <span ref="input_date" className="text-display"><i>{this.props.model.parseDate(this.state.date)}</i></span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
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
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label>Single tile</label>
              <input
                type="checkbox"
                ref="input_singleTile"
                onChange={(e) => { this.setState({singleTile: e.target.checked})}}
                checked={this.state.singleTile}
              />
            </div>
          </div>
        </div>
        <legend>Infoklick-konfiguration för valda lager</legend>
        <InfoClick queryable={this.state.queryable} infobox={this.state.infobox} addedLayers={this.state.addedLayers} />
        {/*<div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Infoklickbar</label>
              <input
                type="checkbox"
                ref="input_queryable"
                onChange={(e) => {this.setState({queryable: e.target.checked})}}
                checked={this.state.queryable}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="form-group">
              <label>Inforuta</label>
              <textarea
                ref="input_infobox"
                value={this.state.infobox}
                onChange={(e) => this.setState({'infobox': e.target.value})}
                className="form-control"
              />
            </div>
          </div>
        </div>*/}
        {/*<div>
          <label>Servertyp</label>
          <select ref="input_serverType" value={this.state.serverType} onChange={(e) => this.setState({'serverType': e.target.value})}>
            <option>geoserver</option>
            <option>arcgis</option>
          </select>
        </div>
        <div style={{display: "none"}}>
          <label>Geowebcache</label>
          <input
            type="checkbox"
            ref="input_tiled"
            onChange={
              (e) => {
                this.setState({tiled: e.target.checked})
              }
            }
            checked={this.state.tiled}
          />
        </div>
        <div>
          <label>Upphovsrätt</label>
          <input
            type="text"
            ref="input_attribution"
            onChange={(e) => {
              this.setState({attribution: e.target.value});
              this.validateField("attribution", e);
            }}
            value={this.state.attribution}
            className={this.getValidationClass("attribution")}
          />
        </div>*/}
      </fieldset>
    );
  }
}

export default WMSLayerFormTest;