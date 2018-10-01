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
import Alert from "../alert.jsx";

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
  infoFormat: "",
  legend: "",
  owner: "",
  url: "",
  searchFields: "",
  displayFields: "",
  tiled: false,
  singleTile: false,
  version: "",
  imageFormat: "",
  projection: "",
  serverType: "geoserver",
  drawOrder: 1,
  layerType: "ExtendedWMS",
  attribution: "",
  layerSettings: {
    settings: true,
    visible: false,
    styles: [],
    queryable: false,
    confirmAction: () => {},
    denyAction: () => {}
  },
  infoVisible: false,
  infoTitle: "",
  infoText: "",
  infoUrl: "",
  infoUrlText: "",
  infoOwner: ""
};

const supportedProjections = [
  "EPSG:3006",
  "EPSG:3007",
  "EPSG:3008",
  "EPSG:3009",
  "EPSG:3010",
  "EPSG:3011",
  "EPSG:3012",
  "EPSG:3013",
  "EPSG:3014",
  "EPSG:3015",
  "EPSG:3016",
  "EPSG:3017",
  "EPSG:3018",
  "EPSG:3021",
  "EPSG:4326",
  "EPSG:3857",
  "CRS:84"
];

const supportedInfoFormats = [
  "application/json",
  "text/plain",
  "text/xml",
  "application/geojson"
];

const supportedImageFormats = [
  "image/png",
  "image/jpeg",
  "image/png; mode=8bit"
];

/**
 *
 */
class ExtendedWMSLayerForm extends Component {
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

  reset() {
    this.setState(defaultState);
  }

  loadLegendImage(e) {
    $("#select-image").trigger("click");
  }

  renderLayerList() {
    var layers = this.renderLayersFromCapabilites();

    return (
      <div className="col-md-12 layer-list-test no-padding">
        <ul className="list-group no-padding no-margin-top">{layers}</ul>
      </div>
    );
  }

  appendLayer(e, checkedLayer) {
    if (e.target.checked === true) {
      let layer = {
        name: checkedLayer,
        queryable: false,
        style: ""
      };
      this.setState(
        {
          addedLayers: [...this.state.addedLayers, layer]
        },
        () => this.validateField("layers")
      );
    } else {
      this.setState(
        {
          addedLayers: this.state.addedLayers.filter(
            layer => layer.name !== checkedLayer
          )
        },
        () => this.validateField("layers")
      );
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
        layer.name
      );
      this.refs[layer.name].checked = false;
      this.validateField("layers");
    }
    return this.state.addedLayers.map((layer, i) => (
      <li className="layer" key={"addedLayer_" + i}>
        <span>
          <i
            className="fa fa-list"
            onClick={this.setLayerSettings.bind(this, layer)}
          />
          &nbsp;
          <span>{layer.name}</span>
        </span>
        &nbsp;
        <i className="fa fa-times" onClick={uncheck.bind(this, layer)} />
      </li>
    ));
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
        var classNames =
          this.state.layerPropertiesName === layer.Name
            ? "fa fa-info-circle active"
            : "fa fa-info-circle";

        var i = index;
        var title = /^\d+$/.test(layer.Name) ? (
          <label>
            &nbsp;
            {layer.Title}
          </label>
        ) : null;
        var queryableIcon = layer.queryable ? "fa fa-check" : "fa fa-remove";

