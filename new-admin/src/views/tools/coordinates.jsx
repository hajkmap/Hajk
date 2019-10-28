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
  transformations: [],
  active: false,
  index: 0,
  target: 0,
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
    this.type = "coordinates";

    this.renderVisibleForGroups = this.renderVisibleForGroups.bind(this);
    this.handleAuthGrpsChange = this.handleAuthGrpsChange.bind(this);
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        target: tool.options.target || "toolbar",
        position: tool.options.position,
        width: tool.options.width,
        height: tool.options.height,
        instruction: tool.options.instruction,
        transformations: tool.options.transformations || [],
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
        instruction: this.state.instruction,
        transformations: this.state.transformations,
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
              transformations: []
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

  addTransformation(e) {
    var elements = this.refs.transformationForm.elements,
      transformation = {
        code: elements["code"].value,
        default: elements["default"].checked,
        hint: elements["hint"].value,
        title: elements["title"].value,
        xtitle: elements["xtitle"].value,
        ytitle: elements["ytitle"].value,
        inverseAxis: elements["inverseAxis"].checked
      };
    this.state.transformations.push(transformation);
    this.setState({
      transformations: this.state.transformations
    });
  }

  removeTransformation(code) {
    this.setState({
      transformations: this.state.transformations.filter(f => f.code !== code)
    });
  }

  renderTransformations() {
    return this.state.transformations.map((t, i) => (
      <div key={i} className="inset-form">
        <div>
          <span
            onClick={() => this.removeTransformation(t.code)}
            className="btn btn-danger"
          >
            Ta bort
          </span>
        </div>
        <div>
          <span>SRS-kod</span>: <span>{t.code}</span>
        </div>
        <div>
          <span>Standard</span>: <span>{t.default ? "Ja" : "Nej"}</span>
        </div>
        <div>
          <span>Beskrivning</span>: <span>{t.hint}</span>
        </div>
        <div>
          <span>Titel</span>: <span>{t.title}</span>
        </div>
        <div>
          <span>X-ettikett</span>: <span>{t.xtitle}</span>
        </div>
        <div>
          <span>Y-ettikett</span>: <span>{t.ytitle}</span>
        </div>
        <div>
          <span>Inverterad</span>: <span>{t.inverseAxis ? "Ja" : "Nej"}</span>
        </div>
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
        <p>
          <button className="btn btn-primary" onClick={() => this.save()}>
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
          <div>Transformationer</div>
          {this.renderTransformations()}
        </div>
        <div>
          <form
            ref="transformationForm"
            onSubmit={e => {
              e.preventDefault();
              this.addTransformation(e);
            }}
          >
            <div>
              <label>SRS-kod*</label>
              <input name="code" type="text" />
            </div>
            <div>
              <label>Standard*</label>
              <input name="default" type="checkbox" />
            </div>
            <div>
              <label>Beskrivning*</label>
              <input name="hint" type="text" />
            </div>
            <div>
              <label>Titel*</label>
              <input name="title" type="text" />
            </div>
            <div>
              <label>X-etikett*</label>
              <input name="xtitle" type="text" />
            </div>
            <div>
              <label>Y-etikett*</label>
              <input name="ytitle" type="text" />
            </div>
            <div>
              <label>Inverterad</label>
              <input name="inverseAxis" type="checkbox" />
            </div>
            <button className="btn btn-success">Lägg till</button>
          </form>
        </div>
      </div>
    );
  }
}

export default ToolOptions;
