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

var defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  target: "toolbar",
  markerImg: "assets/icons/marker.png",
  displayPopup: false,
  imgSizeX: 32,
  imgSizeY: 32,
  anchorX: 16,
  anchorY: 32,
  popupOffsetY: 0,
  visibleForGroups: []
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
        target: tool.options.target,
        position: tool.options.position,
        width: tool.options.width,
        height: tool.options.height,
        markerImg: tool.options.markerImg,
        displayPopup: tool.options.displayPopup,
        imgSizeX: tool.options.imgSize[0] || this.state.imgSizeX,
        imgSizeY: tool.options.imgSize[1] || this.state.imgSizeX,
        anchorX: tool.options.anchor[0] || this.state.anchorX,
        anchorY: tool.options.anchor[1] || this.state.anchorY,
        popupOffsetY: tool.options.popupOffsetY,
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
        target: this.state.target,
        position: this.state.position,
        width: this.state.width,
        height: this.state.height,
        displayPopup: this.state.displayPopup,
        markerImg: this.state.markerImg,
        anchor: [this.state.anchorX, this.state.anchorY],
        imgSize: [this.state.imgSizeX, this.state.imgSizeY],
        popupOffsetY: this.state.popupOffsetY,
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
   *
   */
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
            <label htmlFor="index">Sorteringsordning</label>
            <input
              id="index"
              name="index"
              type="text"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.index}
            />
          </div>
          <div>
            <label htmlFor="target">Verktygsplacering</label>
            <input
              id="target"
              name="target"
              type="text"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.target}
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
            <label htmlFor="markerImg">Bild för markering</label>
            <input
              value={this.state.markerImg}
              type="text"
              name="markerImg"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="anchorX">Ikonförskjutning X</label>
            <input
              value={this.state.anchorX}
              type="text"
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
              type="text"
              name="anchorY"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="imgSizeX">Bildbredd</label>
            <input
              value={this.state.imgSizeX}
              type="text"
              name="imgSizeX"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="imgSizeY">Bildhöjd</label>
            <input
              value={this.state.imgSizeY}
              type="text"
              name="imgSizeY"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="popupOffsetY">Förskjutning popup-ruta</label>
            <input
              value={this.state.popupOffsetY}
              type="text"
              name="popupOffsetY"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <input
              id="displayPopup"
              name="displayPopup"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.displayPopup}
            />
            &nbsp;
            <label htmlFor="displayPopup">Visa som popup</label>
          </div>
        </form>
      </div>
    );
  }
}

export default ToolOptions;
