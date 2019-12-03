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

import React, { Component } from "react";
import { SketchPicker } from "react-color";

var defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  visibleForGroups: [],
  title: "Infoclick",
  position: "right",
  width: 400,
  height: 300,

  src: "marker.png",
  scale: 0.15,
  strokeColor: { r: 200, b: 0, g: 0, a: 0.7 },
  strokeWidth: 4,
  fillColor: { r: 255, b: 0, g: 0, a: 0.1 },
  anchorX: 0.5,
  anchorY: 1
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "infoclick";
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        title: tool.options.title,
        position: tool.options.position,
        width: tool.options.width,
        height: tool.options.height,
        src: tool.options.src,
        scale: tool.options.scale || this.state.scale,
        strokeColor: tool.options.strokeColor || this.state.strokeColor,
        strokeWidth: tool.options.strokeWidth || this.state.strokeWidth,
        fillColor: tool.options.fillColor || this.state.fillColor,
        anchorX: tool.options.anchor[0] || this.state.anchorX,
        anchorY: tool.options.anchor[1] || this.state.anchorY,
        visibleForGroups: tool.options.visibleForGroups
          ? tool.options.visibleForGroups
          : []
      });
    } else {
      this.setState({
        active: false
      });
    }
  }

  componentWillUnmount() {}
  /**
   *
   */
  componentWillMount() {}

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    var value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }
    this.setState({
      [name]: value
    });
  }

  getTool() {
    return this.props.model
      .get("toolConfig")
      .find(tool => tool.type === this.type);
  }

  add(tool) {
    this.props.model.get("toolConfig").push(tool);
  }

  remove(tool) {
    this.props.model.set({
      toolConfig: this.props.model
        .get("toolConfig")
        .filter(tool => tool.type !== this.type)
    });
  }

  replace(tool) {
    this.props.model.get("toolConfig").forEach(t => {
      if (t.type === this.type) {
        t.options = tool.options;
        t.index = tool.index;
      }
    });
  }

  save() {
    var tool = {
      type: this.type,
      index: this.state.index,
      options: {
        title: this.state.title,
        position: this.state.position,
        width: this.state.width,
        height: this.state.height,
        anchor: [this.state.anchorX, this.state.anchorY],
        scale: this.state.scale,
        src: this.state.src,
        strokeColor: this.state.strokeColor,
        strokeWidth: this.state.strokeWidth,
        fillColor: this.state.fillColor,
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        )
      }
    };

    var existing = this.getTool();

    function update() {
      this.props.model.updateToolConfig(
        this.props.model.get("toolConfig"),
        () => {
          this.props.parent.props.parent.setState({
            alert: true,
            alertMessage: "Uppdateringen lyckades"
          });
        }
      );
    }

    if (!this.state.active) {
      if (existing) {
        this.props.parent.props.parent.setState({
          alert: true,
          confirm: true,
          alertMessage:
            "Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?",
          confirmAction: () => {
            this.remove();
            update.call(this);
            this.setState(defaultState);
          }
        });
      } else {
        this.remove();
        update.call(this);
      }
    } else {
      if (existing) {
        this.replace(tool);
      } else {
        this.add(tool);
      }
      update.call(this);
    }
  }

  handleAuthGrpsChange(event) {
    const target = event.target;
    const value = target.value;
    let groups = [];

    try {
      groups = value.split(",");
    } catch (error) {
      console.log(`Någonting gick fel: ${error}`);
    }

    this.setState({
      visibleForGroups: value !== "" ? groups : []
    });
  }

  renderVisibleForGroups() {
    if (this.props.parent.props.parent.state.authActive) {
      return (
        <div>
          <label htmlFor="visibleForGroups">Tillträde</label>
          <input
            id="visibleForGroups"
            value={this.state.visibleForGroups}
            type="text"
            name="visibleForGroups"
            onChange={e => {
              this.handleAuthGrpsChange(e);
            }}
          />
        </div>
      );
    } else {
      return null;
    }
  }

  /**
   * Infoclick's stroke and fill color are set by the React
   * color picker. This method handles change event for those
   * two color pickers.
   *
   * @param {*} target
   * @param {*} color
   */
  handleColorChange = (target, color) => {
    this.setState({ [target]: color.rgb });
  };

  render() {
    return (
      <div>
        <form>
          <p>
            <button
              className="btn btn-primary"
              onClick={e => {
                e.preventDefault();
                this.save();
              }}
            >
              Spara
            </button>
          </p>
          <div>
            <input
              id="active"
              name="active"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.active}
            />
            &nbsp;
            <label htmlFor="active">Aktiverad</label>
          </div>
          <div>
            <label htmlFor="title">
              Titel{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Rubrik som visas i infoclick-fönstret"
              />
            </label>
            <input
              id="title"
              name="title"
              type="text"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.title}
            />
          </div>
          <div>
            <label htmlFor="position">
              Fönsterplacering{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Placering av verktygets fönster. Anges som antingen 'left' eller 'right'."
              />
            </label>
            <input
              id="position"
              name="position"
              type="text"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.position}
            />
          </div>
          <div>
            <label htmlFor="width">
              Fönsterbredd{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Bredd i pixlar på verktygets fönster. Anges som ett numeriskt värde. Lämna tomt för att använda standardbredd."
              />
            </label>
            <input
              id="width"
              name="width"
              type="text"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.width}
            />
          </div>
          <div>
            <label htmlFor="height">
              Fönsterhöjd{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Höjd i pixlar på verktygets fönster. Anges som ett numeriskt värde. Lämna tomt för att använda maximal höjd."
              />
            </label>
            <input
              id="height"
              name="height"
              type="text"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.height}
            />
          </div>
          {this.renderVisibleForGroups()}
          <div>
            <label htmlFor="src">URL till bild</label>
            <input
              value={this.state.src}
              type="text"
              name="src"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="anchorX">Ikonförskjutning X</label>
            <input
              value={this.state.anchorX}
              type="number"
              min="0"
              max="100"
              step="0.1"
              name="anchorX"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="anchorY">Ikonförskjutning Y</label>
            <input
              value={this.state.anchorY}
              type="number"
              min="0"
              max="100"
              step="0.1"
              name="anchorY"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="scale">Skala för icon</label>
            <input
              value={this.state.scale}
              type="number"
              step="0.01"
              min="0.01"
              max="10"
              name="scale"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="strokeColor">Färg på markerings ram (rgba)</label>
            <SketchPicker
              color={{
                r: this.state.strokeColor.r,
                b: this.state.strokeColor.b,
                g: this.state.strokeColor.g,
                a: this.state.strokeColor.a
              }}
              onChangeComplete={color =>
                this.handleColorChange("strokeColor", color)
              }
            />
          </div>
          <div>
            <label htmlFor="strokeWidth">Bredd på markeringens ram (px)</label>
            <input
              value={this.state.strokeWidth}
              type="number"
              min="0"
              max="100"
              step="1"
              name="strokeWidth"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="fillColor">
              Färg på markeringens fyllnad (rgba)
            </label>
            <SketchPicker
              color={{
                r: this.state.fillColor.r,
                b: this.state.fillColor.b,
                g: this.state.fillColor.g,
                a: this.state.fillColor.a
              }}
              onChangeComplete={color =>
                this.handleColorChange("fillColor", color)
              }
            />
          </div>
        </form>
      </div>
    );
  }
}

export default ToolOptions;
