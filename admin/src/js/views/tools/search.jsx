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
  toolbar: "bottom",
  active: false,
  index: 0,
  onMap: false,
  bothSynlig: false,
  selectionTools: true,
  base64Encode: false,
  instruction: "",
  filterVisible: true,
  displayPopup: true,
  maxZoom: 14,
  excelExportUrl: "/mapservice/export/excel",
  kmlExportUrl: "/mapservice/export/kml",
  markerImg: "http://localhost/hajk/assets/icons/marker.png",
  anchorX: 16,
  anchorY: 32,
  imgSizeX: 32,
  imgSizeY: 32,
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
    this.type = "search";
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        onMap: tool.options.onMap,
        bothSynlig: tool.options.bothSynlig,
        selectionTools: tool.options.selectionTools,
        base64Encode: tool.options.base64Encode,
        instruction: tool.options.instruction,
        filterVisible: tool.options.filterVisible,
        displayPopup: tool.options.displayPopup,
        maxZoom: tool.options.maxZoom,
        excelExportUrl: tool.options.excelExportUrl,
        kmlExportUrl: tool.options.kmlExportUrl,
        markerImg: tool.options.markerImg,
        anchorX: tool.options.anchor[0] || this.state.anchorX,
        anchorY: tool.options.anchor[1] || this.state.anchorY,
        imgSizeX: tool.options.imgSize[0] || this.state.imgSizeX,
        imgSizeY: tool.options.imgSize[1] || this.state.imgSizeX,
        popupOffsetY: tool.options.popupOffsetY,
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

    var toolbar = 'bottom';
    var onMap = this.state.onMap;
    if(this.state.bothSynlig){
      toolbar = 'bottom';
      onMap = true;
    } else if (onMap){
      toolbar = '';
    }

    var tool = {
      "type": this.type,
      "index": this.state.index,
      "options": {
        onMap: onMap,
        bothSynlig: this.state.bothSynlig,
        toolbar: toolbar,
        maxZoom: this.state.maxZoom,
        markerImg: this.state.markerImg,
        kmlExportUrl: this.state.kmlExportUrl,
        excelExportUrl: this.state.excelExportUrl,
        displayPopup: this.state.displayPopup,
        selectionTools: this.state.selectionTools,
        base64Encode: this.state.base64Encode,
        instruction: this.state.instruction,
        filterVisible: this.state.filterVisible,
        anchor: [this.state.anchorX, this.state.anchorY],
        imgSize: [this.state.imgSizeX, this.state.imgSizeY],
        popupOffsetY: this.state.popupOffsetY,
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
            <input
              id="onMap"
              name="onMap"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.onMap}/>&nbsp;
            <label htmlFor="onMap">Alltid synlig</label>
          </div>
          <div>
            <input
              id="bothSynlig"
              name="bothSynlig"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.bothSynlig}/>&nbsp;
            <label htmlFor="bothSynlig">Båda snabbsök och sökPanel synlig</label>
          </div>
          <div>
            <input
              id="displayPopup"
              name="displayPopup"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.displayPopup}/>&nbsp;
            <label htmlFor="displayPopup">Visa popup</label>
          </div>
          <div>
            <input
              id="filterVisible"
              name="filterVisible"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.filterVisible}/>&nbsp;
            <label htmlFor="filterVisible">Sök i synliga lager</label>
          </div>
          <div>
            <input
              id="selectionTools"
              name="selectionTools"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.selectionTools}/>&nbsp;
            <label htmlFor="selectionTools">Verktyg för ytsökning</label>
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
            <label htmlFor="instruction">Instruktioner</label>
            <input
              id="instruction"
              name="instruction"
              type="text"
              onChange={(e) => {this.handleInputChange(e)}}
              value={this.state.instruction}/>
          </div>
          {this.renderVisibleForGroups()}
          <div>
            <label htmlFor="maxZoom">Zoomnivå</label>
            <input value={this.state.maxZoom} type="text" name="maxZoom" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="excelExportUrl">URL Excel-tjänst</label>
            <input value={this.state.excelExportUrl} type="text" name="excelExportUrl" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="kmlExportUrl">URL KML-tjänst</label>
            <input value={this.state.kmlExportUrl} type="text" name="kmlExportUrl" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="markerImg">Ikon för sökträff</label>
            <input value={this.state.markerImg} type="text" name="markerImg" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="anchorX">Ikonförskjutning X</label>
            <input value={this.state.anchorX} type="text" name="anchorX" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="anchorY">Ikonförskjutning Y</label>
            <input value={this.state.anchorY} type="text" name="anchorY" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="popupOffsetY">Förskjutning popup-ruta</label>
            <input value={this.state.popupOffsetY} type="text" name="popupOffsetY" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="imgSizeX">Bildbredd</label>
            <input value={this.state.imgSizeX} type="text" name="imgSizeX" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="imgSizeY">Bildhöjd</label>
            <input value={this.state.imgSizeY} type="text" name="imgSizeY" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
        </form>
      </div>
    )
  }
}

export default ToolOptions;
