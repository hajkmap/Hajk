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
import { SketchPicker } from 'react-color';

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
  lineColor: "rgba(0, 0, 0, 0.5)",
  lineWidth: "3",
  lineStyle: "solid",
  fillColor: "rgba(255, 255, 255, 0.5)",
  projection: "",
  layer: "",
  opacity: 1,
  symbolXOffset: 0,
  symbolYOffset: 0,  
  labelAlign: "center",
  labelBaseline: "alphabetic",
  labelSize: "12px",
  labelOffsetX: 0,
  labelOffsetY: 0,
  labelWeight: "normal",
  labelFont: "Arial",
  labelFillColor: "#000000",
  labelOutlineColor: "#FFFFFF",
  labelOutlineWidth: 3,
  labelAttribute: "Name",
  showLabels: false,
  infoVisible: false,
  infoTitle: "",
  infoText: "",
  infoUrl: "",
  infoOwner: ""
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
      lineStyle: this.getValue("lineStyle"),
      lineColor: this.getValue("lineColor"),
      lineWidth: this.getValue("lineWidth"),
      fillColor: this.getValue("fillColor"),
      projection: this.getValue("projection"),
      layer: this.state.addedLayers[0],
      opacity: this.getValue("opacity"),
      symbolXOffset: this.getValue("symbolXOffset"),
      symbolYOffset: this.getValue("symbolYOffset"),
      queryable: this.getValue("queryable"),
      infobox: this.getValue("infobox"),
      showLabels: this.getValue("showLabels"),
      labelAlign: this.getValue("labelAlign"),
      labelBaseline: this.getValue("labelBaseline"),
      labelSize: this.getValue("labelSize"),
      labelOffsetX: this.getValue("labelOffsetX"),
      labelOffsetY: this.getValue("labelOffsetY"),
      labelWeight: this.getValue("labelWeight"),
      labelFont: this.getValue("labelFont"),
      labelFillColor: this.getValue("labelFillColor"),
      labelOutlineColor: this.getValue("labelOutlineColor"),
      labelOutlineWidth: this.getValue("labelOutlineWidth"),
      labelAttribute: this.getValue("labelAttribute"),      
      infoVisible: this.getValue("infoVisible"),
      infoTitle: this.getValue("infoTitle"),
      infoText: this.getValue("infoText"),
      infoUrl: this.getValue("infoUrl"),
      infoOwner: this.getValue("infoOwner")
    }
  }

  getValue(fieldName) {

    function create_date() {
      return (new Date()).getTime();
    }

    function format_layers(layers) {
      return layers.map(layer => layer.id.toString());
    }

    function rgba_to_string(c) {
      return typeof c === "string"
        ? c
        : `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
    }

    var input = this.refs["input_" + fieldName]
    ,   value = input ? input.value : "";

    if (fieldName === 'date') value = create_date();
    if (fieldName === 'queryable') value = input.checked;
    if (fieldName === 'visibleAtStart') value = input.checked;
    if (fieldName === 'showLabels') value = input.checked;
    if (fieldName === 'fillColor') value = rgba_to_string(this.state.fillColor);
    if (fieldName === 'lineColor') value = rgba_to_string(this.state.lineColor);
    if (fieldName === 'labelFillColor') value = rgba_to_string(this.state.labelFillColor);
    if (fieldName === 'labelOutlineColor') value = rgba_to_string(this.state.labelOutlineColor);
    if (fieldName === 'infoVisible') value = input.checked;

    return value;
  }

  validate() {
    var valid = true
    ,   validationFields = ["url", "caption", "projection"];

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

  setLineWidth(e) {
    this.setState({
      lineWidth: e.target.value
    });
  }

  setLineStyle(e) {
    this.setState({
      lineStyle: e.target.value
    });
  }

  setLineColor(color) {
    this.setState({
      lineColor: color
    });
  }

  setFillColor(color) {
    this.setState({
      fillColor: color
    });
  }

  setLabelAlign(e) {
    this.setState({
      labelAlign: e.target.value
    });
  }

  setLabelBaseline(e) {
    this.setState({
      labelBaseline: e.target.value
    });
  }

  setLabelWeight() {
    this.setState({
      labelWeight: e.target.value
    });
  }

  setLabelFont() {
    this.setState({
      labelFont: e.target.value
    });
  }

  setLabelFillColor(color) {
    this.setState({
      labelFillColor: color
    });
  }

  setLabelOutlineColor(color) {
    this.setState({
      labelOutlineColor: color
    });
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
    var imageLoader = this.state.imageLoad ? <i className="fa fa-refresh fa-spin"></i> : null;
    var infoClass = this.state.infoVisible ? "tooltip-info" : "hidden";

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
        <div>
          <label>Ikon</label>
          <input
            type="text"
            ref="input_legend"
            value={this.state.legend}
            className={this.getValidationClass("legend")}
            onChange={(e) => {
              this.setState({legend: e.target.value});              
            }}
          />
          <span onClick={(e) => {this.loadLegendImage(e)}} className="btn btn-default">Välj fil {imageLoader}</span>
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
          <label>Linjetjocklek</label>
          <select
            ref="input_lineWidth"
            value={this.state.lineWidth}
            onChange={(e) => {this.setLineWidth(e)}}>
            <option value="1">Tunn</option>
            <option value="3">Normal</option>
            <option value="5">Tjock</option>
            <option value="8">Tjockare</option>
          </select>
        </div>
        <div>
          <label>Linjestil</label>
          <select
            ref="input_lineStyle"
            value={this.state.lineStyle}
            onChange={(e) => {this.setLineStyle(e)}}>
            <option value="solid">Heldragen</option>
            <option value="dash">Streckad</option>
            <option value="dot">Punktad</option>
          </select>
        </div>
        <div>
          <label>Linjefärg</label>
            <SketchPicker
              color={this.state.lineColor}
              onChangeComplete={(color) => this.setLineColor(color.rgb)}
            />
        </div>
        <div>
          <label>Fyllnadsfärg</label>
          <SketchPicker
            color={this.state.fillColor}
            onChangeComplete={(color) => this.setFillColor(color.rgb)}
          />
        </div>
        <div>
          <label>Visa etikett</label>
          <input
            type="checkbox"
            ref="input_showLabels"
            onChange={(e) => {
              this.setState({showLabels: e.target.checked})
            }}
            checked={this.state.showLabels}
          />
        </div>
        <div>
          <label>Textjustering</label>
          <select
            ref="input_labelAlign"
            value={this.state.labelAlign}
            onChange={(e) => {this.setLabelAlign(e)}}>
            <option value="center">Centrerad</option>
            <option value="left">Vänster</option>
            <option value="right">Höger</option>
            <option value="start">Start</option>
          </select>
        </div>
        <div>
          <label>Baslinje</label>
          <select
            ref="input_labelBaseline"
            value={this.state.labelBaseline}
            onChange={(e) => {this.setLabelBaseline(e)}}>                        
            <option value="bottom">Nederkant</option>
            <option value="top">Överkant</option>
            <option value="middle">Mitten</option>
            <option value="hanging">Hängande</option>
            <option value="alphabetic">Alfabetisk</option>
            <option value="ideographic">Ideografisk (för symboler)</option>            
          </select>
        </div>
        <div>
          <label>Textstorlek</label>
          <input
            type="text"
            ref="input_labelSize"
            value={this.state.labelSize}
            onChange={(e) => {
              this.setState({labelSize: e.target.value});
            }}
          />
        </div>        
        <div>
          <label>Textförskjutning X</label>
          <input
            type="text"
            ref="input_labelOffsetX"
            value={this.state.labelOffsetX}
            onChange={(e) => {
              this.setState({labelOffsetX: e.target.value});
            }}
          />
        </div>
        <div>
          <label>Textförskjutning Y</label>
          <input
            type="text"
            ref="input_labelOffsetY"
            value={this.state.labelOffsetY}
            onChange={(e) => {
              this.setState({labelOffsetY: e.target.value});
            }}
          />
        </div>
        <div>
          <label>Texttjocklek</label>
          <select
            ref="input_labelWeight"
            value={this.state.labelWeight}
            onChange={(e) => {this.setLabelWeight(e)}}>                        
            <option value="normal">Normal</option>
            <option value="bold">Fet</option>
          </select>
        </div>
        <div>
          <label>Teckensnitt</label>
          <select
            ref="input_labelFont"
            value={this.state.labelFont}
            onChange={(e) => {this.setLabelFont(e)}}>                        
            <option value="Arial">Arial</option>
            <option value="Courier New">Courier New</option>
            <option value="Quattrocento">Quattrocento</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>
        <div>
          <label>Fyllnadsfärg (text)</label>
          <SketchPicker
            color={this.state.labelFillColor}
            onChangeComplete={(color) => this.setLabelFillColor(color.rgb)}
          />
        </div>
        <div>
          <label>Kantlinjefärg (text)</label>
          <SketchPicker
            color={this.state.labelOutlineColor}
            onChangeComplete={(color) => this.setLabelOutlineColor(color.rgb)}
          />
        </div>
        <div>
          <label>Kantlinjebredd (text)</label>
          <input
            type="text"
            ref="input_labelOutlineWidth"
            value={this.state.labelOutlineWidth}
            onChange={(e) => {
              this.setState({labelOutlineWidth: e.target.value});
            }}
          />
        </div>
        <div>
          <label>Attribut för text</label>
          <input
            type="text"
            ref="input_labelAttribute"
            value={this.state.labelAttribute}
            onChange={(e) => {
              this.setState({labelAttribute: e.target.value});
            }}
          />
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
        <div className="info-container">
          <div>
            <label>Infodokument</label>
            <input
              type="checkbox"
              ref="input_infoVisible"
              onChange={(e) => { this.setState({infoVisible: e.target.checked})}}
              checked={this.state.infoVisible}
            />
          </div>
          <div className={infoClass}>
            <label>Rubrik</label>
            <input 
              type="text"
              ref="input_infoTitle"
                onChange={(e) => {
                  this.setState({infoTitle: e.target.value});
                  this.validateField("infoTitle", e);
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
                  this.setState({infoText: e.target.value});
                  this.validateField("infoText", e);
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
                  this.setState({infoUrl: e.target.value});
                  this.validateField("infoUrl", e);
                }}
                value={this.state.infoUrl}
                className={this.getValidationClass("infoUrl")}
            />
          </div>
          <div className={infoClass}>
            <label>Ägare</label>
            <input 
              type="text"
              ref="input_infoOwner"
                onChange={(e) => {
                  this.setState({infoOwner: e.target.value});
                  this.validateField("infoOwner", e);
                }}
                value={this.state.infoOwner ? this.state.infoOwner : this.state.owner}
                className={this.getValidationClass("infoOwner")}
            />
          </div>
        </div>
      </fieldset>
    );
  }
}

export default VectorLayerForm;
