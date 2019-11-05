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
import Tree from "../tree.jsx";

var defaultState = {
  validationErrors: [],
  toolbar: "bottom",
  active: false,
  index: 0,
  target: "toolbar",
  onMap: false,
  bothSynlig: false,
  enableViewTogglePopupInSnabbsok: true,
  selectionTools: true,
  selectionSearch: false,
  radiusSearch: false,
  polygonSearch: false,
  searchSettings: false,
  base64Encode: false,
  instruction: "",
  filterVisible: true,
  displayPopup: true,
  maxZoom: 14,
  excelExportUrl: "/mapservice/export/excel",
  kmlExportUrl: "/mapservice/export/kml",
  markerImg: "http://localhost/hajk/assets/icons/marker.png",
  anchorX: 16,
  anchorY: 32,
  imgSizeX: 32,
  imgSizeY: 32,
  tooltip: "Sök...",
  searchWithinButtonText: "Markera i kartan",
  toolDescription: "<div>Sök innehåll i kartan</div>",
  maxFeatures: 100,
  popupOffsetY: 0,
  visibleForGroups: [],
  searchableLayers: {},
  tree: "",
  layers: []
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
    if (this.props.parent.props.parent.state.authActive) {
      this.loadSearchableLayers();
    }
    var tool = this.getTool();
    if (tool) {
      this.setState(
        {
          active: true,
          index: tool.index,
          target: tool.options.target || "toolbar",
          position: tool.options.position,
          width: tool.options.width,
          height: tool.options.height,
          onMap: tool.options.onMap,
          bothSynlig: tool.options.bothSynlig,
          enableViewTogglePopupInSnabbsok:
            tool.options.enableViewTogglePopupInSnabbsok,
          selectionTools: tool.options.selectionTools,
          selectionSearch: tool.options.selectionSearch,
          radiusSearch: tool.options.radiusSearch,
          polygonSearch: tool.options.polygonSearch,
          searchSettings: tool.options.searchSettings,
          base64Encode: tool.options.base64Encode,
          instruction: tool.options.instruction,
          filterVisible: tool.options.filterVisible,
          displayPopup: tool.options.displayPopup,
          maxZoom: tool.options.maxZoom,
          excelExportUrl: tool.options.excelExportUrl,
          kmlExportUrl: tool.options.kmlExportUrl,
          markerImg: tool.options.markerImg,
          anchorX: tool.options.anchor[0] || this.state.anchorX,
          anchorY: tool.options.anchor[1] || this.state.anchorY,
          imgSizeX: tool.options.imgSize[0] || this.state.imgSizeX,
          imgSizeY: tool.options.imgSize[1] || this.state.imgSizeX,
          tooltip: tool.options.tooltip || this.state.tooltip,
          searchWithinButtonText:
            tool.options.searchWithinButtonText ||
            this.state.searchWithinButtonText,
          toolDescription:
            tool.options.toolDescription || this.state.toolDescription,
          maxFeatures: tool.options.maxFeatures || this.state.maxFeatures,
          popupOffsetY: tool.options.popupOffsetY,
          visibleForGroups: tool.options.visibleForGroups
            ? tool.options.visibleForGroups
            : [],
          layers: tool.options.layers ? tool.options.layers : [],
          selectedSources: tool.options.selectedSources
            ? tool.options.selectedSources
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
      console.log("childRefs: ", childRefs);
      console.log(ids);

      for (let i of ids) {
        childRefs["cb_" + i.id] && (childRefs["cb_" + i.id].checked = true);
        childRefs[i.id] && (childRefs[i.id].hidden = false);
        childRefs[i.id] && (childRefs[i.id].value = i.visibleForGroups.join());
      }
    }
  }

  handleInputChange(event) {
    var target = event.target;
    var name = target.name;
    var value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }
    console.log([name], "name", value, "value");
    if (name === "instruction") {
      value = btoa(value);
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
    var toolbar = "bottom";
    var onMap = this.state.onMap;
    if (this.state.bothSynlig) {
      toolbar = "bottom";
      onMap = true;
    } else if (onMap) {
      toolbar = "";
    }

    var tool = {
      type: this.type,
      index: this.state.index,
      options: {
        target: this.state.target,
        position: this.state.position,
        width: this.state.width,
        height: this.state.height,
        onMap: onMap,
        bothSynlig: this.state.bothSynlig,
        enableViewTogglePopupInSnabbsok: this.state
          .enableViewTogglePopupInSnabbsok,
        toolbar: toolbar,
        maxZoom: this.state.maxZoom,
        markerImg: this.state.markerImg,
        kmlExportUrl: this.state.kmlExportUrl,
        excelExportUrl: this.state.excelExportUrl,
        displayPopup: this.state.displayPopup,
        selectionTools: this.state.selectionTools,
        selectionSearch: this.state.selectionSearch,
        radiusSearch: this.state.radiusSearch,
        polygonSearch: this.state.polygonSearch,
        searchSettings: this.state.searchSettings,
        base64Encode: this.state.base64Encode,
        instruction: this.state.instruction,
        filterVisible: this.state.filterVisible,
        anchor: [this.state.anchorX, this.state.anchorY],
        imgSize: [this.state.imgSizeX, this.state.imgSizeY],
        tooltip: this.state.tooltip,
        searchWithinButtonText: this.state.searchWithinButtonText,
        toolDescription: this.state.toolDescription,
        maxFeatures: this.state.maxFeatures,
        popupOffsetY: this.state.popupOffsetY,
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
        layers: this.state.layers ? this.state.layers : [],
        selectedSources: this.state.selectedSources
          ? this.state.selectedSources
          : []
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
      <ul style={{ paddingLeft: 0 }}>
        {sources.map((source, i) => {
          var id = "layer_" + source.id;
          var checked = this.state.selectedSources.some(id => id === source.id);
          return (
            <li key={i}>
              <label htmlFor={id}>
                <b>{source.name}</b>
              </label>
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={this.selectedSourceChange(source.id, checked)}
              />
            </li>
          );
        })}
      </ul>
    );
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
            <select
              id="target"
              name="target"
              onChange={e => {
                this.handleInputChange(e);
              }}
              value={this.state.target}
            >
              <option value="header">AppBar</option>
              <option value="center">Centrerad i kartan</option>
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
            <input
              id="onMap"
              name="onMap"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.onMap}
            />
            &nbsp;
            <label htmlFor="onMap">Alltid synlig</label>
          </div>
          <div>
            <input
              id="enableViewTogglePopupInSnabbsok"
              name="enableViewTogglePopupInSnabbsok"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableViewTogglePopupInSnabbsok}
            />
            &nbsp;
            <label htmlFor="enableViewTogglePopupInSnabbsok">
              "Visa information" i snabbsök
            </label>
          </div>
          <div>
            <input
              id="bothSynlig"
              name="bothSynlig"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.bothSynlig}
            />
            &nbsp;
            <label htmlFor="bothSynlig">Visa snabbsök</label>
          </div>
          <div>
            <input
              id="displayPopup"
              name="displayPopup"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.displayPopup}
            />
            &nbsp;
            <label htmlFor="displayPopup">Visa popup</label>
          </div>
          <div>
            <input
              id="filterVisible"
              name="filterVisible"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.filterVisible}
            />
            &nbsp;
            <label htmlFor="filterVisible">Sök i synliga lager</label>
          </div>
          <div>
            <input
              id="selectionTools"
              name="selectionTools"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.selectionTools}
            />
            &nbsp;
            <label>Verktyg för ytsökning</label>
          </div>

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
                <label htmlFor="radiusSearch">Radie</label>
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
                <label htmlFor="selectionSearch">Selektion</label>
              </div>
            </div>
            &nbsp;
          </div>
          <div>
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
          </div>
          <div>
            <input
              id="Base64-active"
              name="base64Encode"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.base64Encode}
            />
            &nbsp;
            <label htmlFor="Base64-active">Komprimera instruktionstext</label>
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
            <label htmlFor="maxZoom">Zoomnivå</label>
            <input
              value={this.state.maxZoom}
              type="text"
              name="maxZoom"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="excelExportUrl">URL Excel-tjänst</label>
            <input
              value={this.state.excelExportUrl}
              type="text"
              name="excelExportUrl"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="kmlExportUrl">URL KML-tjänst</label>
            <input
              value={this.state.kmlExportUrl}
              type="text"
              name="kmlExportUrl"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="markerImg">Ikon för sökträff</label>
            <input
              value={this.state.markerImg}
              type="text"
              name="markerImg"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="anchorX">Ikonförskjutning X</label>
            <input
              value={this.state.anchorX}
              type="text"
              name="anchorX"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="anchorY">Ikonförskjutning Y</label>
            <input
              value={this.state.anchorY}
              type="text"
              name="anchorY"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="popupOffsetY">Förskjutning popup-ruta</label>
            <input
              value={this.state.popupOffsetY}
              type="text"
              name="popupOffsetY"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="imgSizeX">Bildbredd</label>
            <input
              value={this.state.imgSizeX}
              type="text"
              name="imgSizeX"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="imgSizeY">Bildhöjd</label>
            <input
              value={this.state.imgSizeY}
              type="text"
              name="imgSizeY"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="tooltip">Söktips</label>
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
            <label htmlFor="searchWithinButtonText">Sök inom - snapptext</label>
            <input
              value={this.state.searchWithinButtonText}
              type="text"
              name="searchWithinButtonText"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="toolDescription">Beskrivning (html)</label>
            <textarea
              value={this.state.toolDescription}
              type="text"
              name="toolDescription"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="maxFeatures">Antal sökträffar</label>
            <input
              value={this.state.maxFeatures}
              type="text"
              name="maxFeatures"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="searchLayers">Visninstjänster för sök inom</label>
            <div>{this.renderSources(this.state.sources)}</div>
          </div>
        </form>
        {this.state.tree}
      </div>
    );
  }
}

export default ToolOptions;
