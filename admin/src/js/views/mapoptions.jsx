import React from 'react';
import { Component } from "react";
import { SketchPicker } from 'react-color';

var defaultState = {
  primaryColor: "#00F",
  secondaryColor: "#FF0"
};

class MapOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
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
  }

  /**
   *
   */
  save() {
    var config = this.props.model.get('mapConfig');
    this.props.model.updateMapConfig(config, () => {
      console.log("Map config saved");
    });
  }

  /**
   *
   */
  handlePrimaryColorComplete(color) {
    if (!this.props.model.get('mapConfig').colors) {
      this.props.model.get('mapConfig').colors = {};
    }
    this.props.model.get('mapConfig').colors.primaryColor = color.hex;
  }

  /**
   *
   */
  handleSecondaryColorComplete(color) {
    if (!this.props.model.get('mapConfig').colors) {
      this.props.model.get('mapConfig').colors = {};
    }
    this.props.model.get('mapConfig').colors.secondaryColor = color.hex;
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