        return (
          <li key={"fromCapability_" + i} className="list-item">
            <div className="col-md-6 overflow-hidden">
              <input
                ref={layer.Name}
                id={"layer" + i}
                type="checkbox"
                data-type="wms-layer"
                checked={this.state.addedLayers.find(l => l === layer.Name)}
                onChange={e => {
                  this.setState({ caption: layer.Title });
                  this.setState({ content: layer.Abstract });
                  this.appendLayer(e, layer.Name);
                }}
              />
              &nbsp;
              <label htmlFor={"layer" + i}>{layer.Name}</label>
              {title}
            </div>
            <i
              style={{ display: "none" }}
              className={classNames}
              onClick={e => this.describeLayer(e, layer.Name)}
            />
            <span className={queryableIcon + " col-md-1"} />
          </li>
        );
      };

      this.state.capabilities.Capability.Layer.Layer.forEach((layer, index) => {
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
        if (this.refs[element].dataset.type === "wms-layer") {
          this.refs[element].checked = false;
        }
      });
      layer.layers.forEach(layer => {
        this.refs[layer.name].checked = true;
      });
      if (callback) callback();
    });
  }

  loadWMSCapabilities(e, callback) {
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
      this.state.capabilities.Capability.Layer.Layer.forEach((layer, i) => {
        this.refs[layer.Name].checked = false;
      });
    }
    this.props.model.getWMSCapabilities(this.state.url, capabilities => {
      this.setState(
        {
          capabilities: capabilities,
          load: false
        },
        () => {
          if (capabilities === false) {
            this.props.parent.setState({
              alert: true,
              alertMessage: "Det gick inte att ladda data från vald Url."
            });
          }
          this.setVersion();
          this.setServerType();
          if (callback) {
            callback();
          }
        }
      );
    });
  }

  setLegend(value) {
    this.setState({ legend: value });
  }

  setVersion() {
    this.setState({
      version: this.state.capabilities ? this.state.capabilities.version : ""
    });
  }

  setImageFormats() {
    let imgs;
    if (this.state.capabilities) {
      imgs = this.state.capabilities.Capability.Request.GetMap.Format;
    }

    let imgFormats = imgs
      ? supportedImageFormats.map((imgFormat, i) => {
          if (imgs.indexOf(imgFormat) > -1) {
            return <option key={i}>{imgFormat}</option>;
          } else {
            return "";
          }
        })
      : "";

    return imgFormats;
  }

  setInfoFormats() {
    let formats;
    if (this.state.capabilities) {
      formats = this.state.capabilities.Capability.Request.GetFeatureInfo
        .Format;
    }

    let formatEles = formats
      ? supportedInfoFormats.map((format, i) => {
          if (formats.indexOf(format) > -1) {
            return <option key={i}>{format}</option>;
          } else {
            return "";
          }
        })
      : "";

    return formatEles;
  }

  setServerType() {
    if (this.state.capabilities) {
      let formats;
      formats = this.state.capabilities.Capability.Request.GetFeatureInfo
        .Format;
      if (formats.indexOf("application/geojson") > -1) {
        this.setState({ serverType: "arcgis" });
      } else {
        this.setState({ serverType: "geoserver" });
      }
    } else {
      this.setState({ serverType: "" });
    }
  }

  setProjections() {
    let projections;
    if (this.state.capabilities) {
      projections = this.state.capabilities.Capability.Layer.CRS;
    }

    let projEles = projections
      ? supportedProjections.map((proj, i) => {
          if (projections.indexOf(proj) > -1) {
            return <option key={i}>{proj}</option>;
          } else {
            return "";
          }
        })
      : "";

    return projEles;
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
      searchFields: this.getValue("searchFields"),
      displayFields: this.getValue("displayFields"),
      infoFormat: this.getValue("infoFormat"),
      infobox: this.getValue("infobox"),
      singleTile: this.getValue("singleTile"),
      imageFormat: this.getValue("imageFormat"),
      serverType: this.state.serverType,
      tiled: this.getValue("tiled"),
      drawOrder: this.getValue("drawOrder"),
      attribution: this.getValue("attribution"),
      projection: this.getValue("projection"),
      version: this.state.version,
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
    var input = this.refs["input_" + fieldName],
      value = input ? input.value : "";

    if (fieldName === "date") value = create_date();
    if (fieldName === "singleTile") value = input.checked;
    if (fieldName === "tiled") value = input.checked;
    if (fieldName === "queryable") value = input.checked;
    if (fieldName === "layers") value = this.state.addedLayers;
    if (fieldName === "infoVisible") value = input.checked;

    return value;
  }

  validate() {
    var validationFields = ["url", "caption", "layers"];
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

  getValidationClass(inputName) {
    return this.state.validationErrors.find(v => v === inputName)
      ? "validation-error"
      : "";
  }

  validateField(fieldName, forcedValue, updateState) {
    var value = this.getValue(fieldName),
      valid = true;

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

  /**
   * Populerar de fält som finns i modal för lagerinställningar layer.layer
   * @param {*} layer
   */
  setLayerSettings(layer) {
    // Hämta från capabilities det layer.layer som matchar namnet
    var currentLayer = this.state.capabilities.Capability.Layer.Layer.find(
      l => {
        return l.Name === layer.name;
      }
    );

    // Sätt det state som behövs för att modalen skall populeras och knapparna skall fungera
    this.setState({
      layerSettings: {
        settings: true,
        visible: true,
        styles: currentLayer.Style || [],
        style: layer.style,
        name: layer.name,
        queryable: layer.queryable,
        // confirmAction anropas från LayerAlert- komponenten och result är alertens state
        confirmAction: result => {
          this.saveLayerSettings(result, layer.name);
          this.setState({
            layerSettings: {
              settings: false,
              visible: false
            }
          });
        },
        denyAction: () => {
          this.setState({
            layerSettings: {
              settings: false,
              visible: false
            }
          });
        }
      }
    });
  }

  /**
   * Sparar värden från <Alert>-komponenten till state
   *
   */
  saveLayerSettings(layerSettings, layerName) {
    // Hämta lagret från state.addedLayers och uppdatera lager i layers-arrayen
    this.state.addedLayers.forEach(layer => {
      if (layer.name === layerName) {
        layer.style = layerSettings.style;
        layer.queryable = layerSettings.queryable;
      }
    });
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
      <fieldset className="article-wrapper">
        <Alert
          options={this.state.layerSettings}
          imageLoad={this.state.imageLoader}
        />
        <legend>Lägg till lager</legend>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Url*</label>
              <input
                type="text"
                ref="input_url"
                value={this.state.url}
                onChange={e => {
                  this.setState({ url: e.target.value }, () =>
                    this.validateField("url")
                  );
                }}
                className={
                  this.getValidationClass("url") + "form-control display-inline"
                }
              />
              <span
                onClick={e => {
                  this.loadWMSCapabilities(e);
                }}
                className="btn btn-default btn-sm"
              >
                Ladda {loader}
              </span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Bildformat</label>
              <select
                ref="input_imageFormat"
                value={this.state.imageFormat}
                onChange={e => this.setState({ imageFormat: e.target.value })}
                className="form-control"
              >
                {this.setImageFormats()}
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label>Version</label>
              <p ref="input_version" className="text-display">
                {this.state.version}
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Koordinatsystem</label>
              <select
                ref="input_projection"
                value={this.state.projection}
                onChange={e => this.setState({ projection: e.target.value })}
                className="form-control"
              >
                {this.setProjections()}
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
        </div>
        <div className="row">{this.renderLayerList()}</div>
        <div className="row">
          <div className="col-md-12">
            <label className="label-block">Valda lager*</label>
            <div
              ref="input_layers"
              className={
                this.getValidationClass("layers") +
                " layer-list-choosen-test form-control"
              }
            >
              <ul>{this.renderSelectedLayers()}</ul>
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
              onChange={e => {
                this.setState({ caption: e.target.value }, () =>
                  this.validateField("caption")
                );
              }}
              className={this.getValidationClass("caption") + " form-control"}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <label>Innehåll</label>
            <input
              type="text"
              ref="input_content"
              value={this.state.content}
              onChange={e => {
                this.setState({ content: e.target.value });
              }}
              className="form-control"
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="form-group">
              <label>Inforuta</label>
              <textarea
                ref="input_infobox"
                value={this.state.infobox}
                onChange={e => this.setState({ infobox: e.target.value })}
                className="form-control"
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Senast Ändrad</label>
              <span ref="input_date" className="text-display">
                <i>{this.props.model.parseDate(this.state.date)}</i>
              </span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label>Upphovsrätt</label>
              <input
                type="text"
                ref="input_attribution"
                onChange={e => {
                  const v = e.target.value;
                  this.setState({ attribution: v }, () =>
                    this.validateField("attribution", v)
                  );
                }}
                value={this.state.attribution}
                className={
                  "form-control " + this.getValidationClass("attribution")
                }
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Teckenförklaring</label>
              <input
                type="text"
                ref="input_legend"
                className="form-control"
                value={this.state.legend}
                onChange={e => this.setState({ legend: e.target.value })}
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
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label>Infoklick-format</label>
              <select
                ref="input_infoFormat"
                value={this.state.infoFormat}
                onChange={e => this.setState({ infoFormat: e.target.value })}
                className="form-control"
              >
                {this.setInfoFormats()}
              </select>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label htmlFor="single-tile">Single tile</label>
              <input
                type="checkbox"
                ref="input_singleTile"
                id="single-tile"
                onChange={e => {
                  this.setState({ singleTile: e.target.checked });
                }}
                checked={this.state.singleTile}
              />
            </div>
          </div>
          <div style={{ display: "none" }}>
            <label>Geowebcache</label>
            <input
              type="checkbox"
              ref="input_tiled"
              onChange={e => {
                this.setState({ tiled: e.target.checked });
              }}
              checked={this.state.tiled}
            />
          </div>
        </div>
        <div className="info-container" style={{ margin: "unset" }}>
          <div>
            <label htmlFor="info-document">Infodokument</label>
            <input
              type="checkbox"
              ref="input_infoVisible"
              id="info-document"
              onChange={e => {
                this.setState({ infoVisible: e.target.checked });
              }}
              checked={this.state.infoVisible}
            />
          </div>
          <div className={infoClass}>
            <label htmlFor="info-title">Rubrik</label>
            <input
              type="text"
              ref="input_infoTitle"
              id="info-title"
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
              value={
                this.state.infoOwner ? this.state.infoOwner : this.state.owner
              }
              className={this.getValidationClass("infoOwner")}
            />
          </div>
        </div>
      </fieldset>
    );
  }
}

export default ExtendedWMSLayerForm;
