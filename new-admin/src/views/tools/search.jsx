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
import Tree from "../tree.jsx";
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

/**
 * I've removed the following from defaultState and save:
 * target, toolbar, onMap, bothSynlig, enableViewTogglePopupInSnabbsok,
 * selectionTools, base64Encode, instruction, filterVisible, displayPopup,
 * maxZoom, excelExportUrl, kmlExportUrl, anchorX, anchorY, imgSizeX,
 * imgSizeY, toolDescription, popupOffsetY
 *
 * I'm leaving this comment for documentation purposes. I'll do a coupe of
 * checks to ensure these are not used anywhere else in the code. If they are
 * that code might as well be removed too.
 */
const defaultState = {
  // State variables that are used in save()
  active: false,
  index: 0,

  anchorX: 0.5,
  anchorY: 1,
  scale: 0.15,
  src: "",
  strokeColor: { r: 244, g: 83, b: 63, a: 1 },
  strokeWidth: 4,
  fillColor: { r: 244, g: 83, b: 63, a: 0.2 },

  polygonSearch: false,
  radiusSearch: false,
  autoHideSearchResults: false,
  selectionSearch: false,
  // searchSettings: false, // Currently not implemented in client either, though stub exists
  tooltip: "Sök...",
  searchWithinButtonText: "Markera i kartan",
  maxFeatures: 100,
  delayBeforeAutoSearch: 500,
  layers: [],
  visibleForGroups: [],

  // Only local state, not used in save()
  validationErrors: [],
  searchableLayers: {},
  tree: ""
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "search";

    this.handleAddSearchable = this.handleAddSearchable.bind(this);
    this.loadLayers = this.loadLayers.bind(this);
  }

  componentDidMount() {
    this.loadSearchableLayers();

    var tool = this.getTool();
    if (tool) {
      this.setState(
        {
          active: true,
          index: tool.index,

          anchorX:
            (tool.options.anchor && tool.options.anchor[0]) ||
            this.state.anchorX,
          anchorY:
            (tool.options.anchor && tool.options.anchor[1]) ||
            this.state.anchorY,
          scale: tool.options.scale || this.state.scale,
          src: tool.options.src,
          strokeColor: tool.options.strokeColor || this.state.strokeColor,
          strokeWidth: tool.options.strokeWidth || this.state.strokeWidth,
          fillColor: tool.options.fillColor || this.state.fillColor,

          polygonSearch: tool.options.polygonSearch,
          radiusSearch: tool.options.radiusSearch,
          selectionSearch: tool.options.selectionSearch,
          autoHideSearchResults: tool.options.autoHideSearchResults,
          // searchSettings: tool.options.searchSettings,
          tooltip: tool.options.tooltip || this.state.tooltip,
          searchWithinButtonText:
            tool.options.searchWithinButtonText ||
            this.state.searchWithinButtonText,
          maxFeatures: tool.options.maxFeatures || this.state.maxFeatures,
          delayBeforeAutoSearch:
            tool.options.delayBeforeAutoSearch ||
            this.state.delayBeforeAutoSearch,
          selectedSources: tool.options.selectedSources
            ? tool.options.selectedSources
            : [],

          layers: tool.options.layers ? tool.options.layers : [],
          visibleForGroups: tool.options.visibleForGroups
            ? tool.options.visibleForGroups
            : []
        },
        () => {
          this.loadLayers();
          this.loadSources();
        }
      );
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

    if (typeof childRefs !== "undefined") {
      for (let i of ids) {
        childRefs["cb_" + i.id] && (childRefs["cb_" + i.id].checked = true);
        childRefs[i.id] && (childRefs[i.id].hidden = false);
        childRefs[i.id] && (childRefs[i.id].value = i.visibleForGroups.join());
      }
    }
  }

  handleInputChange(event) {
    var t = event.target;
    var name = t.name;
    var value = t.type === "checkbox" ? t.checked : t.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }
    this.setState({
      [name]: value
    });
  }

  loadSearchableLayers() {
    this.props.model.getConfig(
      this.props.model.get("config").url_layers,
      layers => {
        this.setState({
          searchableLayers: layers.wfslayers
        });

        this.setState({
          tree: (
            <Tree
              model={this}
              layers={this.state.searchableLayers}
              handleAddSearchable={this.handleAddSearchable}
              loadLayers={this.loadLayers}
              authActive={this.props.parent.props.parent.state.authActive}
            />
          )
        });
      }
    );
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
        anchor: [this.state.anchorX, this.state.anchorY],
        scale: this.state.scale,
        src: this.state.src,
        strokeColor: this.state.strokeColor,
        strokeWidth: this.state.strokeWidth,
        fillColor: this.state.fillColor,

        polygonSearch: this.state.polygonSearch,
        radiusSearch: this.state.radiusSearch,
        autoHideSearchResults: this.state.autoHideSearchResults,
        selectionSearch: this.state.selectionSearch,
        // searchSettings: this.state.searchSettings,
        tooltip: this.state.tooltip,
        searchWithinButtonText: this.state.searchWithinButtonText,
        maxFeatures: this.state.maxFeatures,
        delayBeforeAutoSearch: this.state.delayBeforeAutoSearch,
        selectedSources: this.state.selectedSources
          ? this.state.selectedSources
          : [],
        layers: this.state.layers ? this.state.layers : [],
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
    const t = event.target;
    const value = t.value;
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
        <>
          <div className="separator">Behörighetsstyrning för verktyget</div>
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
        </>
      );
    } else {
      return null;
    }
  }
  /**
   * anropas från tree.jsx som eventhandler. Hantering för checkboxar och
   * inmatning av AD-grupper för wfs:er
   * @param {*} e
   * @param {*} layer
   */
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
        let newArray = this.state.layers.filter(
          o => o.id !== layer.id.toString()
        );

        this.setState({
          layers: newArray
        });
      }
    }
    if (e.target.type.toLowerCase() === "text") {
      let obj = this.state.layers.find(o => o.id === layer.id.toString());
      let newArray = this.state.layers.filter(
        o => o.id !== layer.id.toString()
      );

      // Skapar array och trimmar whitespace från start och slut av varje cell
      if (typeof obj !== "undefined") {
        obj.visibleForGroups = e.target.value.split(",");
        obj.visibleForGroups = obj.visibleForGroups.map(el => el.trim());
      }

      newArray.push(obj);

      // Sätter visibleForGroups till [] istället för [""] om inputfältet är tomt.
      if (newArray.length === 1) {
        if (
          newArray[0].visibleForGroups.length === 1 &&
          newArray[0].visibleForGroups[0] === ""
        ) {
          newArray[0].visibleForGroups = [];
        }
      }

      this.setState({
        layers: newArray
      });
    }
  }

  flattern(groups) {
    return groups.reduce((i, group) => {
      var layers = [];
      if (group.groups.length !== 0) {
        layers = [...this.flattern(group.groups)];
      }
      return [...i, ...group.layers, ...layers];
    }, []);
  }

  lookup(layerId, layersConfig) {
    var found = undefined;
    var layerTypes = Object.keys(layersConfig);
    for (let i = 0; i < layerTypes.length; i++) {
      for (let j = 0; j < layersConfig[layerTypes[i]].length; j++) {
        if (Number(layersConfig[layerTypes[i]][j].id) === Number(layerId)) {
          found = layersConfig[layerTypes[i]][j].caption;
          break;
        }
      }
      if (found) {
        break;
      }
    }
    return found;
  }

  loadSources = () => {
    var urlLayers = this.props.model.get("config").url_layers;
    this.props.model.getConfig(urlLayers, layersConfig => {
      var layers = this.flattern(
        this.props.model.get("layerMenuConfig").groups
      );

      layers = layers.map(layer => {
        return {
          id: layer.id,
          name: this.lookup(layer.id, layersConfig)
        };
      });

      this.setState({
        sources: layers
      });
    });
  };

  selectedSourceChange = (id, checked) => e => {
    var selectedSources = checked
      ? this.state.selectedSources.filter(
          selectedSource => selectedSource !== id
        )
      : [id, ...this.state.selectedSources];

    this.setState({
      selectedSources: selectedSources
    });
  };

  renderSources(sources) {
    if (!sources) return null;
    return (
      <ul>
        {sources.map((source, i) => {
          var id = "layer_" + source.id;
          var checked = this.state.selectedSources.some(id => id === source.id);
          return (
            <li key={i}>
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={this.selectedSourceChange(source.id, checked)}
              />
              &nbsp;
              <label htmlFor={id}>{source.name}</label>
            </li>
          );
        })}
      </ul>
    );
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
          {/* Currently unused as Search isn't rendered among other buttons - no need to sort
          <div className="separator">Fönsterinställningar</div>
          <div>
            <label htmlFor="index">Sorteringsordning</label>
            <input
              id="index"
              name="index"
              type="number"
              min="0"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.index}
            />
          </div> */}
          <div className="separator">Generella sökinställningar</div>
          <div>
            <label htmlFor="tooltip">Placeholdertext för sökrutan</label>
            <input
              value={this.state.tooltip}
              type="text"
              name="tooltip"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="maxFeatures">Max antal sökträffar</label>
            <input
              value={this.state.maxFeatures}
              type="number"
              min="0"
              step="10"
              name="maxFeatures"
              className="control-fixed-width"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="delayBeforeAutoSearch">
              Fördröjning innan autosök (i millisekunder)
            </label>
            <input
              value={this.state.delayBeforeAutoSearch}
              type="number"
              min="0"
              max="5000"
              step="100"
              name="delayBeforeAutoSearch"
              className="control-fixed-width"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <input
              id="autoHideSearchResults"
              name="autoHideSearchResults"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.autoHideSearchResults}
            />
            &nbsp;
            <label className="long-label" htmlFor="autoHideSearchResults">
              Dölj listan med sökresultat automatiskt när användaren klickar på
              ett sökresultat
            </label>
          </div>
          {this.state.tree}

          <div className="separator">Träffikon och markering</div>

          <div>
            <label htmlFor="src">
              URL till ikon för markering av träffar (punkter)
            </label>
            <input
              value={this.state.src}
              type="text"
              name="src"
              placeholder="URL till bild eller lämna tomt för grå punkt"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="anchorX">Ikonförskjutning X</label>
            <input
              value={this.state.anchorX}
              type="number"
              placeholder={defaultState.anchorX}
              min="0"
              max="100"
              step="0.1"
              name="anchorX"
              className="control-fixed-width"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="anchorY">Ikonförskjutning Y</label>
            <input
              value={this.state.anchorY}
              type="number"
              placeholder={defaultState.anchorY}
              min="0"
              max="100"
              step="0.1"
              name="anchorY"
              className="control-fixed-width"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="scale">
              Skala för ikon
              <br />
              (flyttal, 0-1)
            </label>
            <input
              value={this.state.scale}
              type="number"
              placeholder={defaultState.scale}
              step="0.01"
              min="0.01"
              max="10"
              name="scale"
              className="control-fixed-width"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div className="separator">Träffmarkering (polygon)</div>
          <div>
            <label htmlFor="strokeWidth">Bredd på ramen (px)</label>
            <input
              value={this.state.strokeWidth}
              type="number"
              placeholder={defaultState.strokeWidth}
              min="0"
              max="100"
              step="1"
              name="strokeWidth"
              className="control-fixed-width"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div className="clearfix">
            <span className="pull-left">
              <div>
                <label htmlFor="strokeColor">Färg på ramen (rgba)</label>
              </div>
              <SketchPicker
                color={{
                  r: this.state.strokeColor.r,
                  g: this.state.strokeColor.g,
                  b: this.state.strokeColor.b,
                  a: this.state.strokeColor.a
                }}
                onChangeComplete={color =>
                  this.handleColorChange("strokeColor", color)
                }
              />
            </span>
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <div>
                  <label className="long-label" htmlFor="fillColor">
                    Färg på fyllningen (rgba)
                  </label>
                </div>
                <SketchPicker
                  color={{
                    r: this.state.fillColor.r,
                    g: this.state.fillColor.g,
                    b: this.state.fillColor.b,
                    a: this.state.fillColor.a
                  }}
                  onChangeComplete={color =>
                    this.handleColorChange("fillColor", color)
                  }
                />
              </div>
            </span>
          </div>

          <div className="separator">Spatial sök</div>

          <div>
            <strong>
              <label>
                Aktiva spatial sökverktyg{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title='"Radie" fungerar endast med angivna visningstjänster (se lista längst ner)'
                />
              </label>
            </strong>
          </div>
          <div>
            <div>
              <input
                id="polygonSearch"
                name="polygonSearch"
                type="checkbox"
                onChange={e => {
                  this.handleInputChange(e);
                }}
                checked={this.state.polygonSearch}
              />
              &nbsp;
              <label htmlFor="polygonSearch">Polygon</label>
              <div>
                <input
                  id="radiusSearch"
                  name="radiusSearch"
                  type="checkbox"
                  onChange={e => {
                    this.handleInputChange(e);
                  }}
                  checked={this.state.radiusSearch}
                />
                &nbsp;
                <label className="long-label" htmlFor="radiusSearch">
                  Radie (aktiverar även en knapp bredvid varje sökresultat)
                </label>
              </div>
              <div>
                <input
                  id="selectionSearch"
                  name="selectionSearch"
                  type="checkbox"
                  onChange={e => {
                    this.handleInputChange(e);
                  }}
                  checked={this.state.selectionSearch}
                />
                &nbsp;
                <label htmlFor="selectionSearch">Selektion</label>
              </div>
            </div>
            &nbsp;
          </div>
          <div>
            <label htmlFor="searchWithinButtonText">
              Text för knapp som visas bredvid varje sökresultat om radiesök är
              aktivt
            </label>
            <input
              value={this.state.searchWithinButtonText}
              type="text"
              name="searchWithinButtonText"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          {/* <div>
            <input
              id="searchSettings"
              name="searchSettings"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.searchSettings}
            />
            &nbsp;
            <label htmlFor="searchSettings">Visa sökalternativ</label>
          </div> */}
          {/* 
          // TODO: maxZoom is currently hard-coded in SearchModel (maxZoom: 7).
          // We should check if it's really necessary, and if not use this setting instead.
          <div>
            <label htmlFor="maxZoom">Zoomnivå</label>
            <input
              value={this.state.maxZoom}
              type="text"
              name="maxZoom"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div> */}

          <div>
            <label htmlFor="searchLayers">
              Radiesök söker inom följande lager:
            </label>
            <div className="layer-list">
              {this.renderSources(this.state.sources)}
            </div>
          </div>

          {this.renderVisibleForGroups()}
        </form>
      </div>
    );
  }
}

export default ToolOptions;
