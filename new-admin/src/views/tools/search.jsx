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
  // State variables that are used in save()
  active: false,
  index: 0,

  layers: [],
  visibleForGroups: [],
  maxResultsPerDataset: 100,
  anchorX: "",
  anchorY: "",
  scale: "",
  markerImg: "",
  delayBeforeAutoSearch: 500,
  searchBarPlaceholder: "Sök...",

  enablePolygonSearch: true,
  enableRadiusSearch: true,
  enableSelectSearch: true,
  enableExtentSearch: true,
  enableResultsFiltering: true,
  enableResultsSorting: true,
  enableResultsSelectionClearing: true,
  enableResultsDownloading: true,
  enableFeaturePreview: true,
  enableLabelOnHighlight: true,
  enableSelectedFeaturesCollection: true,
  showResultFeaturesInMap: true,
  showResultsLimitReachedWarning: true,
  enableFeatureToggler: true,

  // Used to style the spatial search polygon/circle feature
  drawFillColor: "rgba(255,255,255,0.07)",
  drawStrokeColor: "rgba(74,74,74,0.5)",

  // Used to draw all features that came in the results feature collection,
  // only used if 'showResultFeaturesInMap' is true
  displayFillColor: "rgba(74,144,226,0.15)",
  displayStrokeColor: "rgba(74,144,226,0.4)",

  // Styles the selected features (the ones that user has marked as favorites)
  selectionTextStroke: "rgba(255,255,255,1)",
  selectionTextFill: "rgba(63,122,190,1)",
  selectionFillColor: "rgba(74,144,226,0.7)",
  selectionStrokeColor: "rgba(74,144,226,0.8)",

  // Styles the currently highligheted feature (the one that user clicked in map or highlighted by showing in search info window)
  highlightTextStroke: "rgba(255,255,255,1)",
  highlightTextFill: "rgba(214,143,28,1)",
  highlightFillColor: "rgba(245,166,35,0.7)",
  highlightStrokeColor: "rgba(245,166,35,0.8)",

  // Only local state, not used in save()
  validationErrors: [],
  searchableLayers: {},
  tree: "",
};

class RGBA {
  static toString(o) {
    return `rgba(${o.r},${o.g},${o.b},${o.a})`;
  }

