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
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/SaveSharp";
import { withStyles } from "@material-ui/core/styles";
import { blue } from "@material-ui/core/colors";

const ColorButtonBlue = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700]
    }
  }
}))(Button);

var defaultState = {
  validationErrors: [],
  active: false,
  tocExpanded: true,
  index: 0,
  target: "toolbar",
  panel: "right",
  title: "Översiktsplan",
  abstract: "Läs mer om vad som planeras i kommunen",
  caption: "Översiktsplan",
  html: "<div>HTML som beskriver dokumentets innehåll</div>",
  serviceUrl: "http://localhost:55630/informative/load",
  exportUrl: "http://localhost:55630/export/document",
  exportRoot: "",
  documentList: [],
  document: "",
  visibleAtStart: false,
  templateJsonFilePath: "",
  visibleForGroups: []
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "informative";
  }

  componentDidMount() {
    let url =
      this.props.model.get("config").url_document_list +
      "/" +
      this.props.model.get("mapFile");

    var tool = this.getTool();
    this.props.model.getDocumentList(url, list => {
      this.setState(
        {
          documentList: list
        },
        () => {
          if (tool) {
            this.props.model.getDocumentList(url, list => {
              this.setState({
                active: true,
                tocExpanded:
                  tool.options.tocExpanded === undefined
                    ? true
                    : tool.options.tocExpanded,
                index: tool.index,
                target: tool.options.target || "toolbar",
                position: tool.options.position,
                width: tool.options.width,
                height: tool.options.height,
                caption: tool.options.caption,
                title: tool.options.title,
                abstract: tool.options.abstract,
                html: tool.options.html,
                serviceUrl: tool.options.serviceUrl,
                exportUrl: tool.options.exportUrl,
                exportRoot: tool.options.exportRoot,
                document: tool.options.document || list[0],
                visibleAtStart: tool.options.visibleAtStart,
                visibleForGroups: tool.options.visibleForGroups
                  ? tool.options.visibleForGroups
                  : []
              });
            });
          } else {
            this.setState({
              active: false
            });
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
        tocExpanded: this.state.tocExpanded,
        title: this.state.title,
        caption: this.state.caption,
        serviceUrl: this.state.serviceUrl,
        exportUrl: this.state.exportUrl,
        exportRoot: this.state.exportRoot,
        abstract: this.state.abstract,
        html: this.state.html,
        document: this.state.document,
        visibleAtStart: this.state.visibleAtStart,
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

  renderDocumentList() {
    return this.state.documentList.map((document, i) => {
      return <option key={i}>{document}</option>;
    });
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
          {this.renderVisibleForGroups()}
          <div>
            <input
              id="tocExpanded"
              name="tocExpanded"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.tocExpanded}
            />
            &nbsp;
            <label className="long-label" htmlFor="tocExpanded">
              Expanderad teckenförklaring
            </label>
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
            <label htmlFor="title">Rubrik</label>
            <input
              value={this.state.title}
              type="text"
              name="title"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="caption">Titel</label>
            <input
              id="caption"
              name="caption"
              type="text"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.caption}
            />
          </div>
          <div>
            <label htmlFor="html">Sammanfattning</label>
            <textarea
              id="html"
              name="html"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.html}
            />
          </div>
          <div>
            <label htmlFor="serviceUrl">Länk till tjänst</label>
            <input
              id="serviceUrl"
              name="serviceUrl"
              type="text"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.serviceUrl}
            />
          </div>
          <div>
            <label htmlFor="exportUrl">Länk till export</label>
            <input
              id="exportUrl"
              name="exportUrl"
              type="text"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.exportUrl}
            />
          </div>
          <div>
            <label htmlFor="exportRoot">Virtuell mapp till tjänst</label>
            <input
              id="exportRoot"
              name="exportRoot"
              type="text"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.exportRoot}
            />
          </div>
          <div>
            <label htmlFor="document">Välj dokument</label>
            <select
              id="document"
              name="document"
              value={this.state.document}
              className="control-fixed-width"
              onChange={e => {
                this.handleInputChange(e);
              }}
            >
              {this.renderDocumentList()}
            </select>
          </div>
        </form>
      </div>
    );
  }
}

export default ToolOptions;
