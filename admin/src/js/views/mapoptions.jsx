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

  componentDidMount() {
  }

  save() {
    console.log("Save");
  }

  handlePrimaryColorComplete(color) {
    this.setState({
      primaryColor: color
    });
  }

  handleSecondaryColorComplete(color) {
    this.setState({
      secondaryColor: color
    });
  }

  render() {
    return (
      <div>
        <aside>
          Hantera inställningar för kartan.
        </aside>
        <article>
          <fieldset className="tree-view">
            <legend>Kartinställningar</legend>
            <button className="btn btn-primary" onClick={(e) => this.save(e)}>Spara</button>&nbsp;
            <div>
              <div>Huvudfärg</div>
              <div className="color-box"></div>
              <SketchPicker
                color={this.state.primaryColor}
                onChangeComplete={ (e) => this.handlePrimaryColorComplete(e) }
              />
            <div>Komplementfärg</div>
              <div className="color-box"></div>
              <SketchPicker
                color={this.state.secondaryColor}
                onChangeComplete={ (e) => this.handleSecondaryColorComplete(e) }
              />
            </div>
          </fieldset>
        </article>
      </div>
    )
  }

}

export default MapOptions;
