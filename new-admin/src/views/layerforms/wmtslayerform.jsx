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
  queryable: true,
  drawOrder: 1,
  layer: "topowebb",
  matrixSet: "3006",
  style: "default",
  projection: "EPSG:3006",
  origin: [-1200000, 8500000],
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
    "13"
  ],
  layerType: "WMTS",
  attribution: "",
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
class WMTSLayerForm extends Component {
  componentDidMount() {
    defaultState.url = this.props.url;
    this.setState(defaultState);
    this.props.model.on("change:legend", () => {
      this.setState({
        legend: this.props.model.get("legend")
      });
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

  loadLegendImage(e) {
    $("#select-image").trigger("click");
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
      layer: this.getValue("layer"),
      matrixSet: this.getValue("matrixSet"),
      style: this.getValue("style"),
      projection: this.getValue("projection"),
      origin: this.getValue("origin"),
      resolutions: this.getValue("resolutions"),
      matrixIds: this.getValue("matrixIds"),
      attribution: this.getValue("attribution"),
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

    function format_layers(layers) {
      return layers.map(layer => layer);
    }

    var input = this.refs["input_" + fieldName],
      value = input ? input.value : "";

    if (fieldName === "date") value = create_date();
    if (fieldName === "layers") value = format_layers(this.state.addedLayers);
    if (fieldName === "singleTile") value = input.checked;
    if (fieldName === "imageFormat") value = input.value;
    if (fieldName === "queryable") value = input.checked;
    if (fieldName === "tiled") value = input.checked;
    if (fieldName === "searchFields") value = value.split(",");
    if (fieldName === "displayFields") value = value.split(",");
    if (fieldName === "origin") value = value.split(",");
    if (fieldName === "resolutions") value = value.split(",");
    if (fieldName === "matrixIds") value = value.split(",");
    if (fieldName === "infoVisible") value = input.checked;

    return value;
  }

  validate() {
    var validationFields = [
      "url",
      "caption",
      "layer",
      "matrixSet",
      "style",
      "projection",
      "origin",
      "resolutions",
      "matrixIds"
    ];
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
        if (value === "") {
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

  render() {
    var imageLoader = this.state.imageLoad ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    var infoClass = this.state.infoVisible ? "tooltip-info" : "hidden";

    return (
      <fieldset>
        <legend>WMTS-lager</legend>
        <div className="separator">Val av lager</div>
        <div>
          <label>Url*</label>
          <input
            type="text"
            ref="input_url"
            value={this.state.url}
            className={this.getValidationClass("url")}
            onChange={e => {
              this.setState({ url: e.target.value }, () =>
                this.validateField("url")
              );
            }}
          />
        </div>
        <div>
          <label>Lager*</label>
          <input
            type="text"
            ref="input_layer"
            onChange={e => {
              const v = e.target.value;
              this.setState({ layer: v }, () => this.validateField("layer", v));
            }}
            value={this.state.layer}
            className={this.getValidationClass("layer")}
          />
        </div>
        <div>
          <label>Visningsnamn*</label>
          <input
            type="text"
            ref="input_caption"
            value={this.state.caption}
            className={this.getValidationClass("caption")}
            onChange={e => {
              this.setState({ caption: e.target.value }, () =>
                this.validateField("caption")
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
            onChange={e => this.setState({ legend: e.target.value })}
          />
          <span
            onClick={e => {
              this.props.parent.loadLegendImage(e);
            }}
            className="btn btn-default"
          >
            Välj fil {imageLoader}
          </span>
        </div>
        <div className="separator">Inställningar för request</div>
        <div>
          <label>Matrisuppsättning*</label>
          <input
            type="text"
            ref="input_matrixSet"
            onChange={e => {
              const v = e.target.value;
              this.setState({ matrixSet: v }, () =>
                this.validateField("matrixSet", v)
              );
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
            onChange={e => {
              const v = e.target.value;
              this.setState({ style: v }, () => this.validateField("style", v));
            }}
            value={this.state.style}
            className={this.getValidationClass("style")}
          />
        </div>
        <div>
          <label>Projektion*</label>
          <input
            type="text"
            ref="input_projection"
            onChange={e => {
              const v = e.target.value;
              this.setState({ projection: v }, () =>
                this.validateField("projection", v)
              );
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
            onChange={e => {
              const v = e.target.value;
              this.setState({ origin: v }, () =>
                this.validateField("origin", v)
              );
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
            onChange={e => {
              const v = e.target.value;
              this.setState({ resolutions: v }, () =>
                this.validateField("resolutions", v)
              );
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
            onChange={e => {
              const v = e.target.value;
              this.setState({ matrixIds: v }, () =>
                this.validateField("matrixIds", v)
              );
            }}
            value={this.state.matrixIds}
            className={this.getValidationClass("matrixIds")}
          />
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
        <div>
          <label>Upphovsrätt</label>
          <input
            type="text"
            ref="input_attribution"
            onChange={e => {
              const v = e.target.value;
              this.setState({ attribution: e.target.value }, () =>
                this.validateField("attribution", v)
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

export default WMTSLayerForm;
