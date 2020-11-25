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
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import CancelIcon from "@material-ui/icons/Cancel";
import DoneIcon from "@material-ui/icons/Done";
import RemoveIcon from "@material-ui/icons/Remove";
import SaveIcon from "@material-ui/icons/SaveSharp";
import { withStyles } from "@material-ui/core/styles";
import { red, green, blue } from "@material-ui/core/colors";

const ColorButtonRed = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700]
    }
  }
}))(Button);

const ColorButtonGreen = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    }
  }
}))(Button);

const ColorButtonBlue = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700]
    }
  }
}))(Button);

class ToolOptions extends Component {
  constructor() {
    super();
    this.type = "preset";
    this.state = {
      validationErrors: [],
      presetList: [],
      active: false,
      index: 0,
      //z target: "toolbar",
      //z instruction: "",
      visibleAtStart: false,
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
        //z target: tool.options.target || "toolbar",
        //z position: tool.options.position,
        //width: tool.options.width,
        // height: tool.options.height,
        //z instruction: tool.options.instruction,
        presetList: tool.options.presetList || [],
        visibleAtStart: tool.options.visibleAtStart,
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
        //z target: this.state.target,
        //z position: this.state.position,
        //z width: this.state.width,
        //z height: this.state.height,
        presetList: this.state.presetList,
        //z instruction: this.state.instruction,
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

  editPreset(e, name, url) {
    if (name && url) {
      var elements = this.refs.editName;
      var elements2 = this.refs.editUrl;

      e.name = elements.value;
      e.presetUrl = elements2.value;
    }
    this.setState({
      editing: e.name,
      editUrl: e.presetUrl,
      showResults: !this.state.showResults
    });
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
                  ref="editName"
                  type="text"
                  defaultValue={t.name}
                  placeholder="Namn på snabbval"
                />
                <br />
                <input
                  ref="editUrl"
                  type="text"
                  defaultValue={t.presetUrl}
                  placeholder="Url"
                />
                <br />
                <ColorButtonGreen
                  variant="contained"
                  className="btn"
                  onClick={() => this.editPreset(t, t.name, t.presetUrl)}
                  startIcon={<DoneIcon />}
                >
                  Klar
                </ColorButtonGreen>
                <ColorButtonBlue
                  variant="contained"
                  className="btn"
                  onClick={() => this.editPreset(t)}
                  startIcon={<CancelIcon />}
                >
                  Avbryt
                </ColorButtonBlue>
                <ColorButtonRed
                  variant="contained"
                  className="btn btn-danger"
                  onClick={() => this.removePreset(t.name)}
                  startIcon={<RemoveIcon />}
                >
                  Radera
                </ColorButtonRed>
              </div>
            ) : (
              t.name
            )
          ) : (
            t.name
          )}
          <i
            className={this.state.showResults ? "" : "fa fa-pencil preset-icon"}
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
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={e => {
                e.preventDefault();
                this.save();
              }}
              startIcon={<SaveIcon />}
            >
              Spara
            </ColorButtonBlue>
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
          <div className="separator">Fönsterinställningar</div>
          <div>
            <label htmlFor="index">Sorteringsordning</label>
            <input
              id="index"
              name="index"
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.index}
            />
          </div>
          {/*           <div>
            <label htmlFor="target">Verktygsplacering</label>
            <select
              id="target"
              name="target"
              className="control-fixed-width"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.target}
            >
              <option value="toolbar">Drawer</option>
              <option value="left">Widget left</option>
              <option value="right">Widget right</option>
              <option value="control">Control button</option>
            </select>
          </div>
 */}
          {/*           <div>
            <label htmlFor="position">
              Fönsterplacering{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Placering av verktygets fönster. Anges som antingen 'left' eller 'right'."
              />
            </label>
           <select
              id="position"
              name="position"
              className="control-fixed-width"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.position}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
 */}
          {/*           <div>
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
              type="number"
              min="0"
              className="control-fixed-width"
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
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.height}
            />
          </div>
 */}
          {/*           <div>
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
          <div className="separator">Övriga inställningar</div>
 */}

          <div className="separator">Övriga inställningar</div>
          {/*<div>
            <input
              id="visibleAtStart"
              name="visibleAtStart"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.visibleAtStart}
            />
            &nbsp;
            <label htmlFor="visibleAtStart">Synlig vid start</label>
          </div>*/}
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
              <ColorButtonGreen
                variant="contained"
                className="btn"
                onClick={e => {
                  e.preventDefault();
                  this.addPreset(e);
                }}
                startIcon={<AddIcon />}
              >
                Lägg till
              </ColorButtonGreen>
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
