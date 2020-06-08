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
import FieldEditor from "../components/FieldEditor.jsx";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import { blue } from "@material-ui/core/colors";
import SaveIcon from "@material-ui/icons/Save";

class LayerDescription extends Component {
  render() {
    return this.props.layerDescription ? (
      <div>
        <div>Editerbara fält</div>
        <div>
          <code>
            {this.props.layerDescription
              .reduce((str, field, i, a) => {
                var v = "{" + field.name + "}";
                return [...str, v];
              }, [])
              .join(", ")}
          </code>
        </div>
      </div>
    ) : null;
  }
}

var defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  target: "toolbar",
  url: "",
  title: "Tyck till",
  abstract: "Vi vill veta vad du tycker!",
  featureType: "",
  featureNS: "",
  serviceId: "-1",
  showThankYou: true,
  visibleAtStart: false,
  thankYou: "",
  form: [],
  visibleForGroups: [],
  editServices: [],
  layerDescription: undefined
};

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
  /**
   *
   */

  constructor(props) {
    super(props);
    this.state = defaultState;
    this.type = "collector";

    var tool = this.getTool();

    if (tool) {
      this.state = {
        ...defaultState,
        active: true,
        index: tool.index,
        target: tool.options.target || "toolbar",
        position: tool.options.position,
        width: tool.options.width,
        height: tool.options.height,
        url: tool.options.url,
        featureType: tool.options.featureType,
        featureNS: tool.options.featureNS,
        showThankYou: tool.options.showThankYou,
        thankYou: tool.options.thankYou,
        form: tool.options.form || [],
        visibleAtStart: tool.options.visibleAtStart || false,
        visibleForGroups: tool.options.visibleForGroups || [],
        serviceId: tool.options.serviceId,
        editServices: []
      };
    } else {
      this.state = {
        ...defaultState,
        active: false
      };
    }
  }

  componentDidMount() {
    const { model } = this.props;
    model.getEditServices(services => {
      this.setState(
        {
          editServices: services
        },
        () => {
          const selectedService = services.find(
            s => s.id === this.state.serviceId
          );
          if (selectedService) {
            this.describeLayer(selectedService);
          }
        }
      );
    });
  }

  componentWillUnmount() {}
  /**
   *
   */
  componentWillMount() {}

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    var value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
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
        url: this.state.url,
        featureType: this.state.featureType,
        title: this.state.title,
        abstract: this.state.abstract,
        featureNS: this.state.featureNS,
        showThankYou: this.state.showThankYou,
        visibleAtStart: this.state.visibleAtStart,
        thankYou: this.state.thankYou,
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
        form: this.state.form,
        serviceId: this.state.serviceId
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

  describeLayer(layer) {
    this.setState({
      layerDescription: layer.editableFields
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
          <div>
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
              onChange={e => {
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
          <div className="separator">Övriga inställningar</div>
          {this.renderVisibleForGroups()}
          <div>
            <label htmlFor="url">Url</label>
            <input
              id="url"
              name="url"
              type="text"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.url}
            />
          </div>
          <div>
            <label htmlFor="abstract">
              Beskrivning{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Om verktyget visas som widget (inställningen 'Verktygsplacering' sätts till 'left' eller 'right) så kommer denna beskrivning att visas inne i widget-knappen."
              />
            </label>
            <input
              value={this.state.abstract}
              type="text"
              name="abstract"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="headerText">Rubrik</label>
            <input
              value={this.state.headerText}
              type="text"
              name="headerText"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
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
          </div>
          <div>
            <input
              id="showThankYou"
              name="showThankYou"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.showThankYou}
            />
            &nbsp;
            <label htmlFor="showThankYou">Visa tacksida</label>
          </div>
          <div>
            <label htmlFor="thankYou">Text för tacksida</label>
            <textarea
              value={this.state.thankYou}
              name="thankYou"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="featureNS">Redigeringstjänst</label>
            <div className="block-row">
              {this.state.editServices.map((service, i) => {
                const l = service.layers[0].split(":");
                const serviceFeatureType = l.length > 1 ? l[1] : l[0];
                const serviceFeatureNs = l.length > 1 ? l[0] : "";
                return (
                  <div key={i}>
                    <input
                      id={service.id + "_" + i}
                      type="radio"
                      value={this.state.serviceId}
                      checked={this.state.serviceId === service.id}
                      name="service"
                      onChange={() => {
                        this.setState(
                          {
                            featureType: serviceFeatureType,
                            featureNs: serviceFeatureNs,
                            serviceId: service.id
                          },
                          () => {
                            this.describeLayer(service);
                          }
                        );
                      }}
                    />
                    <label className="full" htmlFor={service.id + "_" + i}>
                      &nbsp;{service.caption}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          <LayerDescription layerDescription={this.state.layerDescription} />
          <FieldEditor
            form={this.state.form}
            parent={this}
            onUpdate={form => {
              console.log("Update");
              this.setState({
                form: form
              });
            }}
          />
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
        </form>
      </div>
    );
  }
}

export default ToolOptions;
