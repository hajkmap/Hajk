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

import React, { Component } from "react";
import { SketchPicker } from "react-color";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/Save";
import { withStyles } from "@material-ui/core/styles";
import { blue } from "@material-ui/core/colors";

var defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  target: "toolbar",
  abstract: "VTSEARCH",
  title: "VtSearch",
  position: "right",
  width: 400,
  height: 300,
  visibleAtStart: true,
  lineNumberAndPublicLineNumbers: { searchLabel: "Linjenummer", url: "" },
  municipalityZoneNames: { searchLabel: "Kommunnamn", url: "" },
  stopAreaNameAndNumbers: {
    searchLabel: "Hållplats",
    defaultSortAttribute: "StopAreaNumber",
    url: "",
  },
  transportModeTypeNames: { searchLabel: "Trafikslag", url: "" },
  journeys: {
    searchLabel: "Turer",
    defaultSortAttribute: "EarliestDepartureTimeAtToStopPoint",
    url: "",
  },
  journeysAttributesToDisplayInternalLine: {
    displayName: "TEKNISK LINJE",
    key: "InternalLineNumber",
  },
  journeysAttributesToDisplayPublicLine: {
    displayName: "PUBLIK LINJE",
    key: "PublicLineName",
  },
  journeysAttributesToDisplayTransportCompany: {
    displayName: "TRAFIKFÖRETAG",
    key: "TransportCompany",
  },
  journeysAttributesToDisplayFromStopPointName: {
    displayName: "FRÅN HÅLLPLATSOMR",
    key: "FromStopPointName",
  },
  journeysAttributesToDisplayFromStopPointDesignation: {
    displayName: "FRÅN HÅLLPLATSLÄGE",
    key: "FromStopPointDesignation",
  },
  journeysAttributesToDisplayToStopPointName: {
    displayName: "TILL HÅLLPLATSOMR",
    key: "ToStopPointName",
  },
  journeysAttributesToDisplayToStopPointDesignation: {
    displayName: "TILL HÅLLPLATSLÄGE",
    key: "ToStopPointDesignation",
    displayFormat: "YYYY-MM-DD hh:mm",
  },
  journeysAttributesToDisplayEarliestDepartureTimeAtToStopPoint: {
    displayName: "AVGÅNG",
    key: "EarliestDepartureTimeAtToStopPoint",
    displayFormat: "YYYY-MM-DD hh:mm",
  },
  routes: {
    searchLabel: "Linje",
    defaultSortAttribute: "InternalLineNumber",
    url: "",
  },
  routesAttributesToDisplayInternalLine: {
    displayName: "TEKNISK LINJE",
    key: "InternalLineNumber",
  },
  routesAttributesToDisplayPublicLine: {
    displayName: "PUBLIK LINJE",
    key: "PublicLineName",
  },
  routesAttributesToDisplayDescription: {
    displayName: "BESKRIVNING",
    key: "Description",
  },
  routesAttributesToDisplayDirection: {
    displayName: "RIKTNING",
    key: "Direction",
  },
  routesAttributesToDisplayTransportModeType: {
    displayName: "TRAFIKSLAG",
    key: "TransportModeType",
  },
  routesAttributesToDisplayTransportCompany: {
    displayName: "TRAFIKFÖRETAG",
    key: "TransportCompany",
  },
  stopAreas: {
    searchLabel: "Hållplatsomr",
    defaultSortAttribute: "StopAreaNumber",
    url: "",
  },
  stopAreasAttributesToDisplayStopAreaNumber: {
    displayName: "HÅLLPLATSNUMMER",
    key: "StopAreaNumber",
  },
  stopAreasAttributesToDisplayName: { displayName: "NAMN", key: "Name" },
  stopAreasAttributesToDisplayMunicipalityName: {
    displayName: "KOMMUN",
    key: "MunicipalityName",
  },
  stopAreasAttributesToDisplayInterchangePriorityMessage: {
    displayName: "BYTESPRIO",
    key: "InterchangePriorityMessage",
  },
  stopAreasAttributesToDisplayTariffZone1Name: {
    displayName: "TAXEZON 1",
    key: "TariffZone1Name",
  },
  stopAreasAttributesToDisplayTariffZone2Name: {
    displayName: "TAXEZON 2",
    key: "TariffZone2Name",
  },
  stopAreasAttributesToDisplayAbbreviation: {
    displayName: "KOD",
    key: "Abbreviation",
  },
  stopPoints: {
    searchLabel: "Hållplatslägen",
    defaultSortAttribute: "StopAreaNumber",
    url: "",
  },
  stopPointsAttributesToDisplayStopAreaNumber: {
    displayName: "HÅLLPLATSNUMMER",
    key: "StopAreaNumber",
  },
  stopPointsAttributesToDisplayName: { displayName: "NAMN", key: "Name" },
  stopPointsAttributesToDisplayDesignation: {
    displayName: "BETECKNING",
    key: "Designation",
  },
  stopPointsAttributesToDisplayIsForBoarding: {
    displayName: "PÅSTIGNING",
    key: "IsForBoarding",
  },
  stopPointsAttributesToDisplayIsForAlighting: {
    displayName: "AVSTIGNING",
    key: "IsForAlighting",
  },
  stopPointsAttributesToDisplayIsFictitious: {
    displayName: "VIRTUELLT",
    key: "IsFictitious",
  },
  stopPointsAttributesToDisplayMunicipalityName: {
    displayName: "KOMMUN",
    key: "MunicipalityName",
  },
  stopPointsAttributesToDisplayIsRegularTraffic: {
    displayName: "LINJETRAFIK",
    key: "IsRegularTraffic",
  },
  stopPointsAttributesToDisplayIsFlexibleBusService: {
    displayName: "FLEXLINJE",
    key: "IsFlexibleBusService",
  },
  stopPointsAttributesToDisplayIsFlexibleTaxiService: {
    displayName: "NÄRTRAFIK",
    key: "IsFlexibleTaxiService",
  },
  searchFillColor: {
    r: 255,
    g: 255,
    b: 255,
    a: 0,
  },
  searchStrokeColor: {
    r: 255,
    g: 255,
    b: 255,
    a: 0,
  },
  searchStrokePointWidth: 5,
  searchStrokeLineWidth: 2,
  highlightFillColor: {
    r: 255,
    g: 255,
    b: 255,
    a: 0,
  },
  highlightStrokeColor: {
    r: 255,
    g: 255,
    b: 255,
    a: 0,
  },
  highlightStrokePointWidth: 5,
  highlightStrokeLineWidth: 2,
};

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "vtsearch";
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        target: tool.options.target,
        abstract: tool.options.abstract,
        title: tool.options.title,
        position: tool.options.position,
        width: tool.options.width,
        height: tool.options.height,
        visibleAtStart: tool.options.visibleAtStart,
        searchStrokeColor:
          tool.options.mapColors.searchStrokeColor ||
          this.state.searchStrokeColor,
        searchFillColor:
          tool.options.mapColors.searchFillColor || this.state.searchFillColor,
        searchStrokePointWidth:
          tool.options.mapColors.searchStrokePointWidth ||
          this.state.searchStrokePointWidth,
        searchStrokeLineWidth:
          tool.options.mapColors.searchStrokeLineWidth ||
          this.state.searchStrokeLineWidth,
        highlightStrokeColor:
          tool.options.mapColors.highlightStrokeColor ||
          this.state.highlightStrokeColor,
        highlightFillColor:
          tool.options.mapColors.highlightFillColor ||
          this.state.highlightFillColor,
        highlightStrokePointWidth:
          tool.options.mapColors.highlightStrokePointWidth ||
          this.state.highlightStrokePointWidth,
        highlightStrokeLineWidth:
          tool.options.mapColors.highlightStrokeLineWidth ||
          this.state.highlightStrokeLineWidth,
        lineNumberAndPublicLineNumbers:
          tool.options.geoServer.lineNumberAndPublicLineNumbers ||
          this.state.lineNumberAndPublicLineNumbers,
        municipalityZoneNames:
          tool.options.geoServer.municipalityZoneNames ||
          this.state.municipalityZoneNames,
        stopAreaNameAndNumbers:
          tool.options.geoServer.stopAreaNameAndNumbers ||
          this.state.stopAreaNameAndNumbers,
        transportModeTypeNames:
          tool.options.geoServer.transportModeTypeNames ||
          this.state.transportModeTypeNames,
        journeys: tool.options.geoServer.journeys || this.state.journeys,
        routes: tool.options.geoServer.routes || this.state.routes,
        stopAreas: tool.options.geoServer.stopAreas || this.state.stopAreas,
        stopPoints: tool.options.geoServer.stopPoints || this.state.stopPoints,
      });
    } else {
      this.setState({
        active: false,
      });
    }
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
      [name]: value,
    });
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
      }
    });
  }

  save() {
    var tool = {
      type: this.type,
      index: this.state.index,
      options: {
        target: this.state.target,
        abstract: this.state.abstract,
        title: this.state.title,
        position: this.state.position,
        width: this.state.width,
        height: this.state.height,
        visibleAtStart: this.state.visibleAtStart,
        mapColors: {
          searchFillColor: this.state.searchFillColor,
          searchStrokeColor: this.state.searchStrokeColor,
          searchStrokePointWidth: this.state.searchStrokePointWidth,
          searchStrokeLineWidth: this.state.searchStrokeLineWidth,
          highlightFillColor: this.state.highlightFillColor,
          highlightStrokeColor: this.state.highlightStrokeColor,
          highlightStrokePointWidth: this.state.highlightStrokePointWidth,
          highlightStrokeLineWidth: this.state.highlightStrokeLineWidth,
        },
        geoServer: {
          lineNumberAndPublicLineNumbers: this.state
            .lineNumberAndPublicLineNumbers,
          municipalityZoneNames: this.state.municipalityZoneNames,
          stopAreaNameAndNumbers: this.state.stopAreaNameAndNumbers,
          transportModeTypeNames: this.state.transportModeTypeNames,
          journeys: this.state.journeys,
          routes: this.state.routes,
          stopAreas: this.state.stopAreas,
          stopPoints: this.state.stopPoints,
        },
      },
    };

    var existing = this.getTool();

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
  }

  /**
   * Infoclick's stroke and fill color are set by the React
   * color picker. This method handles change event for those
   * two color pickers.
   *
   * @param {*} target
   * @param {*} color
   */
  handleColorChange = (target, color) => {
    this.setState({ [target]: color.rgb });
  };

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
            <label htmlFor="title">
              Titel{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Rubrik som visas i infoclick-fönstret"
              />
            </label>
            <input
              id="title"
              name="title"
              placeholder={defaultState.title}
              type="text"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.title}
            />
          </div>
          <div>
            <label htmlFor="abstract">Beskrivning </label>
            <input
              value={this.state.abstract}
              type="text"
              name="abstract"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
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
          <div className="separator">
            Inställningar färger sökresultat i kartan
          </div>
          <div className="clearfix">
            <span className="pull-left">
              <div>
                <label className="long-label" htmlFor="searchColorFillColor">
                  Färg på sökresultates fyllnad (rgba)
                </label>
              </div>
              <div>
                <SketchPicker
                  color={{
                    r: this.state.searchFillColor.r,
                    g: this.state.searchFillColor.g,
                    b: this.state.searchFillColor.b,
                    a: this.state.searchFillColor.a,
                  }}
                  onChangeComplete={(color) =>
                    this.handleColorChange("searchFillColor", color)
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "100px" }}>
              <div>
                <label className="long-label" htmlFor="searchColorStrokeColor">
                  Färg på sökresultates ram (rgba)
                </label>
              </div>
              <div>
                <SketchPicker
                  color={{
                    r: this.state.searchStrokeColor.r,
                    g: this.state.searchStrokeColor.g,
                    b: this.state.searchStrokeColor.b,
                    a: this.state.searchStrokeColor.a,
                  }}
                  onChangeComplete={(color) =>
                    this.handleColorChange("searchStrokeColor", color)
                  }
                />
              </div>
            </span>
          </div>
          <div>
            <label htmlFor="searchStrokePointWidth">
              Sökfärgens punktstorlek
            </label>
            <input
              id="searchStrokePointWidth"
              name="searchStrokePointWidth"
              placeholder={defaultState.searchStrokePointWidth}
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.searchStrokePointWidth}
            />
          </div>
          <div>
            <label htmlFor="searchStrokeLineWidth">Sökfärgens linjebredd</label>
            <input
              id="searchStrokeLineWidth"
              name="searchStrokeLineWidth"
              placeholder={defaultState.searchStrokeLineWidth}
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.searchStrokeLineWidth || ""}
            />
          </div>
          <div className="separator">
            Inställningar färger markerat sökresultat i kartan
          </div>
          <div className="clearfix">
            <span className="pull-left">
              <div>
                <label className="long-label" htmlFor="highlightFillColor">
                  Färg på markeringens fyllnad (rgba)
                </label>
              </div>
              <div>
                <SketchPicker
                  color={{
                    r: this.state.highlightFillColor.r,
                    g: this.state.highlightFillColor.g,
                    b: this.state.highlightFillColor.b,
                    a: this.state.highlightFillColor.a,
                  }}
                  onChangeComplete={(color) =>
                    this.handleColorChange("highlightFillColor", color)
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "100px" }}>
              <div>
                <label className="long-label" htmlFor="highlightStrokeColor">
                  Färg på markringens ram (rgba)
                </label>
              </div>
              <div>
                <SketchPicker
                  color={{
                    r: this.state.highlightStrokeColor.r,
                    g: this.state.highlightStrokeColor.g,
                    b: this.state.highlightStrokeColor.b,
                    a: this.state.highlightStrokeColor.a,
                  }}
                  onChangeComplete={(color) =>
                    this.handleColorChange("highlightStrokeColor", color)
                  }
                />
              </div>
            </span>
          </div>
          <div>
            <label htmlFor="highlightStrokePointWidth">
              Markeringsfärgens punktstorlek
            </label>
            <input
              id="highlightStrokePointWidth"
              name="highlightStrokePointWidth"
              placeholder={defaultState.highlightStrokePointWidth}
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.highlightStrokePointWidth || ""}
            />
          </div>
          <div>
            <label htmlFor="highlightStrokeLineWidth">
              Markeringsfärgens linjebredd
            </label>
            <input
              id="highlightStrokeLineWidth"
              name="highlightStrokeLineWidth"
              placeholder={defaultState.highlightStrokeLineWidth}
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.highlightStrokeLineWidth || ""}
            />
          </div>
          <div className="separator">Inställningar GeoServer</div>
          <div>
            <label htmlFor="lineNumberAndPublicLineNumbersSearchLabel">
              Linjenummer rubrik
            </label>
            <input
              value={this.state.lineNumberAndPublicLineNumbers.searchLabel}
              type="text"
              placeholder={
                defaultState.lineNumberAndPublicLineNumbers.searchLabel
              }
              name="lineNumberAndPublicLineNumbersSearchLabel"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="lineNumberAndPublicLineNumbersUrl">
              Linjenummer URL
            </label>
            <input
              value={this.state.lineNumberAndPublicLineNumbers.url}
              type="text"
              placeholder={defaultState.lineNumberAndPublicLineNumbers.url}
              name="lineNumberAndPublicLineNumbersUrl"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="municipalityZoneNamesSearchLabel">
              Kommun rubrik
            </label>
            <input
              value={this.state.municipalityZoneNames.searchLabel}
              type="text"
              placeholder={defaultState.municipalityZoneNames.searchLabel}
              name="municipalityZoneNamesSearchLabel"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="municipalityZoneNamesUrl">Kommun URL</label>
            <input
              value={this.state.municipalityZoneNames.url}
              type="text"
              placeholder={defaultState.municipalityZoneNames.url}
              name="municipalityZoneNamesUrl"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreaNameAndNumbersSearchLabel">
              Hållplats rubrik
            </label>
            <input
              value={this.state.stopAreaNameAndNumbers.searchLabel}
              type="text"
              placeholder={defaultState.stopAreaNameAndNumbers.searchLabel}
              name="stopAreaNameAndNumbersSearchLabel"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreaNameAndNumbersDefaultSortAttribute">
              Hållplats sorting atribut
            </label>
            <input
              value={this.state.stopAreaNameAndNumbers.defaultSortAttribute}
              type="text"
              placeholder={
                defaultState.stopAreaNameAndNumbers.defaultSortAttribute
              }
              name="stopAreaNameAndNumbersDefaultSortAttribute"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreaNameAndNumbersUrl">Hållplats URL</label>
            <input
              value={this.state.stopAreaNameAndNumbers.url}
              type="text"
              placeholder={defaultState.stopAreaNameAndNumbers.url}
              name="stopAreaNameAndNumbersUrl"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="transportModeTypeNamesSearchLabel">
              Trafikslag rubrik
            </label>
            <input
              value={this.state.transportModeTypeNames.searchLabel}
              type="text"
              placeholder={defaultState.transportModeTypeNames.searchLabel}
              name="transportModeTypeNamesSearchLabel"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="transportModeTypeNamesUrl">Trafikslag URL</label>
            <input
              value={this.state.transportModeTypeNames.url}
              type="text"
              placeholder={defaultState.transportModeTypeNames.url}
              name="transportModeTypeNamesUrl"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div className="separator">Inställningar Turer GeoServer</div>
          <div>
            <label htmlFor="journeysSearchLabel">Rubrik</label>
            <input
              value={this.state.journeys.searchLabel}
              type="text"
              placeholder={defaultState.journeys.searchLabel}
              name="journeysSearchLabel"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysDefaultSortAttribute">
              Sorting atribut
            </label>
            <input
              value={this.state.journeys.defaultSortAttribute}
              type="text"
              placeholder={defaultState.journeys.defaultSortAttribute}
              name="journeysDefaultSortAttribute"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysUrl">URL</label>
            <input
              value={this.state.journeys.url}
              type="text"
              placeholder={defaultState.journeys.url}
              name="journeysUrl"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div align="center">
            <label htmlFor="journeysAttributesToDisplay">
              Atributer som visas
            </label>
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayInternalLineName">
              Teknisk linije namn
            </label>
            <input
              value={
                this.state.journeysAttributesToDisplayInternalLine.displayName
              }
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayInternalLine.displayName
              }
              name="journeysAttributesToDisplayInternalLineName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayInternalLineKey">
              Teknisk linije nyckel
            </label>
            <input
              value={this.state.journeysAttributesToDisplayInternalLine.key}
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayInternalLine.key
              }
              name="journeysAttributesToDisplayInternalLineKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayPublicLineName">
              Publik linije namn
            </label>
            <input
              value={
                this.state.journeysAttributesToDisplayPublicLine.displayName
              }
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayPublicLine.displayName
              }
              name="journeysAttributesToDisplayPublicLineName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayPublicLineKey">
              Publik linije nyckel
            </label>
            <input
              value={this.state.journeysAttributesToDisplayPublicLine.key}
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayPublicLine.key
              }
              name="journeysAttributesToDisplayPublicLineKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayTransportCompanyName">
              Trafikföretag namn
            </label>
            <input
              value={
                this.state.journeysAttributesToDisplayTransportCompany
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayTransportCompany
                  .displayName
              }
              name="journeysAttributesToDisplayTransportCompanyName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayTransportCompanyKey">
              Trafikföretag nyckel
            </label>
            <input
              value={this.state.journeysAttributesToDisplayTransportCompany.key}
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayTransportCompany.key
              }
              name="journeysAttributesToDisplayTransportCompanyKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayFromStopPointNameName">
              Från hållplatsomr
            </label>
            <input
              value={
                this.state.journeysAttributesToDisplayFromStopPointName
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayFromStopPointName
                  .displayName
              }
              name="journeysAttributesToDisplayFromStopPointNameName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayFromStopPointNameKey">
              Från hållplatsomr nyckel
            </label>
            <input
              value={
                this.state.journeysAttributesToDisplayFromStopPointName.key
              }
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayFromStopPointName.key
              }
              name="journeysAttributesToDisplayFromStopPointNameKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayFromStopPointDesignationName">
              Från hållplatsläge
            </label>
            <input
              value={
                this.state.journeysAttributesToDisplayFromStopPointDesignation
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayFromStopPointDesignation
                  .displayName
              }
              name="journeysAttributesToDisplayFromStopPointDesignationName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayFromStopPointDesignationKey">
              Från hållplatsläge nyckel
            </label>
            <input
              value={
                this.state.journeysAttributesToDisplayFromStopPointDesignation
                  .key
              }
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayFromStopPointDesignation
                  .key
              }
              name="journeysAttributesToDisplayFromStopPointDesignationKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayToStopPointNameName">
              Till hållplatsomr namn
            </label>
            <input
              value={
                this.state.journeysAttributesToDisplayToStopPointName
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayToStopPointName
                  .displayName
              }
              name="journeysAttributesToDisplayToStopPointNameName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayToStopPointNameKey">
              Till hållplatsomr nyckel
            </label>
            <input
              value={this.state.journeysAttributesToDisplayToStopPointName.key}
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayToStopPointName.key
              }
              name="journeysAttributesToDisplayToStopPointNameKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayToStopPointDesignationName">
              Till hållplatsläge namn
            </label>
            <input
              value={
                this.state.journeysAttributesToDisplayToStopPointDesignation
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayToStopPointDesignation
                  .displayName
              }
              name="journeysAttributesToDisplayToStopPointDesignationName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayToStopPointDesignationKey">
              Till hållplatsläge nyckel
            </label>
            <input
              value={
                this.state.journeysAttributesToDisplayToStopPointDesignation.key
              }
              type="text"
              placeholder={
                defaultState.journeysAttributesToDisplayToStopPointDesignation
                  .key
              }
              name="journeysAttributesToDisplayToStopPointDesignationKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayEarliestDepartureTimeAtToStopPointName">
              Avgång
            </label>
            <input
              value={
                this.state
                  .journeysAttributesToDisplayEarliestDepartureTimeAtToStopPoint
                  .displayName
              }
              type="text"
              placeholder={
                defaultState
                  .journeysAttributesToDisplayEarliestDepartureTimeAtToStopPoint
                  .displayName
              }
              name="journeysAttributesToDisplayEarliestDepartureTimeAtToStopPointName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayEarliestDepartureTimeAtToStopPointKey">
              Avgång nyckel
            </label>
            <input
              value={
                this.state
                  .journeysAttributesToDisplayEarliestDepartureTimeAtToStopPoint
                  .key
              }
              type="text"
              placeholder={
                defaultState
                  .journeysAttributesToDisplayEarliestDepartureTimeAtToStopPoint
                  .key
              }
              name="journeysAttributesToDisplayEarliestDepartureTimeAtToStopPointKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="journeysAttributesToDisplayEarliestDepartureTimeAtToStopPointFormat">
              Avgång format
            </label>
            <input
              value={
                this.state
                  .journeysAttributesToDisplayEarliestDepartureTimeAtToStopPoint
                  .displayFormat
              }
              type="text"
              placeholder={
                defaultState
                  .journeysAttributesToDisplayEarliestDepartureTimeAtToStopPoint
                  .displayFormat
              }
              name="journeysAttributesToDisplayEarliestDepartureTimeAtToStopPointFormat"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div className="separator">Inställningar Linjer GeoServer</div>
          <div>
            <label htmlFor="routesSearchLabel">Rubrik</label>
            <input
              value={this.state.routes.searchLabel}
              type="text"
              placeholder={defaultState.routes.searchLabel}
              name="routesSearchLabel"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesDefaultSortAttribute">Sorting atribut</label>
            <input
              value={this.state.routes.defaultSortAttribute}
              type="text"
              placeholder={defaultState.routes.defaultSortAttribute}
              name="routesDefaultSortAttribute"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesUrl">URL</label>
            <input
              value={this.state.routes.url}
              type="text"
              placeholder={defaultState.routes.url}
              name="routesUrl"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div align="center">
            <label htmlFor="routesAttributesToDisplay">
              Atributer som visas
            </label>
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayInternalLineName">
              Teknisk linije namn
            </label>
            <input
              value={
                this.state.routesAttributesToDisplayInternalLine.displayName
              }
              type="text"
              placeholder={
                defaultState.routesAttributesToDisplayInternalLine.displayName
              }
              name="routesAttributesToDisplayInternalLineName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayInternalLineKey">
              Teknisk linije nyckel
            </label>
            <input
              value={this.state.routesAttributesToDisplayInternalLine.key}
              type="text"
              placeholder={
                defaultState.routesAttributesToDisplayInternalLine.key
              }
              name="routesAttributesToDisplayInternalLineKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayPublicLineName">
              Publik linije namn
            </label>
            <input
              value={this.state.routesAttributesToDisplayPublicLine.displayName}
              type="text"
              placeholder={
                defaultState.routesAttributesToDisplayPublicLine.displayName
              }
              name="routesAttributesToDisplayPublicLineName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayPublicLineKey">
              Publik linije nyckel
            </label>
            <input
              value={this.state.routesAttributesToDisplayPublicLine.key}
              type="text"
              placeholder={defaultState.routesAttributesToDisplayPublicLine.key}
              name="routesAttributesToDisplayPublicLineKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayDescriptionName">
              Beskrivning namn
            </label>
            <input
              value={
                this.state.routesAttributesToDisplayDescription.displayName
              }
              type="text"
              placeholder={
                defaultState.routesAttributesToDisplayDescription.displayName
              }
              name="routesAttributesToDisplayDescriptionName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayDescriptionKey">
              Beskrivning nyckel
            </label>
            <input
              value={this.state.routesAttributesToDisplayDescription.key}
              type="text"
              placeholder={
                defaultState.routesAttributesToDisplayDescription.key
              }
              name="routesAttributesToDisplayDescriptionKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayDirectionName">
              Riktning namn
            </label>
            <input
              value={this.state.routesAttributesToDisplayDirection.displayName}
              type="text"
              placeholder={
                defaultState.routesAttributesToDisplayDirection.displayName
              }
              name="routesAttributesToDisplayDirectionName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayDirectionKey">
              Riktning nyckel
            </label>
            <input
              value={this.state.routesAttributesToDisplayDirection.key}
              type="text"
              placeholder={defaultState.routesAttributesToDisplayDirection.key}
              name="routesAttributesToDisplayDirectionKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayTransportModeTypeName">
              Trafikslag namn
            </label>
            <input
              value={
                this.state.routesAttributesToDisplayTransportModeType
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.routesAttributesToDisplayTransportModeType
                  .displayName
              }
              name="routesAttributesToDisplayTransportModeTypeName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayTransportModeTypeKey">
              Trafikslag nyckel
            </label>
            <input
              value={this.state.routesAttributesToDisplayTransportModeType.key}
              type="text"
              placeholder={
                defaultState.routesAttributesToDisplayTransportModeType.key
              }
              name="routesAttributesToDisplayTransportModeTypeKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayTransportCompanyName">
              Trafikföretag namn
            </label>
            <input
              value={
                this.state.routesAttributesToDisplayTransportCompany.displayName
              }
              type="text"
              placeholder={
                defaultState.routesAttributesToDisplayTransportCompany
                  .displayName
              }
              name="routesAttributesToDisplayTransportCompanyName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="routesAttributesToDisplayTransportCompanyKey">
              Trafikföretag nyckel
            </label>
            <input
              value={this.state.routesAttributesToDisplayTransportCompany.key}
              type="text"
              placeholder={
                defaultState.routesAttributesToDisplayTransportCompany.key
              }
              name="routesAttributesToDisplayTransportCompanyKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div className="separator">
            Inställningar Hållplatsområden GeoServer
          </div>
          <div>
            <label htmlFor="stopAreasSearchLabel">Rubrik</label>
            <input
              value={this.state.stopAreas.searchLabel}
              type="text"
              placeholder={defaultState.stopAreas.searchLabel}
              name="stopAreasSearchLabel"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasDefaultSortAttribute">
              Sorting atribut
            </label>
            <input
              value={this.state.stopAreas.defaultSortAttribute}
              type="text"
              placeholder={defaultState.stopAreas.defaultSortAttribute}
              name="stopAreasDefaultSortAttribute"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasUrl">URL</label>
            <input
              value={this.state.stopAreas.url}
              type="text"
              placeholder={defaultState.stopAreas.url}
              name="stopAreasUrl"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div align="center">
            <label htmlFor="stopAreasAttributesToDisplay">
              Atributer som visas
            </label>
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayStopAreaNumberName">
              Hållplatsnummer namn
            </label>
            <input
              value={
                this.state.stopAreasAttributesToDisplayStopAreaNumber
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.stopAreasAttributesToDisplayStopAreaNumber
                  .displayName
              }
              name="stopAreasAttributesToDisplayStopAreaNumberName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayStopAreaNumberKey">
              Hållplatsnummer nyckel
            </label>
            <input
              value={this.state.stopAreasAttributesToDisplayStopAreaNumber.key}
              type="text"
              placeholder={
                defaultState.stopAreasAttributesToDisplayStopAreaNumber.key
              }
              name="stopAreasAttributesToDisplayStopAreaNumberKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayNameName">Namn</label>
            <input
              value={this.state.stopAreasAttributesToDisplayName.displayName}
              type="text"
              placeholder={
                defaultState.stopAreasAttributesToDisplayName.displayName
              }
              name="stopAreasAttributesToDisplayNameName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayNameKey">
              Namn nyckel
            </label>
            <input
              value={this.state.stopAreasAttributesToDisplayName.key}
              type="text"
              placeholder={defaultState.stopAreasAttributesToDisplayName.key}
              name="stopAreasAttributesToDisplayNameKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayMunicipalityNameName">
              Beskrivning namn
            </label>
            <input
              value={
                this.state.stopAreasAttributesToDisplayMunicipalityName
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.stopAreasAttributesToDisplayMunicipalityName
                  .displayName
              }
              name="stopAreasAttributesToDisplayMunicipalityNameName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayMunicipalityNameKey">
              Beskrivning nyckel
            </label>
            <input
              value={
                this.state.stopAreasAttributesToDisplayMunicipalityName.key
              }
              type="text"
              placeholder={
                defaultState.stopAreasAttributesToDisplayMunicipalityName.key
              }
              name="stopAreasAttributesToDisplayMunicipalityNameKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayInterchangePriorityMessageName">
              Riktning namn
            </label>
            <input
              value={
                this.state
                  .stopAreasAttributesToDisplayInterchangePriorityMessage
                  .displayName
              }
              type="text"
              placeholder={
                defaultState
                  .stopAreasAttributesToDisplayInterchangePriorityMessage
                  .displayName
              }
              name="stopAreasAttributesToDisplayInterchangePriorityMessageName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayInterchangePriorityMessageKey">
              Riktning nyckel
            </label>
            <input
              value={
                this.state
                  .stopAreasAttributesToDisplayInterchangePriorityMessage.key
              }
              type="text"
              placeholder={
                defaultState
                  .stopAreasAttributesToDisplayInterchangePriorityMessage.key
              }
              name="stopAreasAttributesToDisplayInterchangePriorityMessageKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayTariffZone1NameName">
              Taxezon 1 namn
            </label>
            <input
              value={
                this.state.stopAreasAttributesToDisplayTariffZone1Name
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.stopAreasAttributesToDisplayTariffZone1Name
                  .displayName
              }
              name="stopAreasAttributesToDisplayTariffZone1NameName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayTariffZone1NameKey">
              Taxezon 1 nyckel
            </label>
            <input
              value={this.state.stopAreasAttributesToDisplayTariffZone1Name.key}
              type="text"
              placeholder={
                defaultState.stopAreasAttributesToDisplayTariffZone1Name.key
              }
              name="stopAreasAttributesToDisplayTariffZone1NameKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayTariffZone2NameName">
              Taxezon 2 namn
            </label>
            <input
              value={
                this.state.stopAreasAttributesToDisplayTariffZone2Name
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.stopAreasAttributesToDisplayTariffZone2Name
                  .displayName
              }
              name="stopAreasAttributesToDisplayTariffZone2NameName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayTariffZone2NameKey">
              Taxezon 2 nyckel
            </label>
            <input
              value={this.state.stopAreasAttributesToDisplayTariffZone2Name.key}
              type="text"
              placeholder={
                defaultState.stopAreasAttributesToDisplayTariffZone2Name.key
              }
              name="stopAreasAttributesToDisplayTariffZone2NameKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayAbbreviationName">
              Kod namn
            </label>
            <input
              value={
                this.state.stopAreasAttributesToDisplayAbbreviation.displayName
              }
              type="text"
              placeholder={
                defaultState.stopAreasAttributesToDisplayAbbreviation
                  .displayName
              }
              name="stopAreasAttributesToDisplayAbbreviationName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopAreasAttributesToDisplayAbbreviationKey">
              Kod nyckel
            </label>
            <input
              value={this.state.stopAreasAttributesToDisplayAbbreviation.key}
              type="text"
              placeholder={
                defaultState.stopAreasAttributesToDisplayAbbreviation.key
              }
              name="stopAreasAttributesToDisplayAbbreviationKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div className="separator">
            Inställningar Hållplatslägen GeoServer
          </div>
          <div>
            <label htmlFor="stopPointsSearchLabel">Rubrik</label>
            <input
              value={this.state.stopPoints.searchLabel}
              type="text"
              placeholder={defaultState.stopPoints.searchLabel}
              name="stopPointsSearchLabel"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsDefaultSortAttribute">
              Sorting atribut
            </label>
            <input
              value={this.state.stopPoints.defaultSortAttribute}
              type="text"
              placeholder={defaultState.stopPoints.defaultSortAttribute}
              name="stopPointsDefaultSortAttribute"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsUrl">URL</label>
            <input
              value={this.state.stopPoints.url}
              type="text"
              placeholder={defaultState.stopPoints.url}
              name="stopPointsUrl"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div align="center">
            <label htmlFor="stopPointsAttributesToDisplay">
              Atributer som visas
            </label>
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayStopAreaNumberName">
              Hållplatsnummer namn
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayStopAreaNumber
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayStopAreaNumber
                  .displayName
              }
              name="stopPointsAttributesToDisplayStopAreaNumberName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayStopAreaNumberKey">
              Hållplatsnummer nyckel
            </label>
            <input
              value={this.state.stopPointsAttributesToDisplayStopAreaNumber.key}
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayStopAreaNumber.key
              }
              name="stopPointsAttributesToDisplayStopAreaNumberKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayNameName">Namn</label>
            <input
              value={this.state.stopPointsAttributesToDisplayName.displayName}
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayName.displayName
              }
              name="stopPointsAttributesToDisplayNameName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayNameKey">
              Namn nyckel
            </label>
            <input
              value={this.state.stopPointsAttributesToDisplayName.key}
              type="text"
              placeholder={defaultState.stopPointsAttributesToDisplayName.key}
              name="stopPointsAttributesToDisplayNameKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayDesignationName">
              Beteckning namn
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayDesignation.displayName
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayDesignation
                  .displayName
              }
              name="stopPointsAttributesToDisplayDesignationName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayDesignationKey">
              Beteckning nyckel
            </label>
            <input
              value={this.state.stopPointsAttributesToDisplayDesignation.key}
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayDesignation.key
              }
              name="stopPointsAttributesToDisplayDesignationKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsForBoardingName">
              Påstigning namn
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayIsForBoarding
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsForBoarding
                  .displayName
              }
              name="stopPointsAttributesToDisplayIsForBoardingName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsForBoardingKey">
              Påstigning nyckel
            </label>
            <input
              value={this.state.stopPointsAttributesToDisplayIsForBoarding.key}
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsForBoarding.key
              }
              name="stopPointsAttributesToDisplayIsForBoardingKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsForAlightingName">
              Avstigning namn
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayIsForAlighting
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsForAlighting
                  .displayName
              }
              name="stopPointsAttributesToDisplayIsForAlightingName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsForAlightingKey">
              Avstigning nyckel
            </label>
            <input
              value={this.state.stopPointsAttributesToDisplayIsForAlighting.key}
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsForAlighting.key
              }
              name="stopPointsAttributesToDisplayIsForAlightingKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsFictitiousName">
              Virtuellt namn
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayIsFictitious.displayName
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsFictitious
                  .displayName
              }
              name="stopPointsAttributesToDisplayIsFictitiousName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsFictitiousKey">
              Virtuellt nyckel
            </label>
            <input
              value={this.state.stopPointsAttributesToDisplayIsFictitious.key}
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsFictitious.key
              }
              name="stopPointsAttributesToDisplayIsFictitiousKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayMunicipalityNameName">
              Kommun namn
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayMunicipalityName
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayMunicipalityName
                  .displayName
              }
              name="stopPointsAttributesToDisplayMunicipalityNameName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayMunicipalityNameKey">
              Kommun nyckel
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayMunicipalityName.key
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayMunicipalityName.key
              }
              name="stopPointsAttributesToDisplayMunicipalityNameKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsRegularTrafficName">
              Linjetrafik namn
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayIsRegularTraffic
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsRegularTraffic
                  .displayName
              }
              name="stopPointsAttributesToDisplayIsRegularTrafficName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsRegularTrafficKey">
              Linjetrafik nyckel
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayIsRegularTraffic.key
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsRegularTraffic.key
              }
              name="stopPointsAttributesToDisplayIsRegularTrafficKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsFlexibleBusServiceName">
              Flexlinje namn
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayIsFlexibleBusService
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsFlexibleBusService
                  .displayName
              }
              name="stopPointsAttributesToDisplayIsFlexibleBusServiceName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsFlexibleBusServiceKey">
              Flexlinje nyckel
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayIsFlexibleBusService.key
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsFlexibleBusService
                  .key
              }
              name="stopPointsAttributesToDisplayIsFlexibleBusServiceKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsFlexibleTaxiServiceName">
              Närtrafik namn
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayIsFlexibleTaxiService
                  .displayName
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsFlexibleTaxiService
                  .displayName
              }
              name="stopPointsAttributesToDisplayIsFlexibleTaxiServiceName"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="stopPointsAttributesToDisplayIsFlexibleTaxiServiceKey">
              Närtrafik nyckel
            </label>
            <input
              value={
                this.state.stopPointsAttributesToDisplayIsFlexibleTaxiService
                  .key
              }
              type="text"
              placeholder={
                defaultState.stopPointsAttributesToDisplayIsFlexibleTaxiService
                  .key
              }
              name="stopPointsAttributesToDisplayIsFlexibleTaxiServiceKey"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div className="separator"></div>
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
        </form>
      </div>
    );
  }
}

export default ToolOptions;
