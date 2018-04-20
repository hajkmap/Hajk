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
import $ from 'jquery'; //Används ej?

var defaultState = {
  validationErrors: [],
  presetList: [],
  active: false,
  index: 0,
  instruction: ""
};

class ToolOptions extends Component {
  getInitialState() {
    return {
      editing: null
    };
        $(".tree-view li").editable(this);
        { showResults: false };
  }
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "preset";
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        instruction: tool.options.instruction,
        presetList: tool.options.presetList || []
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
        presetList: this.state.presetList,
        "instruction": this.state.instruction,
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
            this.setState({
              presetList: []
            });
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

  /**
   *
   */
  addPreset(e) {
    console.log("addPreset: "+e);
    var elements = this.refs.presetForm.elements
    ,   preset = {
          "name": elements["name"].value,
          "presetUrl": elements["presetUrl"].value
        };
    this.state.presetList.push(preset);
    this.setState({
      presetList: this.state.presetList
    });
  }

  /**
   *
   */
  removePreset(name) {
    console.log("About to remove: "+name);
    this.state.presetList = this.state.presetList.filter(f => f.name !== name);
    this.setState({
      presetList: this.state.presetList
    });
  }

  editPresetValue(e) {   

    var elements = this.refs.editForm.elements;

    if(elements) {
      e.name = elements["name"].value;
      e.presetUrl = "test-url";
    }

    this.state.presetList.forEach(t => {
        var preset = {
          "name": elements["name"].value,
          "presetUrl": elements["presetUrl"].value
        };
    });
    this.state.presetList.push(preset);
    this.renderForm(e);

  }

  results(value) {
    if(value.name===this.state.editing) {
        return (
          <form ref="editForm" onSubmit={(e) => { e.preventDefault(); this.handleSubmit(e) }}>
            <label>
              Name:
            </label>
              <br />
              <input name="name" type="text" defaultValue={value.name} />
              <br />
              <input name="url" type="text" defaultValue={value.presetUrl} />
              <br />
            <input type="submit" value="Submit" />
          </form>
        );
    }
  }

  /**
   *
   */
  editPreset(e, newValue, newUrl) {

    if (newValue && newUrl) {
      var elements = this.refs.newValue;
      e.name = elements.value;

      var elements2 = this.refs.newUrl;
      e.presetUrl = elements2.value;
    }

    this.setState({editing: e.name,
                   editUrl: e.presetUrl});

    this.setState({ showResults: !this.state.showResults });
    { this.state.showResults ? this.results(e) : null }

  }

  cancelEdit() {
    this.setState({editing: null});
  }

  isActive(value) {
    return 'layer-node preset-name'+((value===this.state.editing) ? 'preset-active' : 'preset-default');
  }

  isActives(value) {
    console.log("isActives");
    return ((value.name===this.state.editing) ? this.renderForm(value) : null);
  }

  handleSubmit(e) {
    var form = e.target;

    var content = form.elements['name'].value;
  }
  

  renderForm(value) {
    if(value.name===this.state.editing) {
      return (
        <form ref="someForm" onSubmit={(e) => { e.preventDefault(); this.handleSubmit(e) }}>
          <label>Name:</label>
            <input type="text" name="name" defaultValue={this.state.presetList} />
            <input type="text" name="test" value="asd" />
            <button className="btn btn-success">Lägg till</button>
        </form>
      );
    } 
  }

createGuid() {
    function s4() {
      return Math
        .floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  createPreset(name, url, expanded, toggled) {

    var elements = this.refs.presetFormzz.elements
    ,   preset = {
          "name": elements["name"].value,
          "presetUrl": elements["presetUrl"].value
        };

    var id = this.createGuid();
    var layerName = elements["name"].value;
    var layer = $(`
      <div><li
        class="layer-node preset-name"
        data-id=${id}
        data-type="layer">
        <span class="preset-name">${layerName}</span>
      </li></div>
    `);
    $('.tree-view > ul').prepend(layer);
    layer.editable(this);
    this.forceUpdate();
  }

  /**
   *
   */
  renderPresets() {
      return this.state.presetList.map((t, i) => (
          <div key={i}>
            <li key={i} className="layer-node preset-name" key={Math.round(Math.random() * 1E6)} data-id={t.name} ref="buttonContainer">
             { t.name===this.state.editing ? (this.state.showResults ?
              <div>
                <input ref="newValue" type="text" defaultValue={t.name} placeholder="Namn på snabbval" /><br />
                <input ref="newUrl" type="text" defaultValue={t.presetUrl} placeholder="Url" /><br />
                <button className="btn btn-success" onClick={() => this.editPreset(t, t.name, t.presetUrl)}>Spara</button>
                <button className="btn btn-default" onClick={() => this.editPreset(t)}>Avbryt</button>
                <button className="btn btn-danger" onClick={() => this.removePreset(t.name)}>Radera</button>
              </div> : t.name) : t.name }
             <i className="fa fa-pencil preset-icon" onClick={() => this.editPreset(t)}></i> 
            </li>
          </div>
      ));
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
            <label htmlFor="instruction">Instruktion</label>
            <textarea
              type="text"
              id="instruction"
              name="instruction"
              onChange={(e) => {this.handleInputChange(e)}}
              value={atob(this.state.instruction)}
            />
          </div>
          <div>
            <form ref="presetForm" onSubmit={(e) => { e.preventDefault(); this.addPreset(e) }}>
              <h4>Lägg till snabbval</h4>
              <div>
                <label>Namn*</label><input name="name" type="text" placeholder="Namn på snabbval" defaultValue="Testkarta" required/>
              </div>
              <div>
                <label>Url*</label><input name="presetUrl" type="text" placeholder="ex: ?m=map_1&x=147325.273544&y=6398754.167358001&z=4&l=10" defaultValue="url-test" required/>
              </div>
              <button className="btn btn-success">Lägg till</button>
            </form>
            <h4>Lista över aktiva snabbval</h4>
            <fieldset className="tree-view">
              <ul>
                {this.renderPresets()}    
              </ul>
            </fieldset>
          </div>
        </form>
      </div>
    )
  }
}

export default ToolOptions;
