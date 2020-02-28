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
import { Component } from "react";
import $ from "jquery";
import { SketchPicker } from "react-color";

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
  queryable: true,
  filterable: false,
  drawOrder: 1,
  filterAttribute: "",
  filterValue: "",
  filterComparer: "eq",
  pointSize: 6,
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
  infoUrlText: "",
  infoOwner: ""
};

/**
 *
 */
class VectorLayerForm extends Component {
  componentDidMount() {
    defaultState.url = this.props.url;
    this.setState(defaultState);
    this.props.model.on("change:legend", () => {
      this.setState(
        {
          legend: this.props.model.get("legend")
        },
        () => this.validateField("legend")
      );
    });
  }

  componentWillUnmount() {
    this.props.model.off("change:legend");
  }

  constructor() {
    super();
    this.state = defaultState;
    this.layer = {};
  }

  describeLayer(layer) {
    this.props.model.getWFSLayerDescription(
      this.state.url,
      layer.name,
      layerDescription => {
        if (Array.isArray(layerDescription)) {
          this.props.parent.setState({
            layerProperties: layerDescription.map(d => {
              return {
                name: d.name,
                type: d.localType
              };
            })
          });
        }
      }
    );
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
      filterValue: this.getValue("filterValue"),
      filterAttribute: this.getValue("filterAttribute"),
      filterComparer: this.getValue("filterComparer"),
      pointSize: this.getValue("pointSize"),
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
      filterable: this.getValue("filterable"),
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
      infoUrlText: this.getValue("infoUrlText"),
      infoOwner: this.getValue("infoOwner")
    };
  }

  getValue(fieldName) {
    function create_date() {
      return new Date().getTime();
    }

    function rgba_to_string(c) {
      return typeof c === "string" ? c : `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
    }

    var input = this.refs["input_" + fieldName],
      value = input ? input.value : "";

    if (fieldName === "date") value = create_date();
    if (fieldName === "queryable") value = input.checked;
    if (fieldName === "filterable") value = input.checked;
    if (fieldName === "showLabels") value = input.checked;
    if (fieldName === "fillColor") value = rgba_to_string(this.state.fillColor);
    if (fieldName === "lineColor") value = rgba_to_string(this.state.lineColor);
    if (fieldName === "labelFillColor")
      value = rgba_to_string(this.state.labelFillColor);
    if (fieldName === "labelOutlineColor")
      value = rgba_to_string(this.state.labelOutlineColor);
    if (fieldName === "infoVisible") value = input.checked;

    return value;
  }

  validate() {
    var validationFields = ["url", "caption", "projection"];
    if (this.state.dataFormat !== "GeoJSON") {
      validationFields.push("layer");
    }

    var errors = [];

    validationFields.forEach(field => {
      var valid = this.validateField(field, false, false);
      if (!valid) {
        errors.push(field);
      }
    });

    this.setState({
      validationErrors: errors
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
      case "layer":
        if (
          this.state &&
          this.state.addedLayers &&
          this.state.addedLayers.length === 0
        ) {
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

    if (updateState !== false) {
      if (!valid) {
        this.setState({
          validationErrors: [...this.state.validationErrors, fieldName]
        });
      } else {
        this.setState({
          validationErrors: this.state.validationErrors.filter(
            v => v !== fieldName
          )
        });
      }
    }

    return valid;
  }

  getValidationClass(inputName) {
    return this.state.validationErrors.find(v => v === inputName)
      ? "validation-error"
      : "";
  }

  loadWFSCapabilities(e, callback) {
    if (e) {
      e.preventDefault();
    }

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

    this.props.model.getWFSCapabilities(this.state.url, capabilities => {
      var projection = "";
      if (Array.isArray(capabilities) && capabilities.length > 0) {
        projection = capabilities[0].projection;
      }
      this.setState({
        capabilities: capabilities,
        projection: this.state.projection || projection || "",
        legend: this.state.legend || capabilities.legend || "",
        load: false
      });

      this.validate();

      if (capabilities === false) {
        this.props.parent.setState({
          alert: true,
          alertMessage: "Servern svarar inte. Försök med en annan URL."
        });
      }
      if (callback) {
        callback();
      }
    });
  }

  loadLegendImage(e) {
    $("#select-image").trigger("click");
  }

  setLineWidth(e) {
    this.setState({
      lineWidth: e.target.value
    });
  }

  setPointSize(e) {
    this.setState({
      pointSize: e.target.value
    });
  }

  setFilterAttribute(e) {
    this.setState({
      filterAttribute: e.target.value
    });
  }

  setFilterValue(e) {
    this.setState({
      filterValue: e.target.value
    });
  }

  setFilterComparer(e) {
    this.setState({
      filterComparer: e.target.value
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

  setLabelWeight(e) {
    this.setState({
      labelWeight: e.target.value
    });
  }

  setLabelFont(e) {
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
    if (e.target.checked === true) {
      this.setState(
        {
          addedLayers: [checkedLayer]
        },
        () => this.validate()
      );
    } else {
      this.setState(
        {
          addedLayers: this.state.addedLayers.filter(
            layer => layer !== checkedLayer
          )
        },
        () => this.validate()
      );
    }
  }

  loadLayers(layer, callback) {
    if (this.state.dataFormat === "WFS") {
      this.loadWFSCapabilities(undefined, () => {
        this.setState({
          addedLayers: [layer.layer]
        });
        Object.keys(this.refs).forEach(element => {
          if (this.refs[element].dataset.type === "wms-layer") {
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
              onChange={e => {
                this.appendLayer(e, layer.name);
              }}
            />
            &nbsp;
            <label htmlFor={"layer" + i}>{layer.title}</label>
            <i
              className={classNames}
              onClick={e => this.describeLayer(layer)}
            />
          </li>
        );
      });
    } else {
      return null;
    }
  }

  renderSelectedLayers() {
    if (!this.state.addedLayers) return null;

    function uncheck(layer) {
      this.appendLayer(
        {
          target: {
            checked: false
          }
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

  renderLayerList() {
    var layers = this.renderLayersFromCapabilites();
    return (
      <div className="layer-list">
        <ul>{layers}</ul>
      </div>
    );
  }

  render() {
    var loader = this.state.load ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    var imageLoader = this.state.imageLoad ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    var infoClass = this.state.infoVisible ? "tooltip-info" : "hidden";

    return (
      <fieldset>
        <legend>Vektor-lager</legend>
        <div className="separator">Anslutning</div>
        <div>
          <label>Dataformat*</label>
          <select
            ref="input_dataFormat"
            value={this.state.dataFormat}
            className="control-fixed-width"
            onChange={e => {
              this.setState({
                dataFormat: e.target.value
              });
            }}
          >
            <option>WFS</option>
            <option>GeoJSON</option>
          </select>
        </div>
        <div>
          <label>Url*</label>
          <input
            type="text"
            ref="input_url"
            value={this.state.url}
            className={this.getValidationClass("url")}
            onChange={e => {
              const v = e.target.value;
              this.setState({ url: v }, () => this.validateField("url"));
            }}
          />
          <span
            onClick={e => {
              this.loadWFSCapabilities(e);
            }}
            className="btn btn-default"
          >
            Ladda {loader}
          </span>
        </div>
        <div className="separator">Tillgängliga lager</div>
        <div>
          <label>Lagerlista</label>
          {this.renderLayerList()}
        </div>
        <div className="separator">Hantera valda lager</div>
        <div>
          <label>Valt lager*</label>
          <div
            ref="input_layer"
            className={"layer-list-choosen " + this.getValidationClass("layer")}
          >
            <ul>{this.renderSelectedLayers()}</ul>
          </div>
        </div>
        <div>
          <label>Visningsnamn*</label>
          <input
            type="text"
            ref="input_caption"
            value={this.state.caption}
            className={this.getValidationClass("caption")}
            onChange={e => {
              const v = e.target.value;
              this.setState({ caption: v }, () =>
                this.validateField("caption")
              );
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
            onChange={e => {
              const v = e.target.value;
              this.setState({ projection: v }, () =>
                this.validateField("projection")
              );
            }}
          />
        </div>
        <div>
          <label>Opacitet*</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            ref="input_opacity"
            value={this.state.opacity}
            className={
              (this.getValidationClass("opacity"), "control-fixed-width")
            }
            onChange={e => {
              const v = e.target.value;
              this.setState({ opacity: v }, () =>
                this.validateField("opacity")
              );
            }}
          />
        </div>
        <div>
          <input
            type="checkbox"
            ref="input_queryable"
            id="queryable"
            onChange={e => {
              this.setState({ queryable: e.target.checked });
            }}
            checked={this.state.queryable}
          />
          &nbsp;
          <label htmlFor="queryable">Infoklickbar</label>
        </div>
        <div>
          <label>Inforuta</label>
          <textarea
            ref="input_infobox"
            value={this.state.infobox}
            onChange={e => this.setState({ infobox: e.target.value })}
          />
        </div>
        <div className="separator">Filtrering</div>
        <div>
          <input
            type="checkbox"
            ref="input_filterable"
            id="filterable"
            onChange={e => {
              this.setState({ filterable: e.target.checked });
            }}
            checked={this.state.filterable}
          />
          &nbsp;
          <label htmlFor="filterable">Filterbar</label>
        </div>
        <div>
          <label>Filterattribut</label>
          <input
            type="text"
            ref="input_filterAttribute"
            value={this.state.filterAttribute}
            onChange={e => {
              this.setState({ filterAttribute: e.target.value });
            }}
          />
        </div>
        <div>
          <label>Filterjämförare</label>
          <select
            ref="input_filterComparer"
            value={this.state.filterComparer}
            className="control-fixed-width"
            onChange={e => {
              this.setState({
                filterComparer: e.target.value
              });
            }}
          >
            <option value="lt">Mindre än</option>
            <option value="gt">Större än</option>
            <option value="eq">Lika med</option>
            <option value="not">Skilt från</option>
          </select>
        </div>
        <div>
          <label>Filtervärde</label>
          <input
            type="text"
            ref="input_filterValue"
            value={this.state.filterValue}
            onChange={e => {
              this.setState({ filterValue: e.target.value });
            }}
          />
        </div>
        <div className="separator">Inställningar för objekt</div>
        <div>
          <label>Ikon</label>
          <input
            type="text"
            ref="input_legend"
            value={this.state.legend}
            className={this.getValidationClass("legend")}
            onChange={e => {
              this.setState({ legend: e.target.value });
            }}
          />
          <span
            onClick={e => {
              this.loadLegendImage(e);
            }}
            className="btn btn-default"
          >
            Välj fil {imageLoader}
          </span>
        </div>
        <div>
          <label>Ikonförskjutning X</label>
          <input
            type="text"
            ref="input_symbolXOffset"
            value={this.state.symbolXOffset}
            className={this.getValidationClass("symbolXOffset")}
            onChange={e => {
              const v = e.target.value;
              this.setState({ symbolXOffset: v }, () =>
                this.validateField("symbolXOffset")
              );
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
            onChange={e => {
              const v = e.target.value;
              this.setState({ symbolYOffset: v }, () =>
                this.validateField("symbolYOffset")
              );
            }}
          />
        </div>
        <div>
          <label>Ikonstorlek</label>
          <select
            ref="input_pointSize"
            value={this.state.pointSize}
            className="control-fixed-width"
            onChange={e => {
              this.setPointSize(e);
            }}
          >
            <option value="4">Liten</option>
            <option value="8">Medium</option>
            <option value="16">Stor</option>
            <option value="32">Större</option>
            <option value="64">Störst</option>
          </select>
        </div>
        <div>
          <label>Linjetjocklek</label>
          <select
            ref="input_lineWidth"
            value={this.state.lineWidth}
            className="control-fixed-width"
            onChange={e => {
              this.setLineWidth(e);
            }}
          >
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
            className="control-fixed-width"
            onChange={e => {
              this.setLineStyle(e);
            }}
          >
            <option value="solid">Heldragen</option>
            <option value="dash">Streckad</option>
            <option value="dot">Punktad</option>
          </select>
        </div>
        <div className="clearfix">
          <span className="pull-left">
            <label>Fyllnadsfärg</label>
            <br />
            <SketchPicker
              color={this.state.fillColor}
              onChangeComplete={color => this.setFillColor(color.rgb)}
            />
          </span>
          <span className="pull-left" style={{ marginLeft: "10px" }}>
            <label>Linjefärg</label>
            <br />
            <SketchPicker
              color={this.state.lineColor}
              onChangeComplete={color => this.setLineColor(color.rgb)}
            />
          </span>
        </div>
        <div className="separator">Inställningar för etiketter</div>
        <div>
          <input
            type="checkbox"
            ref="input_showLabels"
            id="showLabels"
            onChange={e => {
              this.setState({ showLabels: e.target.checked });
            }}
            checked={this.state.showLabels}
          />
          &nbsp;
          <label htmlFor="showLabels">Visa etikett</label>
        </div>
        <div>
          <label>Attribut för text</label>
          <input
            type="text"
            ref="input_labelAttribute"
            value={this.state.labelAttribute}
            onChange={e => {
              this.setState({ labelAttribute: e.target.value });
            }}
          />
        </div>
        <div>
          <label>Textjustering</label>
          <select
            ref="input_labelAlign"
            value={this.state.labelAlign}
            className="control-fixed-width"
            onChange={e => {
              this.setLabelAlign(e);
            }}
          >
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
            className="control-fixed-width"
            onChange={e => {
              this.setLabelBaseline(e);
            }}
          >
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
            onChange={e => {
              this.setState({ labelSize: e.target.value });
            }}
          />
        </div>
        <div>
          <label>Textförskjutning X</label>
          <input
            type="text"
            ref="input_labelOffsetX"
            value={this.state.labelOffsetX}
            onChange={e => {
              this.setState({ labelOffsetX: e.target.value });
            }}
          />
        </div>
        <div>
          <label>Textförskjutning Y</label>
          <input
            type="text"
            ref="input_labelOffsetY"
            value={this.state.labelOffsetY}
            onChange={e => {
              this.setState({ labelOffsetY: e.target.value });
            }}
          />
        </div>
        <div>
          <label>Texttjocklek</label>
          <select
            ref="input_labelWeight"
            value={this.state.labelWeight}
            className="control-fixed-width"
            onChange={e => {
              this.setLabelWeight(e);
            }}
          >
            <option value="normal">Normal</option>
            <option value="bold">Fet</option>
          </select>
        </div>
        <div>
          <label>Teckensnitt</label>
          <select
            ref="input_labelFont"
            value={this.state.labelFont}
            className="control-fixed-width"
            onChange={e => {
              this.setLabelFont(e);
            }}
          >
            <option value="Arial">Arial</option>
            <option value="Courier New">Courier New</option>
            <option value="Quattrocento">Quattrocento</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>
        <div className="separator">Etikettfärger</div>
        <div>
          <label>Kantlinjebredd (text)</label>
          <input
            type="number"
            min="0"
            ref="input_labelOutlineWidth"
            value={this.state.labelOutlineWidth}
            className="control-fixed-width"
            onChange={e => {
              this.setState({ labelOutlineWidth: e.target.value });
            }}
          />
        </div>
        <div className="clearfix">
          <span className="pull-left">
            <label>Fyllnadsfärg (text)</label>
            <br />
            <SketchPicker
              color={this.state.labelFillColor}
              onChangeComplete={color => this.setLabelFillColor(color.rgb)}
            />
          </span>
          <span className="pull-left" style={{ marginLeft: "10px" }}>
            <label>Kantlinjefärg (text)</label>
            <br />
            <SketchPicker
              color={this.state.labelOutlineColor}
              onChangeComplete={color => this.setLabelOutlineColor(color.rgb)}
            />
          </span>
        </div>

        <div className="separator">Metadata</div>
        <div>
          <label>Innehåll</label>
          <input
            type="text"
            ref="input_content"
            value={this.state.content}
            onChange={e => {
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

        <div className="info-container">
          <div>
            <input
              type="checkbox"
              ref="input_infoVisible"
              id="info-document"
              onChange={e => {
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
              onChange={e => {
                const v = e.target.value;
                this.setState({ infoTitle: v }, () =>
                  this.validateField("infoTitle", v)
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
              onChange={e => {
                const v = e.target.value;
                this.setState({ infoText: v }, () =>
                  this.validateField("infoText", v)
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
              onChange={e => {
                const v = e.target.value;
                this.setState({ infoUrl: v }, () =>
                  this.validateField("infoUrl", v)
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
              onChange={e => {
                const v = e.target.value;
                this.setState({ infoUrlText: v }, () =>
                  this.validateField("infoUrlText", v)
                );
              }}
              value={this.state.infoUrlText}
              className={this.getValidationClass("infoUrlText")}
            />
          </div>
          <div className={infoClass}>
            <label>Ägare</label>
            <input
              type="text"
              ref="input_infoOwner"
              onChange={e => {
                const v = e.target.value;
                this.setState({ infoOwner: v }, () =>
                  this.validateField("infoOwner", v)
                );
              }}
              value={this.state.infoOwner}
              className={this.getValidationClass("infoOwner")}
            />
          </div>
        </div>
      </fieldset>
    );
  }
}

export default VectorLayerForm;
