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
import { SketchPicker } from "react-color";

var defaultState = {
  primaryColor: "#00F",
  secondaryColor: "#FF0",
  validationErrors: []
};

class MapOptions extends Component {
  constructor() {
    super();
    this.state = defaultState;
  }

  componentDidMount() {
    this.props.model.on("change:mapConfig", e => {
      var config = this.props.model.get("mapConfig");
      this.setState({
        primaryColor: config.colors.primaryColor,
        secondaryColor: config.colors.secondaryColor,
        projection: config.projection,
        zoom: config.zoom,
        maxZoom: config.maxZoom,
        minZoom: config.minZoom,
        center: config.center,
        logo: config.logo,
        extent: config.extent,
        constrainOnlyCenter: config.constrainOnlyCenter,
        mapselector: config.mapselector,
        mapcleaner: config.mapcleaner,
        drawerVisible: config.drawerVisible,
        drawerPermanent: config.drawerPermanent,
        title: config.title ? config.title : "",
        geoserverLegendOptions: config.geoserverLegendOptions
          ? config.geoserverLegendOptions
          : ""
      });
      this.validate();
    });
  }

  componentWillUnmount() {
    this.props.model.off("change:mapConfig");
  }

  componentWillMount() {
    var mapConfig = this.props.model.get("mapConfig");
    this.setState({
      primaryColor:
        mapConfig.colors && mapConfig.colors.primaryColor
          ? mapConfig.colors.primaryColor
          : "#000",
      secondaryColor:
        mapConfig.colors && mapConfig.colors.secondaryColor
          ? mapConfig.colors.secondaryColor
          : "#000",
      title: mapConfig.title,
      projection: mapConfig.projection,
      zoom: mapConfig.zoom,
      maxZoom: mapConfig.maxZoom,
      minZoom: mapConfig.minZoom,
      center: mapConfig.center,
      logo: mapConfig.logo,
      extent: mapConfig.extent,
      constrainOnlyCenter: mapConfig.constrainOnlyCenter,
      mapselector: mapConfig.mapselector,
      mapcleaner: mapConfig.mapcleaner,
      drawerVisible: mapConfig.drawerVisible,
      drawerPermanent: mapConfig.drawerPermanent,
      geoserverLegendOptions: mapConfig.geoserverLegendOptions
    });
  }

  getValue(fieldName) {
    var input = this.refs["input_" + fieldName],
      value = input ? input.value : "";

    if (input.type === "checkbox") {
      value = input.checked;
    }

    if (fieldName === "center") value = value.split(",");
    if (fieldName === "extent") value = value.split(",");
    if (fieldName === "title") {
      if (value === "") {
        value = this.props.model.get("mapFile");
      }
    }

    return value;
  }

  validate(callback) {
    var validationFields = [
        "title",
        "projection",
        "zoom",
        "maxZoom",
        "minZoom",
        "center"
      ],
      validationErrors = [];

    validationFields.forEach(field => {
      var valid = this.validateField(field, false);
      if (!valid) {
        validationErrors.push(field);
      }
    });

    this.setState(
      {
        validationErrors: validationErrors
      },
      () => {
        if (callback) {
          callback(validationErrors.length === 0);
        }
      }
    );
  }

