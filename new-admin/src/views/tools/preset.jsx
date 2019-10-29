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
import $ from "jquery";

class ToolOptions extends Component {
  constructor() {
    super();
    this.type = "preset";
    this.state = {
      validationErrors: [],
      presetList: [],
      active: false,
      index: 0,
      target: "toolbar",
      instruction: "",
      visibleForGroups: [],
      editing: null,
      showResults: false
    };
    $(".tree-view li").editable(this);
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        authActive: this.props.parent.props.parent.state.authActive,
        index: tool.index,
        target: tool.options.target || "toolbar",
        position: tool.options.position,
        width: tool.options.width,
        height: tool.options.height,
        instruction: tool.options.instruction,
        presetList: tool.options.presetList || [],
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

  componentWillMount() {}

  handleInputChange(event) {
    var target = event.target;
    var name = target.name;
    var value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }

    if (name === "instruction") {
      value = btoa(value);
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
        t.instruction = tool.instruction;
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
        presetList: this.state.presetList,
        instruction: this.state.instruction,
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

  addPreset(e) {
    this.setState({
      presetList: [
        ...this.state.presetList,
        {
          name: this.refs.preset_name.value,
          presetUrl: this.refs.preset_url.value
        }
      ]
    });
  }

  removePreset(name) {
    this.setState({
      presetList: this.state.presetList.filter(f => f.name !== name)
    });
  }

  editPresetValue(e) {
    var elements = this.refs.editForm.elements;

    if (elements) {
      e.name = elements["name"].value;
      e.presetUrl = "test-url";
    }

    this.state.presetList.forEach(t => {
      var preset = {
        name: elements["name"].value,
        presetUrl: elements["presetUrl"].value
      };
      this.state.presetList.push(preset);
    });
    this.renderForm(e);
  }

  results(value) {
    if (value.name === this.state.editing) {
      return (
        <div ref="editForm">
          <label>Name:</label>
          <br />
          <input name="name" type="text" defaultValue={value.name} />
          <br />
          <input name="url" type="text" defaultValue={value.presetUrl} />
          <br />
          <input
            type="submit"
            value="Spara"
            onSubmit={e => {
              e.preventDefault();
              this.handleSubmit(e);
            }}
          />
        </div>
      );
    }
  }

  editPreset(e, newValue, newUrl) {
    if (newValue && newUrl) {
      this.setState({
        editing: this.refs.newValue,
        editUrl: this.refs.newUrl,
        showResults: !this.state.showResults
      });
    }
  }

  cancelEdit() {
    this.setState({ editing: null });
  }

  isActive(value) {
    return (
      "layer-node preset-name" +
      (value === this.state.editing ? "preset-active" : "preset-default")
    );
  }

  isActives(value) {
    return value.name === this.state.editing ? this.renderForm(value) : null;
  }

  handleSubmit(e) {}

  renderForm(value) {
    if (value.name === this.state.editing) {
      return (
        <div>
          <label>Name:</label>
          <input type="text" name="name" defaultValue={this.state.presetList} />
          <input type="text" name="test" value="asd" />
          <button
            className="btn btn-success"
            onClick={e => {
              e.preventDefault();
              this.handleSubmit(e);
            }}
          >
            Lägg till
          </button>
        </div>
      );
    }
  }

  createGuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  }

  createPreset(name, url, expanded, toggled) {
    var elements = this.refs.presetForm.elements,
      id = this.createGuid(),
      layerName = elements["name"].value,
      layer = $(`
      <div><li
        class="layer-node preset-name"
        data-id=${id}
        data-type="layer">
        <span class="preset-name">${layerName}</span>
      </li></div>
    `);
    $(".tree-view > ul").prepend(layer);
    layer.editable(this);
    this.forceUpdate();
  }

  renderPresets() {
    return this.state.presetList.map((t, i) => (
      <div key={i}>
        <li
          className="layer-node preset-name"
          key={Math.round(Math.random() * 1e6)}
          data-id={t.name}
          ref="buttonContainer"
        >
          {t.name === this.state.editing ? (
            this.state.showResults ? (
              <div>
                <input
                  ref="newValue"
                  type="text"
                  defaultValue={t.name}
                  placeholder="Namn på snabbval"
                />
                <br />
                <input
                  ref="newUrl"
                  type="text"
                  defaultValue={t.presetUrl}
                  placeholder="Url"
                />
                <br />
                <button
                  className="btn btn-success"
                  onClick={() => this.editPreset(t, t.name, t.presetUrl)}
                >
                  Spara
                </button>
                <button
                  className="btn btn-default"
                  onClick={() => this.editPreset(t)}
                >
                  Avbryt
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => this.removePreset(t.name)}
                >
                  Radera
                </button>
              </div>
            ) : (
              t.name
            )
          ) : (
            t.name
          )}
          <i
            className="fa fa-pencil preset-icon"
            onClick={() => this.editPreset(t)}
          />
        </li>
      </div>
    ));
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
            name="visibleForGroups"
            type="text"
            onChange={e => {
              this.handleAuthGrpsChange(e);
            }}
            value={this.state.visibleForGroups}
          />
        </div>
      );
    } else {
      return null;
    }
  }

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
          <div>
            <label htmlFor="instruction">
              Instruktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som tooltip vid mouseover på verktygsknappen"
              />
            </label>
            <textarea
              type="text"
              id="instruction"
              name="instruction"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.instruction ? atob(this.state.instruction) : ""}
            />
          </div>
          {this.renderVisibleForGroups()}
          <div>
            <div>
              <h4>Lägg till snabbval</h4>
              <div>
                <label>Namn*</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Namn på snabbval"
                  required
                  ref="preset_name"
                />
              </div>
              <div>
                <label>Url*</label>
                <input
                  name="presetUrl"
                  type="text"
                  placeholder="ex: ?m=map_1&x=147325.273544&y=6398754.167358001&z=4&l=10"
                  required
                  ref="preset_url"
                />
              </div>
              <button
                className="btn btn-success"
                onClick={e => {
                  e.preventDefault();
                  this.addPreset(e);
                }}
              >
                Lägg till
              </button>
            </div>
            <h4>Lista över aktiva snabbval</h4>
            <fieldset className="tree-view">
              <ul>{this.renderPresets()}</ul>
            </fieldset>
          </div>
        </form>
      </div>
    );
  }
}

export default ToolOptions;