  static parse(s) {
    try {
      // 1. RegEx that matches stuff between a set of parentheses
      // 2. Execute that regex on the input string, but first remove any whitespace it may contain
      // 3. RegEx exec returns an array. Grab the second element, which will contain the value.
      // 4. Split the value to extract individual rgba values
      const o = /\(([^)]+)\)/.exec(s.replace(/\s/g, ""))[1].split(",");
      return {
        r: o[0],
        g: o[1],
        b: o[2],
        a: o[3],
      };
    } catch (error) {
      console.error("RGBA parsing failed: " + error.message);
    }
  }
}

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

    const tool = this.getTool();
    if (tool) {
      this.setState(
        {
          active: true,
          index: tool.index,

          layers: tool.options.layers || this.state.layers,
          visibleForGroups:
            tool.options.visibleForGroups || this.state.visibleForGroups,
          maxResultsPerDataset:
            tool.options.maxResultsPerDataset ||
            this.state.maxResultsPerDataset,
          anchorX:
            (tool.options.anchor && tool.options.anchor[0]) ||
            this.state.anchorX,
          anchorY:
            (tool.options.anchor && tool.options.anchor[1]) ||
            this.state.anchorY,
          scale: tool.options.scale || this.state.scale,
          markerImg: tool.options.markerImg || this.state.markerImg,
          delayBeforeAutoSearch:
            tool.options.delayBeforeAutoSearch ||
            this.state.delayBeforeAutoSearch,
          searchBarPlaceholder:
            tool.options.searchBarPlaceholder ||
            this.state.searchBarPlaceholder,
          enablePolygonSearch:
            tool.options.enablePolygonSearch ?? this.state.enablePolygonSearch,
          enableRadiusSearch:
            tool.options.enableRadiusSearch ?? this.state.enableRadiusSearch,
          enableSelectSearch:
            tool.options.enableSelectSearch ?? this.state.enableSelectSearch,
          enableExtentSearch:
            tool.options.enableExtentSearch ?? this.state.enableExtentSearch,
          enableResultsFiltering:
            tool.options.enableResultsFiltering ??
            this.state.enableResultsFiltering,
          enableResultsSorting:
            tool.options.enableResultsSorting ??
            this.state.enableResultsSorting,
          enableResultsSelectionClearing:
            tool.options.enableResultsSelectionClearing ??
            this.state.enableResultsSelectionClearing,
          enableResultsDownloading:
            tool.options.enableResultsDownloading ??
            this.state.enableResultsDownloading,
          enableFeaturePreview:
            tool.options.enableFeaturePreview ??
            this.state.enableFeaturePreview,
          enableLabelOnHighlight:
            tool.options.enableLabelOnHighlight ??
            this.state.enableLabelOnHighlight,
          enableSelectedFeaturesCollection:
            tool.options.enableSelectedFeaturesCollection ??
            this.state.enableSelectedFeaturesCollection,
          showResultFeaturesInMap:
            tool.options.showResultFeaturesInMap ??
            this.state.showResultFeaturesInMap,
          showResultsLimitReachedWarning:
            tool.options.showResultsLimitReachedWarning ??
            this.state.showResultsLimitReachedWarning,
          enableFeatureToggler:
            tool.options.enableFeatureToggler ??
            this.state.enableFeatureToggler,

          drawFillColor: tool.options.drawFillColor || this.state.drawFillColor,
          drawStrokeColor:
            tool.options.drawStrokeColor || this.state.drawStrokeColor,

          displayFillColor:
            tool.options.displayFillColor || this.state.displayFillColor,
          displayStrokeColor:
            tool.options.displayStrokeColor || this.state.displayStrokeColor,

          selectionTextStroke:
            tool.options.selectionTextStroke || this.state.selectionTextStroke,
          selectionTextFill:
            tool.options.selectionTextFill || this.state.selectionTextFill,
          selectionFillColor:
            tool.options.selectionFillColor || this.state.selectionFillColor,
          selectionStrokeColor:
            tool.options.selectionStrokeColor ||
            this.state.selectionStrokeColor,

          highlightTextStroke:
            tool.options.highlightTextStroke || this.state.highlightTextStroke,
          highlightTextFill:
            tool.options.highlightTextFill || this.state.highlightTextFill,
          highlightFillColor:
            tool.options.highlightFillColor || this.state.highlightFillColor,
          highlightStrokeColor:
            tool.options.highlightStrokeColor ||
            this.state.highlightStrokeColor,
        },
        () => {
          this.loadLayers();
          this.loadSources();
        }
      );
    } else {
      this.setState({
        active: false,
      });
    }
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

    if (typeof childRefs !== "undefined") {
      for (let i of ids) {
        childRefs["cb_" + i.id] && (childRefs["cb_" + i.id].checked = true);
        childRefs[i.id] && (childRefs[i.id].hidden = false);
        childRefs[i.id] && (childRefs[i.id].value = i.visibleForGroups.join());
      }
    }
  }

  handleInputChange(event) {
    const t = event.target;
    const name = t.name;
    let value = t.type === "checkbox" ? t.checked : t.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }
    this.setState({
      [name]: value,
    });
  }

  loadSearchableLayers() {
    this.props.model.getConfig(
      this.props.model.get("config").url_layers,
      (layers) => {
        this.setState({
          searchableLayers: layers.wfslayers,
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
      }
    });
  }

  save() {
    const tool = {
      type: this.type,
      index: this.state.index,
      options: {
        layers: this.state.layers,
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
        maxResultsPerDataset: this.state.maxResultsPerDataset,
        anchor: [this.state.anchorX, this.state.anchorY],
        scale: this.state.scale,
        markerImg: this.state.markerImg,
        delayBeforeAutoSearch: this.state.delayBeforeAutoSearch,
        searchBarPlaceholder: this.state.searchBarPlaceholder,

        enablePolygonSearch: this.state.enablePolygonSearch,
        enableRadiusSearch: this.state.enableRadiusSearch,
        enableSelectSearch: this.state.enableSelectSearch,
        enableExtentSearch: this.state.enableExtentSearch,
        enableResultsFiltering: this.state.enableResultsFiltering,
        enableResultsSorting: this.state.enableResultsSorting,
        enableResultsSelectionClearing: this.state
          .enableResultsSelectionClearing,
        enableResultsDownloading: this.state.enableResultsDownloading,
        enableFeaturePreview: this.state.enableFeaturePreview,
        enableLabelOnHighlight: this.state.enableLabelOnHighlight,
        enableSelectedFeaturesCollection: this.state
          .enableSelectedFeaturesCollection,
        showResultFeaturesInMap: this.state.showResultFeaturesInMap,
        showResultsLimitReachedWarning: this.state
          .showResultsLimitReachedWarning,
        enableFeatureToggler: this.state.enableFeatureToggler,

        drawFillColor: this.state.drawFillColor,
        drawStrokeColor: this.state.drawStrokeColor,

        displayFillColor: this.state.displayFillColor,
        displayStrokeColor: this.state.displayStrokeColor,

        selectionTextStroke: this.state.selectionTextStroke,
        selectionTextFill: this.state.selectionTextFill,
        selectionFillColor: this.state.selectionFillColor,
        selectionStrokeColor: this.state.selectionStrokeColor,

        highlightTextStroke: this.state.highlightTextStroke,
        highlightTextFill: this.state.highlightTextFill,
        highlightFillColor: this.state.highlightFillColor,
        highlightStrokeColor: this.state.highlightStrokeColor,
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
    const t = event.target;
    const value = t.value;
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
        <>
          <div className="separator">Behörighetsstyrning för verktyget</div>
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
          visibleForGroups: [],
        };
        this.setState({
          layers: [...this.state.layers, toAdd],
        });
      } else {
        let newArray = this.state.layers.filter(
          (o) => o.id !== layer.id.toString()
        );

        this.setState({
          layers: newArray,
        });
      }
    }
    if (e.target.type.toLowerCase() === "text") {
      let obj = this.state.layers.find((o) => o.id === layer.id.toString());
      let newArray = this.state.layers.filter(
        (o) => o.id !== layer.id.toString()
      );

      // Skapar array och trimmar whitespace från start och slut av varje cell
      if (typeof obj !== "undefined") {
        obj.visibleForGroups = e.target.value.split(",");
        obj.visibleForGroups = obj.visibleForGroups.map((el) => el.trim());
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
        layers: newArray,
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
    this.props.model.getConfig(urlLayers, (layersConfig) => {
      var layers = this.flattern(
        this.props.model.get("layerMenuConfig").groups
      );

      layers = layers.map((layer) => {
        return {
          id: layer.id,
          name: this.lookup(layer.id, layersConfig),
        };
      });

      this.setState({
        sources: layers,
      });
    });
  };

  /**
   * Infoclick's stroke and fill color are set by the React
   * color picker. This method handles change event for those
   * two color pickers.
   *
   * @param {*} target
   * @param {*} color
   */
  handleColorChange = (target, color) => {
    console.log("color: ", color, RGBA.toString(color.rgb));
    this.setState({ [target]: RGBA.toString(color.rgb) });
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
          <div className="separator">Generella sökinställningar</div>

          <div>
            <label htmlFor="searchBarPlaceholder">Infotext i sökfältet</label>
            <input
              id="searchBarPlaceholder"
              value={this.state.searchBarPlaceholder}
              type="text"
              name="searchBarPlaceholder"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>

          <div>
            <label htmlFor="maxResultsPerDataset">
              Max antal sökträffar per dataset
            </label>
            <input
              value={this.state.maxResultsPerDataset}
              type="number"
              min="0"
              step="10"
              name="maxResultsPerDataset"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>

          <div>
            <input
              id="showResultsLimitReachedWarning"
              value={this.state.showResultsLimitReachedWarning}
              type="checkbox"
              name="showResultsLimitReachedWarning"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.showResultsLimitReachedWarning}
            />
            &nbsp;
            <label
              className="long-label"
              htmlFor="showResultsLimitReachedWarning"
            >
              Visa info bredvid varje dataset när antalet träffar överstiger
              värdet från inställningen ovan
            </label>
          </div>

          <div>
            <label htmlFor="delayBeforeAutoSearch">
              Fördröjning innan autocomplete (i millisekunder)
            </label>
            <input
              value={this.state.delayBeforeAutoSearch}
              type="number"
              min="0"
              max="5000"
              step="100"
              name="delayBeforeAutoSearch"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>

          <div className="separator">Söktjänster</div>

          {this.state.tree}

          <div className="separator">Spatiala sökverktyg</div>

          <div>
            <input
              id="enablePolygonSearch"
              name="enablePolygonSearch"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enablePolygonSearch}
            />
            &nbsp;
            <label htmlFor="enablePolygonSearch">Sök med polygon</label>
          </div>

          <div>
            <input
              id="enableRadiusSearch"
              name="enableRadiusSearch"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableRadiusSearch}
            />
            &nbsp;
            <label className="long-label" htmlFor="enableRadiusSearch">
              Sök med radie
            </label>
          </div>

          <div>
            <input
              id="enableSelectSearch"
              name="enableSelectSearch"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableSelectSearch}
            />
            &nbsp;
            <label className="long-label" htmlFor="enableSelectSearch">
              Sök med yta
            </label>
          </div>

          <div>
            <input
              id="enableExtentSearch"
              name="enableExtentSearch"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableExtentSearch}
            />
            &nbsp;
            <label className="long-label" htmlFor="enableExtentSearch">
              Sök i området
            </label>
          </div>

          <span className="pull-left" style={{ marginLeft: "10px" }}>
            <div>
              <div>
                <label className="long-label" htmlFor="drawFillColor">
                  Fyllnadsfärg
                </label>
              </div>
              <SketchPicker
                color={RGBA.parse(this.state.drawFillColor)}
                onChangeComplete={(color) =>
                  this.handleColorChange("drawFillColor", color)
                }
              />
            </div>
          </span>
          <div>
            <div>
              <label className="long-label" htmlFor="drawStrokeColor">
                Ramfärg
              </label>
            </div>
            <SketchPicker
              color={RGBA.parse(this.state.drawStrokeColor)}
              onChangeComplete={(color) =>
                this.handleColorChange("drawStrokeColor", color)
              }
            />
          </div>

          <div className="separator">Alternativ för visning av resultat</div>

          <div>
            <input
              id="showResultFeaturesInMap"
              value={this.state.showResultFeaturesInMap}
              type="checkbox"
              name="showResultFeaturesInMap"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.showResultFeaturesInMap}
            />
            &nbsp;
            <label className="long-label" htmlFor="showResultFeaturesInMap">
              Rita ut alla sökträffar i kartan automatiskt
            </label>
          </div>

          <div>
            <input
              id="enableResultsFiltering"
              value={this.state.enableResultsFiltering}
              type="checkbox"
              name="enableResultsFiltering"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableResultsFiltering}
            />
            &nbsp;
            <label className="long-label" htmlFor="enableResultsFiltering">
              Tillåt filtering av resultat
            </label>
          </div>

          <div>
            <input
              id="enableResultsSorting"
              value={this.state.enableResultsSorting}
              type="checkbox"
              name="enableResultsSorting"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableResultsSorting}
            />
            &nbsp;
            <label className="long-label" htmlFor="enableResultsSorting">
              Tillåt sortering av resultat
            </label>
          </div>

          <div>
            <input
              id="enableResultsSelectionClearing"
              value={this.state.enableResultsSelectionClearing}
              type="checkbox"
              name="enableResultsSelectionClearing"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableResultsSelectionClearing}
            />
            &nbsp;
            <label
              className="long-label"
              htmlFor="enableResultsSelectionClearing"
            >
              Tillåt snabbrensning av markerade sökresultat
            </label>
          </div>

          <div>
            <input
              id="enableResultsDownloading"
              value={this.state.enableResultsDownloading}
              type="checkbox"
              name="enableResultsDownloading"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableResultsDownloading}
            />
            &nbsp;
            <label className="long-label" htmlFor="enableResultsDownloading">
              Tillåt nedladdning av sökresultat
            </label>
          </div>

          <div>
            <input
              id="enableFeaturePreview"
              value={this.state.enableFeaturePreview}
              type="checkbox"
              name="enableFeaturePreview"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableFeaturePreview}
            />
            &nbsp;
            <label className="long-label" htmlFor="enableFeaturePreview">
              Visa förhandvisning vid mouse over
            </label>
          </div>

          <div>
            <input
              id="enableLabelOnHighlight"
              value={this.state.enableLabelOnHighlight}
              type="checkbox"
              name="enableLabelOnHighlight"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableLabelOnHighlight}
            />
            &nbsp;
            <label className="long-label" htmlFor="enableLabelOnHighlight">
              Visa etikett för valda resultat i kartan
            </label>
          </div>

          <div>
            <input
              id="enableSelectedFeaturesCollection"
              value={this.state.enableSelectedFeaturesCollection}
              type="checkbox"
              name="enableSelectedFeaturesCollection"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableSelectedFeaturesCollection}
            />
            &nbsp;
            <label
              className="long-label"
              htmlFor="enableSelectedFeaturesCollection"
            >
              Samla selekterade resultat i en egen kollektion ("Markerade
              resultat")
            </label>
          </div>

          <div>
            <input
              id="enableFeatureToggler"
              value={this.state.enableFeatureToggler}
              type="checkbox"
              name="enableFeatureToggler"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableFeatureToggler}
            />
            &nbsp;
            <label className="long-label" htmlFor="enableFeatureToggler">
              Visa föregående/nästa-knapp för bläddring av resultat
            </label>
          </div>

          <div className="separator">
            Träffikon och markering av resultat i karta (lämnas tomt för
            default)
          </div>
          <div>
            <label htmlFor="markerImg">
              URL till ikon för markering av punktsökträffar
            </label>
            <input
              id="markerImg"
              value={this.state.markerImg}
              placeholder="Lämnas tomt för standardikon"
              type="text"
              name="markerImg"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>

          <div>
            <label htmlFor="anchorX">Ikonförskjutning X</label>
            <input
              value={this.state.anchorX}
              type="number"
              placeholder="0.5"
              min="0"
              max="100"
              step="0.1"
              name="anchorX"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>

          <div>
            <label htmlFor="anchorY">Ikonförskjutning Y</label>
            <input
              value={this.state.anchorY}
              type="number"
              placeholder="1"
              min="0"
              max="100"
              step="0.1"
              name="anchorY"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>

          <div>
            <label htmlFor="scale">
              Skala för ikon
              <br />
              (flyttal, 0-10)
            </label>
            <input
              value={this.state.scale}
              type="number"
              placeholder="1"
              step="0.01"
              min="0.01"
              max="10"
              name="scale"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>

          <div className="separator">
            Standardutseende för resultat i kartan
          </div>

          <div className="clearfix">
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <div>
                  <label className="long-label" htmlFor="displayFillColor">
                    Markeringsfyllnad
                  </label>
                </div>
                <SketchPicker
                  color={RGBA.parse(this.state.displayFillColor)}
                  onChangeComplete={(color) =>
                    this.handleColorChange("displayFillColor", color)
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <div>
                  <label className="long-label" htmlFor="displayStrokeColor">
                    Markeringsram
                  </label>
                </div>
                <SketchPicker
                  color={RGBA.parse(this.state.displayStrokeColor)}
                  onChangeComplete={(color) =>
                    this.handleColorChange("displayStrokeColor", color)
                  }
                />
              </div>
            </span>
          </div>

          <div className="separator">Utseende för markerade resultat</div>

          <div className="clearfix">
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <div>
                  <label className="long-label" htmlFor="selectionTextFill">
                    Textfyllnad
                  </label>
                </div>
                <SketchPicker
                  color={RGBA.parse(this.state.selectionTextFill)}
                  onChangeComplete={(color) =>
                    this.handleColorChange("selectionTextFill", color)
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <div>
                  <label className="long-label" htmlFor="selectionTextStroke">
                    Textram
                  </label>
                </div>
                <SketchPicker
                  color={RGBA.parse(this.state.selectionTextStroke)}
                  onChangeComplete={(color) =>
                    this.handleColorChange("selectionTextStroke", color)
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <div>
                  <label className="long-label" htmlFor="selectionFillColor">
                    Markeringsfyllnad
                  </label>
                </div>
                <SketchPicker
                  color={RGBA.parse(this.state.selectionFillColor)}
                  onChangeComplete={(color) =>
                    this.handleColorChange("selectionFillColor", color)
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <div>
                  <label className="long-label" htmlFor="selectionStrokeColor">
                    Markeringsram
                  </label>
                </div>
                <SketchPicker
                  color={RGBA.parse(this.state.selectionStrokeColor)}
                  onChangeComplete={(color) =>
                    this.handleColorChange("selectionStrokeColor", color)
                  }
                />
              </div>
            </span>
          </div>

          <div className="separator">
            Utseende för det aktiva ("highlightade") resultatet
          </div>

          <div className="clearfix">
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <div>
                  <label className="long-label" htmlFor="highlightTextFill">
                    Textfyllnad
                  </label>
                </div>
                <SketchPicker
                  color={RGBA.parse(this.state.highlightTextFill)}
                  onChangeComplete={(color) =>
                    this.handleColorChange("highlightTextFill", color)
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <div>
                  <label className="long-label" htmlFor="highlightTextStroke">
                    Textram
                  </label>
                </div>
                <SketchPicker
                  color={RGBA.parse(this.state.highlightTextStroke)}
                  onChangeComplete={(color) =>
                    this.handleColorChange("highlightTextStroke", color)
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <div>
                  <label className="long-label" htmlFor="highlightFillColor">
                    Markeringsfyllnad
                  </label>
                </div>
                <SketchPicker
                  color={RGBA.parse(this.state.highlightFillColor)}
                  onChangeComplete={(color) =>
                    this.handleColorChange("highlightFillColor", color)
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <div>
                  <label className="long-label" htmlFor="highlightStrokeColor">
                    Markeringsram
                  </label>
                </div>
                <SketchPicker
                  color={RGBA.parse(this.state.highlightStrokeColor)}
                  onChangeComplete={(color) =>
                    this.handleColorChange("highlightStrokeColor", color)
                  }
                />
              </div>
            </span>
          </div>

          {this.renderVisibleForGroups()}
        </form>
      </div>
    );
  }
}

export default ToolOptions;
