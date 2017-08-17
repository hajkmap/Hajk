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
<<<<<<< HEAD
import Alert from '../alert.jsx';
=======
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03

const defaultState = {
  load: false,
  imageLoad: false,
  capabilities: false,
  validationErrors: [],
  layers: [],
  addedLayers: [],
  id: "",
<<<<<<< HEAD
  caption: "",
  content: "",
  date: "Fylls i per automatik",
  infobox: "",
  infoFormat: "",
=======
  caption: "",  
  content: "",
  date: "Fylls i per automatik",
  infobox: "",
  legend: "",
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
  owner: "",
  url: "",
  searchFields: "",
  displayFields: "",
  visibleAtStart: false,
  queryable: true,
  tiled: false,
  singleTile: false,
<<<<<<< HEAD
  version: "",
  imageFormat: "",
  imageFormats: [],
  coordSystem: "",
  coordSystems: [],
  serverType: 'geoserver',
  drawOrder: 1,
  layerType: "WMSTest",
  attribution: "",
  selectedFormat: "",
  selctedStyle: "",
  selectedLegend: "",
  selectedFormat: "",
  infoclickFormats: [],
  layerSettings: {
    settings: true,
    visible: false,
    infobox: "",
    styles: [],
    legend: "",
    confirmAction: () => { }
  },
  savedLayers: []
=======
  version: "1.3.0",
  imageFormat: "Välj ett bildformat",
  imageFormats: [],
  layerStyles:[],
  serverType: 'geoserver',
  drawOrder: 1,
  layerType: "WMSTest",
  attribution: ""
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
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
<<<<<<< HEAD

    return (
      <div className="col-md-12 layer-list-test no-padding">
        <ul className="list-group no-padding no-margin-top">
          {layers}
        </ul>
      </div>
    )
  }

  yer(e, checkedLayer) {
    if (e.target.checked === true) {
      this.state.addedLayers.push({
        name: checkedLayer
      });
    } else {
      this.state.addedLayers = this.state.addedLayers.filter(layer => {
        layer.name !== checkedLayer;
      });
      this.state.savedLayers = this.state.savedLayers.filter(layer => {
        layer.name !== checkedLayer;
      });
=======
    return (
      <div className="row">        
        <div className="col-md-12 layer-list-test no-padding">
        <ul className="list-group no-padding no-margin-top">
          {layers}
        </ul>
        </div>
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
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
    }
    this.validateField('layers');
    this.forceUpdate();
  }

  renderSelectedLayers() {
    if (!this.state.addedLayers) return null;

    function uncheck(layer) {
<<<<<<< HEAD
      this.yer({
=======
      this.appendLayer({
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
        target: {
          checked: false
        }
      }, layer);
      this.refs[layer].checked = false;
      this.validateField('layers');
    }
<<<<<<< HEAD
    return this.state.addedLayers.map((layer, i) =>
      <li className="layer" key={"addedLayer_" + i}>
        <span>
          <i className="fa fa-list" onClick={this.setLayerSettings.bind(this, layer)}></i>&nbsp;
          <span>{layer.name}</span>
        </span>&nbsp;
=======

    return this.state.addedLayers.map((layer, i) =>
      <li className="layer" key={"addedLayer_" + i}>
        <span>{layer}</span>&nbsp;
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
        <i className="fa fa-times" onClick={uncheck.bind(this, layer)}></i>
      </li>
    )
  }

  createGuid() {
    return Math.floor((1 + Math.random()) * 0x1000000)
<<<<<<< HEAD
      .toString(16)
      .substring(1);
=======
        .toString(16)
        .substring(1);
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
  }

  renderLayersFromCapabilites() {
    if (this.state && this.state.capabilities) {
      var layers = [];

<<<<<<< HEAD
      var append = (layer, index) => {

        var classNames = this.state.layerPropertiesName === layer.Name ?
          "fa fa-info-circle active" : "fa fa-info-circle";

        var i = index;
=======
      var append = (layer) => {

        var classNames = this.state.layerPropertiesName === layer.Name ?
                         "fa fa-info-circle active" : "fa fa-info-circle";

        var i = this.createGuid();
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
        var title = /^\d+$/.test(layer.Name) ? <label>&nbsp;{layer.Title}</label> : null;

        var queryableIcon = this.state.queryable ? "fa fa-check" : "fa fa-remove";

        return (
<<<<<<< HEAD
          <li key={"fromCapability_" + i} className="list-item">
            <div className="col-md-6 overflow-hidden">
              <input
                ref={layer.Name}
                id={"layer" + i}
                type="checkbox"
                data-type="wms-layer"
                checked={this.state.addedLayers.find(l => l === layer.Name)}
                onChange={(e) => {
                  this.setState({ 'caption': layer.Title });
                  this.setState({ 'content': layer.Abstract });
                  this.yer(e, layer.Name);
                }} />&nbsp;
                <label htmlFor={"layer" + i}>{layer.Name}</label>{title}
            </div>
            <i style={{ display: "none" }} className={classNames} onClick={(e) => this.describeLayer(e, layer.Name)}></i>
            <span className={queryableIcon + " col-md-1"} />
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
=======
          <div className="row">
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
              <select className="col-md-5 form-control layer-list-style-select-test">
                {this.setLayerListStyles(layer)}
              </select>
              
            </li>
          </div>
        )
      };

      this.state.capabilities.Capability.Layer.Layer.map((layer) => {
        if (layer.Layer) {
          layer.Layer.forEach((layer) => {
            if (layer.Layer) {
              layer.Layer.forEach((layer) => {
                layers.push(append(layer));
              });
            } else {
              layers.push(append(layer));
            }
          });
        } else {
          layers.push(append(layer));
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
        }
      });
      return layers;
    } else {
      return null;
    }
<<<<<<< HEAD

=======
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
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
<<<<<<< HEAD
      e.preventDefault();
=======
      e.preventDefault();  
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
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
<<<<<<< HEAD

=======
  
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
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
<<<<<<< HEAD

      this.setImageFormats();
      this.setCoordSystems();
      this.setVersion();
      this.setFormats();

=======
      this.setImageFormats();
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
      if (callback) {
        callback();
      }
    });
  }

<<<<<<< HEAD
  setLegend(value) {
    this.setState({ legend: value });
  }

  setVersion() {
    var currentVersion = this.state.capabilities.version;
    this.setState({
      version: currentVersion
    })
  }

  setImageFormats() {
    var formats = this.state.capabilities.Capability.Request.GetMap.Format;
    var formatElements = formats ? formats.map((format, i) => {
      return <option key={i}>{format}</option>;
    }) : null;

    this.setState({
      imageFormats: formatElements
    });
  }

  setFormats() {
    var formats = this.state.capabilities.Capability.Request.GetFeatureInfo.Format;
    var formatElements = formats ? formats.map((format, i) => {
      return <option key={i}>{format}</option>;
    }) : null;

    this.setState({
      infoclickFormats: formatElements
    });
  }

  setCoordSystems() {
    var systems = this.state.capabilities.Capability.Layer.CRS;
    var coordElements = systems ? systems.map((system, i) => {
      return <option key={i}>{system}</option>;
    }) : null;

    this.setState({
      coordSystems: coordElements
    });
  }

  getLayer() {

=======
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

  setLayerListStyles(layer) {
    var styles = [];
    if(layer.Style !== undefined) {
      for (let i = 0; i < layer.Style.length; i++) {
        styles.push(<option key={i}>{layer.Style[i].Name}</option>);
      }
    }
    return styles;

  }

  getLayer() {
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
    return {
      type: this.state.layerType,
      id: this.state.id,
      caption: this.getValue("caption"),
      url: this.getValue("url"),
      owner: this.getValue("owner"),
      date: this.getValue("date"),
      content: this.getValue("content"),
<<<<<<< HEAD
      layers: this.getValue("layers"),
      searchFields: this.getValue("searchFields"),
      displayFields: this.getValue("displayFields"),
      visibleAtStart: this.getValue("visibleAtStart"),
      infoFormat: this.getValue("infoFormat"),
      singleTile: this.getValue("singleTile"),
      imageFormat: this.getValue("imageFormat"),
      //serverType: this.getValue("serverType"),
      serverType: "geoserver",
      //tiled: this.getValue("tiled"),
      tiled: true,
      drawOrder: this.getValue("drawOrder"),
      attribution: this.getValue("attribution")
=======
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
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
    };
  }

  getValue(fieldName) {
    function create_date() {
      return (new Date()).getTime();
    }
<<<<<<< HEAD
    var input = this.refs["input_" + fieldName]
      , value = input ? input.value : "";
    
=======

    function format_layers(layers) {
      return layers.map(layer => layer);
    }

    var input = this.refs["input_" + fieldName]
    ,   value = input ? input.value : "";
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03

    if (fieldName === 'date') value = create_date();
    if (fieldName === 'visibleAtStart') value = input.checked;
    if (fieldName === 'singleTile') value = input.checked;
<<<<<<< HEAD
    //if (fieldName === 'tiled') value = input.checked;
    if (fieldName === 'queryable') value = input.checked;
    //if (fieldName === 'layers') value = this.state.addedLayers;
    if (fieldName === 'layers') value = this.state.savedLayers;
=======
    if (fieldName === 'tiled') value = input.checked;
    if (fieldName === 'queryable') value = input.checked;
    if (fieldName === 'layers') value = format_layers(this.state.addedLayers);
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03

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

<<<<<<< HEAD
  validateField(fieldName, e) {

    var value = this.getValue(fieldName)
      , valid = true;
=======
  validateField (fieldName, e) {

    var value = this.getValue(fieldName)
    ,   valid = true;
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03

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

<<<<<<< HEAD
  fetchLayerStyles(layer) {
    var styles = [];
    if (layer.Style !== undefined) {
      for (let i = 0; i < layer.Style.length; i++) {
        styles.push(<option key={i}>{layer.Style[i].Name}</option>);
      }
    }
    return styles;
  }

  setLayerSettings(layer) {
    var allFormats = this.state.capabilities.Capability.Request.GetFeatureInfo.Format;
    var layerFormats = allFormats ? allFormats.map((format, i) => {
      return <option key={i}>{format}</option>;
    }) : null;

    var currentLayer = this.state.capabilities.Capability.Layer.Layer.find((l) => {
      return l.Name === layer.name;
    });

    var layerStyles = currentLayer.Style ? currentLayer.Style.map((style, i) => {
      return <option key={i}>{style.Name}</option>;
    }) : null;

    this.setState({
      selectedFormat: "",
      selectedStyle: "",
      infobox: "",
      layerSettings: {
        settings: true,
        visible: true,
        name: layer.name,
        infobox: this.state.infobox,
        styles: [layerStyles],
        legend: this.state.legend,
        confirmAction: () => {
          this.saveLayerSettings();
          this.setState({
            layerSettings: {
              visible: false,
              settings: false
            }
          });
        }
      }
    });
  }

  /**
   * save infoclick-settings from modal to this.state.savedLayers. If layer name already exists,
   * overwrite with new values
   */
  saveLayerSettings() {
    var layers = this.state.savedLayers;
    let layerExists = false;
    layers.forEach((item) => {
      if (item.name === this.state.layerSettings.name) {
          item.style = this.state.selectedStyle,
          item.infobox = this.state.infobox,
          item.legend = this.state.legend
        layerExists = true;
      }
    });
    if (!layerExists) {
      layers.push({
        infobox: this.state.infobox,
        style: this.state.selectedStyle,
        queryable: true,
        legend: this.state.legend,
        name: this.state.layerSettings.name
      });
    }

    this.setState({
      savedLayers: layers
    });
  }

  setLayerStyle(s) {
    var style = s ? s : "";
    this.setState({
      selectedStyle: style
    })
  }

  setInfobox(ib) {
    var ibox = ib ? ib : "";
    this.setState({
      infobox: ibox
    });
  }
=======
  handleTitleChange(e) {
    if(!e.type === "keypress") {

    } else {
      
    }
  }

>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
  render() {

    var loader = this.state.load ? <i className="fa fa-refresh fa-spin"></i> : null;
    var imageLoader = this.state.imageLoad ? <i className="fa fa-refresh fa-spin"></i> : null

    return (
<<<<<<< HEAD
      <fieldset className="article-wrapper">
        <Alert
          options={this.state.layerSettings}
          imageLoad={this.state.imageLoader}
          setInfobox={this.setInfobox.bind(this)}
          setStyle={this.setLayerStyle.bind(this)}
          setNewLegend={this.loadLegendImage.bind(this)}
          setLegend={this.setLegend.bind(this)}
        />
        <legend>Lägg till lager</legend>
        <div className="row">
          <div className="col-md-6">
=======
      <fieldset>
        <legend>Lägg till lager</legend>
        <div className="row">
          <div className="col-lg-6">
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
            <div className="form-group">
              <label>Url*</label>
              <input
                type="text"
                ref="input_url"
                value={this.state.url}
                onChange={(e) => {
<<<<<<< HEAD
                  this.setState({ 'url': e.target.value })
=======
                  this.setState({'url': e.target.value})
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
                  this.validateField('url');
                }}
                className={this.getValidationClass("url") + "form-control display-inline"}
              />
<<<<<<< HEAD
              <span onClick={(e) => { this.loadWMSCapabilities(e) }} className="btn btn-default btn-sm">Ladda {loader}</span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label>Infoklick-format</label>
              <select
                className="form-control"
                onChange={(e) => this.setState({selectedFormat: e.target.value })}>
                {this.state.infoclickFormats}
              </select>
=======
              <span onClick={(e) => {this.loadWMSCapabilities(e)}} className="btn btn-default btn-sm">Ladda {loader}</span>
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Bildformat</label>
<<<<<<< HEAD
              <select ref="input_imageFormat" onChange={(e) => this.setState({ imageFormat: e.target.value })} className="form-control">
=======
              <select ref="input_imageFormat" value={this.state.imageFormat} onChange={(e) => this.setState({'imageFormat': e.target.value})} className="form-control">
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
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
<<<<<<< HEAD
              <select ref="input_coordSystems" value={this.state.coordSystem} onChange={(e) => this.setState({ coordSystem: e.target.value })} className="form-control">
                {this.state.coordSystems}
              </select>
=======
              <p className="text-display">CRS</p>
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
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
<<<<<<< HEAD
        </div>
        <div className="row">
          {this.renderLayerList()}
        </div>
=======
          <label className="col-md-5">Stil</label>
        </div>
        {this.renderLayerList()}
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
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
<<<<<<< HEAD
              onChange={(e) => {
                this.setState({ 'caption': e.target.value });
=======
              onChange={(e) => {              
                this.setState({'caption': e.target.value});
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
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
<<<<<<< HEAD
              onChange={(e) => {
                this.setState({ 'content': e.target.value });
=======
              onChange= { (e) => { 
                this.setState({'content': e.target.value});
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
              }}
              className="form-control" />
          </div>
        </div>
        <div className="row">
<<<<<<< HEAD
          <div className="col-md-6">
            <div className="form-group">
              <label>Senast Ändrad</label>
              <span ref="input_date" className="text-display"><i>{this.props.model.parseDate(this.state.date)}</i></span>
=======
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
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
            </div>
          </div>
        </div>
        <div className="row">
<<<<<<< HEAD
=======
          <div className="col-md-12">
            <label>Senast ändrad</label>
            <span ref="input_date"><i>{this.props.model.parseDate(this.state.date)}</i></span>
          </div>
        </div>
        <div className="row">
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
          <div className="col-md-6">
            <div className="form-group">
              <label>Synligt vid start</label>
              <input
                type="checkbox"
                ref="input_visibleAtStart"
                onChange={
                  (e) => {
<<<<<<< HEAD
                    this.setState({ visibleAtStart: e.target.checked })
=======
                    this.setState({visibleAtStart: e.target.checked})
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
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
<<<<<<< HEAD
                onChange={(e) => { this.setState({ singleTile: e.target.checked }) }}
=======
                onChange={(e) => { this.setState({singleTile: e.target.checked})}}
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
                checked={this.state.singleTile}
              />
            </div>
          </div>
        </div>
<<<<<<< HEAD
=======

        <div>
          <label>Inforuta</label>
          <textarea
            ref="input_infobox"
            value={this.state.infobox}
            onChange={(e) => this.setState({'infobox': e.target.value})}
          />
        </div>
        <div>
          <label>Servertyp</label>
          <select ref="input_serverType" value={this.state.serverType} onChange={(e) => this.setState({'serverType': e.target.value})}>
            <option>geoserver</option>
            <option>arcgis</option>
          </select>
        </div>
        <div>
          <label>Infoklickbar</label>
          <input
            type="checkbox"
            ref="input_queryable"
            onChange={(e) => {this.setState({queryable: e.target.checked})}}
            checked={this.state.queryable}
          />
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
        </div>
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
      </fieldset>
    );
  }
}

<<<<<<< HEAD
export default WMSLayerFormTest;
=======
export default WMSLayerFormTest;
>>>>>>> a92f5b0074503ba77a3407ff0c3a65ca8179aa03
