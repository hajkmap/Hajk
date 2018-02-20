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
  exportUrl: "/mapservice/export/kml",
  importUrl: "/mapservice/import/kml",
  icons: "",
  proxyUrl: "",
  base64Encode: false,
  instruction: "",
  visibleForGroups: []
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "draw";
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        exportUrl: tool.options.exportUrl,
        importUrl: tool.options.importUrl,
        icons: tool.options.icons,
        proxyUrl: tool.options.proxyUrl,
        base64Encode: tool.options.base64Encode,
        instruction: tool.options.instruction,
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
    var target = event.target;
    var name = target.name;
    var value = target.type === 'checkbox' ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value
    }

    if (name == "instruction"){
      value = btoa(value);
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
        t.instruction = tool.instruction;
      }
    });
  }

  save() {

    var tool = {
      "type": this.type,
      "index": this.state.index,
      "options": {
        "exportUrl": this.state.exportUrl,
        "importUrl": this.state.importUrl,
        "base64Encode": this.state.base64Encode,
        "instruction": this.state.instruction,
        "icons": this.state.icons,
        "proxyUrl": this.state.proxyUrl,
        "visibleForGroups": this.state.visibleForGroups.map(Function.prototype.call, String.prototype.trim)
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
			visibleForGroups: groups
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
            <label htmlFor="exportUrl">URL till export-tjänst</label>
            <input value={this.state.exportUrl} type="text" name="exportUrl" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="importUrl">URL till import-tjänst</label>
            <input value={this.state.importUrl} type="text" name="importUrl" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <input
              id="Base64-active"
              name="base64Encode"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.base64Encode}/>&nbsp;
            <label htmlFor="Base64-active">Base64-encoding aktiverad</label>
          </div>
          <div>
            <label htmlFor="icons">Ikoner</label>
            <input value={this.state.icons} type="text" name="icons" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="instruction">Instruktion</label>
            <textarea
              type="text"
              id="instruction"
              name="instruction"
              onChange={(e) => {this.handleInputChange(e)}}
              value={this.state.instruction ? atob(this.state.instruction) : ""}
            />
          </div>
          {this.renderVisibleForGroups()}
          <div>
            <label htmlFor="proxyUrl">Proxy URL till utskrift och export</label>
            <input value={this.state.proxyUrl} type="text" name="proxyUrl" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
        </form>
      </div>
    )
  }

}

export default ToolOptions;
