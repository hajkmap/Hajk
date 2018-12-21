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

var defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  target: "toolbar",
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
    this.type = "edit";
    this.editModel = new EditModel();
  }

  componentDidMount() {
    var tool = this.getTool();
    var layersUrl =
      this.props.model && this.props.model.get("config").url_layers
        ? this.props.model.get("config").url_layers
        : "";
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        target: tool.options.target || "toolbar",
        instruction: tool.options.instruction,
        activeServices: tool.options.activeServices || [],
        visibleForGroups: tool.options.visibleForGroups
          ? tool.options.visibleForGroups
          : []
      });
    } else {
      this.setState({
        active: false
      });
    }
    if (layersUrl) {
      this.editModel.getConfig(layersUrl, services => {
        this.setState({
          services: services
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
        instruction: this.state.instruction,
        activeServices: this.state.activeServices,
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

  renderServices() {
    const { services } = this.state;
    if (services) {
      return services.map((service, i) => {
        var active = this.state.activeServices.find(
          serviceId => serviceId === service.id
        );
        if (active === undefined) {
          active = false;
        }
        return (
          <li key={i}>
            <input
              id={service.id}
              name={service.caption}
              type="checkbox"
              checked={active}
              onChange={e => {
                var actives = [...this.state.activeServices];
                if (e.target.checked) {
                  actives.push(service.id);
                } else {
                  actives = actives.filter(
                    serviceId => serviceId !== service.id
                  );
                }
                this.setState({
                  activeServices: actives
                });
              }}
            />
            &nbsp;
            <label htmlFor={service.id}>{service.caption}</label>
          </li>
        );
      });
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
            <label htmlFor="instruction">Instruktion</label>
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
          <div>
            <label>Tjänster</label>
            <ul
              style={{
                display: "inline-block",
                padding: 0
              }}
            >
              {this.renderServices()}
            </ul>
          </div>
          {this.renderVisibleForGroups()}
        </form>
      </div>
    );
  }
}

export default ToolOptions;
