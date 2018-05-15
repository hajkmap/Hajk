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
  visibleAtStart: false,
  text: "",
  headerText: "",
  showInfoOnce: false,
  base64EncodeForInfotext: false,
  visibleForGroups: []
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "information";
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        visibleAtStart: tool.options.visibleAtStart || false,
        text: tool.options.text || "",
        headerText: tool.options.headerText || "",
        showInfoOnce: tool.options.showInfoOnce,
        base64EncodeForInfotext: tool.options.base64EncodeForInfotext,
        visibleForGroups: tool.options.visibleForGroups ? tool.options.visibleForGroups : []
      });
    } else {
      this.setState({
        active: false
      });
    }
  }

  componentWillUnmount() {
  }
  /**
   *
   */
  componentWillMount() {
  }

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    var value = target.type === 'checkbox' ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value
    }
    this.setState({
      [name]: value
    });
  }

  getTool() {
    return this.props.model.get('toolConfig').find(tool => tool.type === this.type);
  }

  add(tool) {
    this.props.model.get("toolConfig").push(tool);
  }

  remove(tool) {
    this.props.model.set({
      "toolConfig": this.props.model.get("toolConfig").filter(tool => tool.type !== this.type)
    });
  }

  replace(tool) {
    this.props.model.get('toolConfig').forEach(t => {
      if (t.type === this.type) {
        t.options = tool.options;
        t.index = tool.index;
      }
    });
  }

  save() {

    var tool = {
      "type": this.type,
      "index": this.state.index,
      "options": {
        text: this.state.text,
        headerText: this.state.headerText,
        visibleAtStart: this.state.visibleAtStart,
        showInfoOnce: this.state.showInfoOnce,
        base64EncodeForInfotext: this.state.base64EncodeForInfotext,
        visibleForGroups: this.state.visibleForGroups.map(Function.prototype.call, String.prototype.trim)

      }
    };

    var existing = this.getTool();

    function update() {
      this.props.model.updateToolConfig(this.props.model.get("toolConfig"), () => {
        this.props.parent.props.parent.setState({
          alert: true,
          alertMessage: "Uppdateringen lyckades"
        });
      });
    }

    if (!this.state.active) {
      if (existing) {
        this.props.parent.props.parent.setState({
          alert: true,
          confirm: true,
          alertMessage: "Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?",
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
  
  renderVisibleForGroups () {
    if (this.props.parent.props.parent.state.authActive) {
      return ( 
        <div>
          <label htmlFor="visibleForGroups">Tillträde</label>
          <input id="visibleForGroups" value={this.state.visibleForGroups} type="text" name="visibleForGroups" onChange={(e) => {this.handleAuthGrpsChange(e)}}></input>
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
            <button className="btn btn-primary" onClick={(e) => {e.preventDefault(); this.save()}}>Spara</button>
          </p>
          <div>
            <input
              id="active"
              name="active"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.active}/>&nbsp;
            <label htmlFor="active">Aktiverad</label>
          </div>
          <div>
            <label htmlFor="index">Sorteringsordning</label>
            <input
              id="index"
              name="index"
              type="text"
              onChange={(e) => {this.handleInputChange(e)}}
              value={this.state.index}/>
          </div>
          <div>
            <input
              id="visibleAtStart"
              name="visibleAtStart"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.visibleAtStart}/>&nbsp;
            <label htmlFor="visibleAtStart">Synlig vid start</label>
          </div>
          <div>
            <label htmlFor="headerText">Rubrik</label>
            <input value={this.state.headerText} type="text" name="headerText" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="text">Infotext</label>
            <textarea value={this.state.text} type="text" name="text" onChange={(e) => {this.handleInputChange(e)}}></textarea>
          </div>
          {this.renderVisibleForGroups()}
          <div>
            <input
              id="showInfoOnce"
              name="showInfoOnce"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.showInfoOnce}/>&nbsp;
            <label htmlFor="showInfoOnce">Visa Information endast en gång</label>
          </div>
          <div>
            <input
              id="base64EncodeForInfotext"
              name="base64EncodeForInfotext"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.base64EncodeForInfotext}/>&nbsp;
            <label htmlFor="base64EncodeForInfotext">Använd Base64 för Infotext</label>
          </div>
        </form>
      </div>
    )
  }

}

export default ToolOptions;