  validateField(fieldName, updateState) {
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

    function coord(v) {
      return v.length === 2 && v.every(number);
    }

    function extent(v) {
      return v.length === 4 && v.every(number);
    }

    switch (fieldName) {
      case "title":
        if (empty(value)) {
          valid = false;
        }
        break;
      case "extent":
        if (!extent(value)) {
          valid = false;
        }
        break;
      case "center":
        if (!coord(value) || empty(value)) {
          valid = false;
        }
        break;
      case "zoom":
      case "minZoom":
      case "maxZoom":
        if (!number(value) || empty(value)) {
          valid = false;
        }
        break;
      case "projection":
        if (empty(value)) {
          valid = false;
        }
        break;
      case "constrainOnlyCenter":
      case "mapselector":
      case "mapcleaner":
      case "drawerVisible":
      case "drawerPermanent":
        if (value !== true && value !== false) {
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

  save() {
    var config = this.props.model.get("mapConfig");
    this.validate(valid => {
      if (valid) {
        config.title = this.getValue("title");
        config.projection = this.getValue("projection");
        config.zoom = this.getValue("zoom");
        config.maxZoom = this.getValue("maxZoom");
        config.minZoom = this.getValue("minZoom");
        config.center = this.getValue("center");
        config.logo = this.getValue("logo");
        config.extent = this.getValue("extent");
        config.constrainOnlyCenter = this.getValue("constrainOnlyCenter");
        config.mapselector = this.getValue("mapselector");
        config.mapcleaner = this.getValue("mapcleaner");
        config.drawerVisible = this.getValue("drawerVisible");
        config.drawerPermanent = this.getValue("drawerPermanent");
        config.geoserverLegendOptions = this.getValue("geoserverLegendOptions");
        this.props.model.updateMapConfig(config, success => {
          var msg = success
            ? "Uppdateringen lyckades."
            : "Uppdateringen misslyckades.";
          this.props.parent.setState({
            alert: true,
            alertMessage: msg
          });
        });
      }
    });
  }

  handlePrimaryColorComplete(color) {
    if (!this.props.model.get("mapConfig").colors) {
      this.props.model.get("mapConfig").colors = {};
    }
    this.props.model.get("mapConfig").colors.primaryColor = color.hex;
    this.setState({
      primaryColor: color.hex
    });
  }

  handleSecondaryColorComplete(color) {
    if (!this.props.model.get("mapConfig").colors) {
      this.props.model.get("mapConfig").colors = {};
    }
    this.props.model.get("mapConfig").colors.secondaryColor = color.hex;
    this.setState({
      secondaryColor: color.hex
    });
  }

  getValidationClass(inputName) {
    return this.state.validationErrors.find(v => v === inputName)
      ? "validation-error"
      : "";
  }

  render() {
    return (
      <div>
        <aside>Hantera inställningar för kartan.</aside>
        <article>
          <fieldset className="tree-view">
            <legend>Kartinställningar</legend>
            <button className="btn btn-primary" onClick={e => this.save(e)}>
              Spara
            </button>
            <br />
            <div>
              <label>
                Titel{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om inget anges blir titel kartans filnamn"
                />
              </label>
              <input
                type="text"
                ref="input_title"
                value={this.state.title}
                className={this.getValidationClass("title")}
                onChange={e => {
                  this.setState({ title: e.target.value }, () =>
                    this.validateField("title")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Projektion{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'projection'-parameter, ex 'EPSG:3008'"
                />
              </label>
              <input
                type="text"
                ref="input_projection"
                value={this.state.projection}
                className={this.getValidationClass("projection")}
                onChange={e => {
                  this.setState({ projection: e.target.value }, () =>
                    this.validateField("projection")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Startzoom{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'zoom'-parameter, ex '2'"
                />
              </label>
              <input
                type="text"
                ref="input_zoom"
                value={this.state.zoom}
                className={this.getValidationClass("zoom")}
                onChange={e => {
                  this.setState({ zoom: e.target.value }, () =>
                    this.validateField("zoom")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Max-zoomnivå{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'maxZoom'-parameter, ex '20'"
                />
              </label>
              <input
                type="text"
                ref="input_maxZoom"
                value={this.state.maxZoom}
                className={this.getValidationClass("maxZoom")}
                onChange={e => {
                  this.setState({ maxZoom: e.target.value }, () =>
                    this.validateField("maxZoom")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Min-zoomnivå{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'minZoom'-parameter, ex '0'"
                />
              </label>
              <input
                type="text"
                ref="input_minZoom"
                value={this.state.minZoom}
                className={this.getValidationClass("minZoom")}
                onChange={e => {
                  this.setState({ minZoom: e.target.value }, () =>
                    this.validateField("minZoom")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Centrumkoordinat{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'center'-parameter, ex '110600,6283796'"
                />
              </label>
              <input
                type="text"
                ref="input_center"
                value={this.state.center}
                className={this.getValidationClass("center")}
                onChange={e => {
                  this.setState({ center: e.target.value }, () =>
                    this.validateField("center")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Logo{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Sökväg till logga att använda i <img>-taggen. Kan vara relativ Hajk-root eller absolut."
                />
              </label>
              <input
                type="text"
                ref="input_logo"
                value={this.state.logo}
                className={this.getValidationClass("logo")}
                onChange={e => {
                  this.setState({ logo: e.target.value }, () =>
                    this.validateField("logo")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Extent{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'extent'-parameter, ex '1,2,3,4'"
                />
              </label>
              <input
                type="text"
                ref="input_extent"
                value={this.state.extent}
                className={this.getValidationClass("extent")}
                onChange={e => {
                  this.setState({ extent: e.target.value }, () =>
                    this.validateField("extent")
                  );
                }}
              />
            </div>
            <div>
              <label htmlFor="input_constrainOnlyCenter">
                Lätta på extent{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Styr ol.Views 'constrainOnlyCenter'-parameter. Om sant kommer endast centrumkoordinaten att begränsas till extent."
                />
              </label>
              <input
                id="input_constrainOnlyCenter"
                type="checkbox"
                ref="input_constrainOnlyCenter"
                onChange={e => {
                  this.setState({ constrainOnlyCenter: e.target.checked });
                }}
                checked={this.state.constrainOnlyCenter}
              />
              &nbsp;
            </div>
            <div>
              <label>
                Legend options{" "}
                <a
                  href="http://docs.geoserver.org/stable/en/user/services/wms/get_legend_graphic/index.html#controlling-legend-appearance-with-legend-options"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="Klicka för mer info om formatering"
                  />
                </a>
              </label>
              <input
                type="text"
                ref="input_geoserverLegendOptions"
                value={this.state.geoserverLegendOptions}
                className={this.getValidationClass("geoserverLegendOptions")}
                onChange={e => {
                  this.setState({ geoserverLegendOptions: e.target.value });
                }}
              />
            </div>
            <div>
              <label htmlFor="input_mapselector">
                Visa kartväljare{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer en väljare med andra tillgängliga kartor att visas för användaren"
                />
              </label>
              <input
                id="input_mapselector"
                type="checkbox"
                ref="input_mapselector"
                onChange={e => {
                  this.setState({ mapselector: e.target.checked });
                }}
                checked={this.state.mapselector}
              />
              &nbsp;
            </div>
            <div>
              <label htmlFor="input_mapcleaner">
                Visa knapp för att rensa kartan{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer en väljare med andra tillgängliga kartor att visas för användaren"
                />
              </label>
              <input
                id="input_mapcleaner"
                type="checkbox"
                ref="input_mapcleaner"
                onChange={e => {
                  this.setState({ mapcleaner: e.target.checked });
                }}
                checked={this.state.mapcleaner}
              />
              &nbsp;
            </div>
            <div>
              <label htmlFor="input_drawerVisible">
                Starta med sidopanelen synlig{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer sidopanelen att vara synlig när kartan laddat"
                />
              </label>
              <input
                id="input_drawerVisible"
                type="checkbox"
                ref="input_drawerVisible"
                onChange={e => {
                  this.setState({ drawerVisible: e.target.checked });
                  // If visible gets unchecked, ensure that permanent is unchecked too
                  if (e.target.checked === false) {
                    this.setState({
                      drawerPermanent: false
                    });
                  }
                }}
                checked={this.state.drawerVisible}
              />
              &nbsp;
            </div>
            <div>
              <label htmlFor="input_drawerPermanent">
                Låt sidopanelen vara låst vid start{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer sidopanelen att vara låst vid skärmens kant vid start (gäller ej mobila enheter)"
                />
              </label>
              <input
                id="input_drawerPermanent"
                type="checkbox"
                ref="input_drawerPermanent"
                onChange={e => {
                  this.setState({ drawerPermanent: e.target.checked });
                }}
                checked={this.state.drawerPermanent}
                disabled={this.state.drawerVisible !== true}
              />
              &nbsp;
            </div>
            <div className="clearfix">
              <span className="pull-left">
                <div>Huvudfärg</div>
                <SketchPicker
                  color={this.state.primaryColor}
                  onChangeComplete={e => this.handlePrimaryColorComplete(e)}
                />
              </span>
              <span className="pull-left" style={{ marginLeft: "10px" }}>
                <div>Komplementfärg</div>
                <SketchPicker
                  color={this.state.secondaryColor}
                  onChangeComplete={e => this.handleSecondaryColorComplete(e)}
                />
              </span>
            </div>
            <br />
            <button className="btn btn-primary" onClick={e => this.save(e)}>
              Spara
            </button>
            &nbsp;
          </fieldset>
        </article>
      </div>
    );
  }
}

export default MapOptions;
