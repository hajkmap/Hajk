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
import Tree from '../tree.jsx';

var defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  instruction: "",
  visibleForGroups: [],
  tree: "",
  layers: []
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor () {
    super();
    this.state = defaultState;
    this.type = "edit";
    this.handleAddSearchable = this.handleAddSearchable.bind(this);
    this.loadLayers = this.loadLayers.bind(this);
  }

  componentDidMount() {
    if (this.props.parent.props.parent.state.authActive) {
      this.loadEditableLayers();
    }

    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        instruction: tool.options.instruction,
        visibleForGroups: tool.options.visibleForGroups ? tool.options.visibleForGroups : [],
        layers: tool.options.layers ? tool.options.layers : []
      });
    } else {
      this.setState({
        active: false
      });
    }
  }

  componentWillUnmount () {
  }
  /**
   *
   */
  componentWillMount () {
  }

  loadEditableLayers() {
    let layers = this.props.model.getConfig(this.props.model.get('config').url_layers, (layers) => {
      this.setState({
        editableLayers: layers.wfstlayers,
      });

      this.setState({
        tree: <Tree model={this} layers={this.state.editableLayers} handleAddSearchable={this.handleAddSearchable} loadLayers={this.loadLayers} />
      });
    });
  }

  /**
   * Anropas från tree.jsx i componentDidMount som passar med refs.
   * Sätter checkboxar och inputfält för söklager.
   * @param {*} childRefs
   */
  loadLayers(childRefs) {
    // checka checkboxar, visa textfält
    // och sätt text från kartkonfig.json
    let ids = [];

    for (let id of this.state.layers) {
      ids.push(id);
    }

    if (typeof childRefs != "undefined") {
      for (let i of ids) {
        childRefs["cb_" + i.id].checked = true;
        childRefs[i.id].hidden = false;
        childRefs[i.id].value = i.visibleForGroups.join();
      }
    }
  }

  handleAddSearchable(e, layer) {
    if (e.target.type.toLowerCase() === "checkbox") {
      if (e.target.checked) {
        let toAdd = {
          id: layer.id.toString(),
          visibleForGroups: []
        };
        this.setState({
          layers: [...this.state.layers, toAdd]
        });
      } else {
        let newArray = this.state.layers.filter((o) => o.id != layer.id.toString());

        this.setState({
          layers: newArray
        });
      }
    }
    if (e.target.type.toLowerCase() === "text") {
      let obj = this.state.layers.find((o) => o.id === layer.id.toString());
      let newArray = this.state.layers.filter((o) => o.id !== layer.id.toString())

      // Skapar array och trimmar whitespace från start och slut av varje cell
      if (typeof obj != "undefined") {
        obj.visibleForGroups = e.target.value.split(",");
        obj.visibleForGroups = obj.visibleForGroups.map(el => el.trim());

        //Sätter visibleForGroups till [] istället för [""] om inputfältet är tomt.
        if (obj.visibleForGroups.length === 1 && obj.visibleForGroups[0] === "") {
          obj.visibleForGroups = [];
        }
      }

      newArray.push(obj);

      this.setState({
        layers: newArray
      });
    }
  }

  handleInputChange(event) {
    var target = event.target;
    var name = target.name;
    var value = target.type === 'checkbox' ? target.checked : target.value;
    if (typeof value === 'string' && value.trim() !== '') {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }

    if (name == 'instruction') {
      value = btoa(value);
    }
    this.setState({
      [name]: value
    });
  }

  getTool () {
    return this.props.model.get('toolConfig').find(tool => tool.type === this.type);
  }

  add (tool) {
    this.props.model.get('toolConfig').push(tool);
  }

  remove (tool) {
    this.props.model.set({
      'toolConfig': this.props.model.get('toolConfig').filter(tool => tool.type !== this.type)
    });
  }

  replace (tool) {
    this.props.model.get('toolConfig').forEach(t => {
      if (t.type === this.type) {
        t.options = tool.options;
        t.index = tool.index;
        t.instruction = tool.instruction;
      }
    });
  }

  save () {
    var tool = {
      "type": this.type,
      "index": this.state.index,
      "options": {
        "instruction": this.state.instruction,
        "visibleForGroups": this.state.visibleForGroups.map(Function.prototype.call, String.prototype.trim),
        "layers": this.state.layers ? this.state.layers : []
      }
    };
    debugger

    var existing = this.getTool();

    function update () {
      this.props.model.updateToolConfig(this.props.model.get('toolConfig'), () => {
        this.props.parent.props.parent.setState({
          alert: true,
          alertMessage: 'Uppdateringen lyckades'
        });
      });
    }

    if (!this.state.active) {
      if (existing) {
        this.props.parent.props.parent.setState({
          alert: true,
          confirm: true,
          alertMessage: 'Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?',
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

  handleAuthGrpsChange (event) {
    const target = event.target;
    const value = target.value;
    let groups = [];

    try {
      groups = value.split(',');
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
          <label htmlFor='visibleForGroups'>Tillträde</label>
          <input id='visibleForGroups' value={this.state.visibleForGroups} type='text' name='visibleForGroups' onChange={(e) => { this.handleAuthGrpsChange(e); }} />
        </div>
      );
    } else {
      return null;
    }
  }

  /**
   *
   */
  render () {
    return (
      <div>
        <form>
          <p>
            <button className='btn btn-primary' onClick={(e) => { e.preventDefault(); this.save(); }}>Spara</button>
          </p>
          <div>
            <input
              id='active'
              name='active'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.active} />&nbsp;
            <label htmlFor='active'>Aktiverad</label>
          </div>
          <div>
            <label htmlFor='index'>Sorteringsordning</label>
            <input
              id='index'
              name='index'
              type='text'
              onChange={(e) => { this.handleInputChange(e); }}
              value={this.state.index} />
          </div>
          <div>
            <label htmlFor='instruction'>Instruktion</label>
            <textarea
              type='text'
              id='instruction'
              name='instruction'
              onChange={(e) => { this.handleInputChange(e); }}
              value={this.state.instruction ? atob(this.state.instruction) : ''}
            />
          </div>
          {this.renderVisibleForGroups()}
        </form>
        {this.state.tree}
      </div>
    );
  }
}

export default ToolOptions;
