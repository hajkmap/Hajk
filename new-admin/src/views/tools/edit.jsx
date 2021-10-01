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
import EditModel from "./../../models/edit.js";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/SaveSharp";
import { withStyles } from "@material-ui/core/styles";
import { blue } from "@material-ui/core/colors";
import Tree from "../treeEdit.jsx";

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

const defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  target: "toolbar",
  instruction: "",
  visibleAtStart: false,
  visibleForGroups: [],
  activeServices: [],
  editableLayers: {},
  tree: "",
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "edit";
    this.editModel = new EditModel();

    this.handleAddEditableLayer = this.handleAddEditableLayer.bind(this);
    this.loadLayers = this.loadLayers.bind(this);
  }

  componentDidMount() {
    this.loadEditableLayers();
    let tool = this.getTool();
    const layersUrl =
      this.props.model && this.props.model.get("config").url_layers
        ? this.props.model.get("config").url_layers
        : "";
    if (tool) {
      this.setState(
        {
          active: true,
          index: tool.index,
          target: tool.options.target || "toolbar",
          position: tool.options.position,
          width: tool.options.width,
          height: tool.options.height,
          instruction: tool.options.instruction,
          activeServices: tool.options.activeServices || [],
          visibleAtStart: tool.options.visibleAtStart,
          visibleForGroups:
            tool.options.visibleForGroups || this.state.visibleForGroups,
        },
        () => {
          this.loadLayers();
        }
      );
    } else {
      this.setState({
        active: false,
      });
    }
    if (layersUrl) {
      this.editModel.getConfig(layersUrl, (services) => {
        this.setState({
          services: services,
        });
      });
    }
  }

  componentWillUnmount() {}
  /**
   *
   */
  componentWillMount() {}

  handleInputChange(event) {
    const t = event.target;
    const name = t.name;
    let value = t.type === "checkbox" ? t.checked : t.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }

    if (name === "instruction") {
      value = btoa(value);
    }
    this.setState({
      [name]: value,
    });
  }

  handleLayerInputChange(event) {
    const target = event.target;
    const name = target.name;
    let value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }

    if (name === "instruction") {
      value = btoa(value);
    }
    this.setState({
      [name]: value,
    });
  }

  /**
   * Called from treeEdit.jsx in componentDidMount and passes refs.
   * Sets checkboxes and input fields for edit layers.
   * @param {*} childRefs
   */
  loadLayers(childRefs) {
    // check checkboxes, show input field
    // and set text from map config
    let ids = [];

    for (let id of this.state.activeServices) {
      ids.push(id);
    }
    if (ids.length > 0 && typeof ids[0].visibleForGroups === "undefined") {
      let idsNew = [];
      for (let i = 0; i < ids.length; i++) {
        let as = {
          id: ids[i],
          visibleForGroups: [],
        };
        idsNew.push(as);
      }
      ids = idsNew;
      this.setState({
        activeServices: idsNew,
      });
    }
    if (typeof childRefs !== "undefined") {
      for (let i of ids) {
        childRefs["cb_" + i.id] && (childRefs["cb_" + i.id].checked = true);
        childRefs[i.id] && (childRefs[i.id].hidden = false);
        childRefs[i.id] && (childRefs[i.id].value = i.visibleForGroups.join());
      }
    }
  }

  loadEditableLayers() {
    this.props.model.getConfig(
      this.props.model.get("config").url_layers,
      (layers) => {
        this.setState({
          editableLayers: layers.wfstlayers,
        });

        this.setState({
          tree: (
            <Tree
              model={this}
              activeServices={this.state.editableLayers}
              handleAddEditableLayer={this.handleAddEditableLayer}
              loadLayers={this.loadLayers}
              authActive={this.props.parent.props.parent.state.authActive}
            />
          ),
        });
      }
    );
  }

  getTool() {
    return this.props.model
      .get("toolConfig")
      .find((tool) => tool.type === this.type);
  }

  add(tool) {
    this.props.model.get("toolConfig").push(tool);
  }

  remove(tool) {
    this.props.model.set({
      toolConfig: this.props.model
        .get("toolConfig")
        .filter((tool) => tool.type !== this.type),
    });
  }

  replace(tool) {
    this.props.model.get("toolConfig").forEach((t) => {
      if (t.type === this.type) {
        t.options = tool.options;
        t.index = tool.index;
        t.instruction = tool.instruction;
      }
    });
  }

  save() {
    // Set visibleForGroups to [] instead of [""] if input field is empty.
    for (let aS of this.state.activeServices) {
      if (typeof aS.visibleForGroups !== "undefined") {
        if (aS.visibleForGroups.length === 1 && aS.visibleForGroups[0] === "") {
          aS.visibleForGroups = [];
        }
      }
    }
    let tool = {
      type: this.type,
      index: this.state.index,
      options: {
        target: this.state.target,
        position: this.state.position,
        width: this.state.width,
        height: this.state.height,
        instruction: this.state.instruction,
        activeServices: this.state.activeServices,
        visibleAtStart: this.state.visibleAtStart,
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
      },
    };

    const existing = this.getTool();

    function update() {
      this.props.model.updateToolConfig(
        this.props.model.get("toolConfig"),
        () => {
          this.props.parent.props.parent.setState({
            alert: true,
            alertMessage: "Uppdateringen lyckades",
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
          },
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
      visibleForGroups: value !== "" ? groups : [],
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
            onChange={(e) => {
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
   * Called from treeEdit.jsx as event handler. Handles checkboxes and
   * input of AD-groups for wfst
   * @param {*} e
   * @param {*} layer
   */
  handleAddEditableLayer(e, layer) {
    if (e.target.type.toLowerCase() === "checkbox") {
      if (e.target.checked) {
        let toAdd = {
          id: layer.id.toString(),
          visibleForGroups: [],
        };
        this.setState({
          activeServices: [...this.state.activeServices, toAdd],
        });
      } else {
        let newArray = this.state.activeServices.filter(
          (o) => o.id !== layer.id.toString()
        );

        this.setState({
          activeServices: newArray,
        });
      }
    }
    if (e.target.type.toLowerCase() === "text") {
      let obj = this.state.activeServices.find(
        (o) => o.id === layer.id.toString()
      );
      let newArray = this.state.activeServices.filter(
        (o) => o.id !== layer.id.toString()
      );

      // Creates array and trims whitespace from start and end
      if (typeof obj !== "undefined") {
        obj.visibleForGroups = e.target.value.split(",");
        obj.visibleForGroups = obj.visibleForGroups.map((el) => el.trim());
      }

      newArray.push(obj);

      this.setState({
        activeServices: newArray,
      });
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
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={(e) => {
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
              onChange={(e) => {
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
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.index}
            />
          </div>
          <div>
            <label htmlFor="target">Verktygsplacering</label>
            <select
              id="target"
              name="target"
              className="control-fixed-width"
              onChange={(e) => {
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
          <div>
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
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.position}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
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
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
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
                title="Höjd i pixlar på verktygets fönster. Anges antingen numeriskt (pixlar), 'dynamic' för att automatiskt anpassa höjden efter innehållet eller 'auto' att använda maximal höjd."
              />
            </label>
            <input
              id="height"
              name="height"
              type="text"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.height}
            />
          </div>
          <div className="separator">Övriga inställningar</div>
          <div>
            <input
              id="visibleAtStart"
              name="visibleAtStart"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.visibleAtStart}
            />
            &nbsp;
            <label htmlFor="visibleAtStart">Synlig vid start</label>
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
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.instruction ? atob(this.state.instruction) : ""}
            />
          </div>
          <div>{this.renderVisibleForGroups()}</div>
          <div>
            <div className="separator">Redigeringstjänster</div>

            {this.state.tree}
          </div>
        </form>
      </div>
    );
  }
}

export default ToolOptions;
