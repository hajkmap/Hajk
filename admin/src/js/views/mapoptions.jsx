import React from 'react';
import { Component } from "react";
import { SketchPicker } from 'react-color';

var defaultState = {
  primaryColor: "#00F",
  secondaryColor: "#FF0",
  validationErrors: []
};

class MapOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
  }

  componentDidMount() {
    this.props.model.on('change:mapConfig', (e) => {
      var config = this.props.model.get('mapConfig');
      this.setState({
        primaryColor: config.colors.primaryColor,
        secondaryColor: config.colors.secondaryColor,
        projection: config.projection,
        zoom: config.zoom,
        center: config.center,
        logo: config.logo
      });
    });
    this.validate();
  }

  componentWillUnmount() {
    this.props.model.off('change:mapConfig');
  }
  /**
   *
   */
  componentWillMount() {
    var mapConfig = this.props.model.get('mapConfig');

    this.state.primaryColor = mapConfig.colors && mapConfig.colors.primaryColor
    ? mapConfig.colors.primaryColor
    : "#000";

    this.state.secondaryColor = mapConfig.colors && mapConfig.colors.secondaryColor
    ? mapConfig.colors.secondaryColor
    : "#000";

    this.state.projection = mapConfig.projection;
    this.state.zoom = mapConfig.zoom;
    this.state.center = mapConfig.center;
    this.state.logo = mapConfig.logo;
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

    if (fieldName === 'center') value = value.split(',');

    return value;
  }

  validate() {
    var valid = true
    ,   validationFields = ["projection", "zoom", "center"];

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

    function coord(v) {
      return v.length === 2 && v.every(number);
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
      case "center":
        if (!coord(value) || empty(value)) {
          valid = false;
        }
        break;
      case "zoom":
        if (!number(value) || empty(value)) {
          valid = false;
        }
        break;
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

  /**
   *
   */
  save() {
    var config = this.props.model.get('mapConfig');
    if (this.validate()) {
      config.projection = this.getValue('projection');
      config.zoom = this.getValue('zoom');
      config.center = this.getValue('center');
      config.logo = this.getValue('logo');
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
  }

  /**
   *
   */
  handlePrimaryColorComplete(color) {
    if (!this.props.model.get('mapConfig').colors) {
      this.props.model.get('mapConfig').colors = {};
    }
    this.props.model.get('mapConfig').colors.primaryColor = this.state.primaryColor = color.hex;
  }

  /**
   *
   */
  handleSecondaryColorComplete(color) {
    if (!this.props.model.get('mapConfig').colors) {
      this.props.model.get('mapConfig').colors = {};
    }
    this.props.model.get('mapConfig').colors.secondaryColor = this.state.secondaryColor = color.hex;
  }

  getValidationClass(inputName) {
    return this.state.validationErrors.find(v => v === inputName) ? "validation-error" : "";
  }

  /**
   *
   */
  render() {
    return (
      <div>
        <aside>
          Hantera inställningar för kartan.
        </aside>
        <article>
          <fieldset className="tree-view">
            <legend>Kartinställningar</legend>
            <button className="btn btn-primary" onClick={(e) => this.save(e)}>Spara</button>
            <br />
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
              <label>Startzoom*</label>
              <input
                type="text"
                ref="input_zoom"
                value={this.state.zoom}
                className={this.getValidationClass("zoom")}
                onChange={(e) => {
                  this.setState({zoom: e.target.value});
                  this.validateField("zoom");
                }}
              />
            </div>
            <div>
              <label>Centrumkoordinat*</label>
              <input
                type="text"
                ref="input_center"
                value={this.state.center}
                className={this.getValidationClass("center")}
                onChange={(e) => {
                  this.setState({center: e.target.value});
                  this.validateField("center");
                }}
              />
            </div>
            <div>
              <label>Logo*</label>
              <input
                type="text"
                ref="input_logo"
                value={this.state.logo}
                className={this.getValidationClass("logo")}
                onChange={(e) => {
                  this.setState({logo: e.target.value});
                  this.validateField("logo");
                }}
              />
            </div>
            <div className="col-md-12">
              <span className="pull-left">
                <div>Huvudfärg</div>
                <SketchPicker
                  color={this.state.primaryColor}
                  onChangeComplete={ (e) => this.handlePrimaryColorComplete(e) }
                />
              </span>
              <span className="pull-left" style={{marginLeft: "10px"}}>
                <div>Komplementfärg</div>
                <SketchPicker
                  color={this.state.secondaryColor}
                  onChangeComplete={ (e) => this.handleSecondaryColorComplete(e) }
                />
              </span>
            </div>
            <br />
            <button className="btn btn-primary" onClick={(e) => this.save(e)}>Spara</button>&nbsp;
          </fieldset>
        </article>
      </div>
    )
  }

}

export default MapOptions;
