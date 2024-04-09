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
  disableAutocomplete: false,
  disableSearchCombinations: false,
  searchBarPlaceholder: "Sök...",
  autocompleteWildcardAtStart: false,
  autofocusOnStart: false,
  enablePolygonSearch: true,
  enableRadiusSearch: true,
  enableSelectSearch: true,
  enableExtentSearch: true,
  enableResultsFiltering: true,
  enableResultsSorting: true,
  enableResultsSelectionClearing: true,
  enableResultsDownloading: true,
  enableFeaturePreview: true,
  enableSelectedFeaturesCollection: true,
  showResultFeaturesInMap: true,
  searchInVisibleLayers: false,
  wildcardAtStart: false,
  wildcardAtEnd: true,
  matchCase: false,
  activeSpatialFilter: "intersects",
  enableLabelOnHighlight: true,
  enabledSearchOptions: [
    "enableLabelOnHighlight",
    "activeSpatialFilter",
    "matchCase",
    "wildcardAtEnd",
    "wildcardAtStart",
    "searchInVisibleLayers",
  ],
  showResultsLimitReachedWarning: true,
  enableFeatureToggler: true,
  fitToResultMaxZoom: -1,
  showCorrespondingWMSLayers: false,

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
          selectedSources: tool.options.selectedSources
            ? tool.options.selectedSources
            : [],
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
          disableAutocomplete:
            tool.options.disableAutocomplete ?? this.state.disableAutocomplete,
          disableSearchCombinations:
            tool.options.disableSearchCombinations ??
            this.state.disableSearchCombinations,
          autocompleteWildcardAtStart:
            tool.options.autocompleteWildcardAtStart ??
            this.state.autocompleteWildcardAtStart,
          autofocusOnStart:
            tool.options.autofocusOnStart ?? this.state.autofocusOnStart,
          searchBarPlaceholder:
            tool.options.searchBarPlaceholder ||
            this.state.searchBarPlaceholder,
          enablePolygonSearch:
            tool.options.enablePolygonSearch ?? this.state.enablePolygonSearch,
          showCorrespondingWMSLayers:
            tool.options.showCorrespondingWMSLayers ??
            this.state.showCorrespondingWMSLayers,
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
          searchInVisibleLayers:
            tool.options.searchInVisibleLayers ??
            this.state.searchInVisibleLayers,
          wildcardAtStart:
            tool.options.wildcardAtStart ?? this.state.wildcardAtStart,
          wildcardAtEnd: tool.options.wildcardAtEnd ?? this.state.wildcardAtEnd,
          matchCase: tool.options.matchCase ?? this.state.matchCase,
          activeSpatialFilter:
            tool.options.activeSpatialFilter ?? this.state.activeSpatialFilter,
          enabledSearchOptions:
            tool.options.enabledSearchOptions ??
            this.state.enabledSearchOptions,
          showResultsLimitReachedWarning:
            tool.options.showResultsLimitReachedWarning ??
            this.state.showResultsLimitReachedWarning,
          enableFeatureToggler:
            tool.options.enableFeatureToggler ??
            this.state.enableFeatureToggler,
          fitToResultMaxZoom:
            tool.options.fitToResultMaxZoom || this.state.fitToResultMaxZoom,

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
          this.loadLayers(); // Load WFS search sources
          this.loadSources(); // Load WMS layers as search sources too
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
        childRefs[i.id] &&
          (childRefs[i.id].value = Array.isArray(i.visibleForGroups)
            ? i.visibleForGroups.join()
            : "");
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
    // Special case: activeSpatialFilter is a checkbox but we want
    // it to save string values
    if (t.name === "activeSpatialFilter") {
      console.log(value);
      this.setState({
        activeSpatialFilter: value === false ? "intersects" : "within",
      });
    } else {
      this.setState({
        [name]: value,
      });
    }
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
        selectedSources: this.state.selectedSources
          ? this.state.selectedSources
          : [],
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
        maxResultsPerDataset: this.state.maxResultsPerDataset,
        anchor: [this.state.anchorX, this.state.anchorY],
        scale: this.state.scale,
        markerImg: this.state.markerImg,
        delayBeforeAutoSearch: this.state.delayBeforeAutoSearch,
        disableAutocomplete: this.state.disableAutocomplete,
        disableSearchCombinations: this.state.disableSearchCombinations,
        searchBarPlaceholder: this.state.searchBarPlaceholder,
        autocompleteWildcardAtStart: this.state.autocompleteWildcardAtStart,
        autofocusOnStart: this.state.autofocusOnStart,
        enablePolygonSearch: this.state.enablePolygonSearch,
        showCorrespondingWMSLayers: this.state.showCorrespondingWMSLayers,
        enableRadiusSearch: this.state.enableRadiusSearch,
        enableSelectSearch: this.state.enableSelectSearch,
        enableExtentSearch: this.state.enableExtentSearch,
        enableResultsFiltering: this.state.enableResultsFiltering,
        enableResultsSorting: this.state.enableResultsSorting,
        enableResultsSelectionClearing:
          this.state.enableResultsSelectionClearing,
        enableResultsDownloading: this.state.enableResultsDownloading,
        enableFeaturePreview: this.state.enableFeaturePreview,
        enableLabelOnHighlight: this.state.enableLabelOnHighlight,
        enableSelectedFeaturesCollection:
          this.state.enableSelectedFeaturesCollection,
        showResultFeaturesInMap: this.state.showResultFeaturesInMap,
        searchInVisibleLayers: this.state.searchInVisibleLayers,
        wildcardAtStart: this.state.wildcardAtStart,
        wildcardAtEnd: this.state.wildcardAtEnd,
        matchCase: this.state.matchCase,
        activeSpatialFilter: this.state.activeSpatialFilter,
        enabledSearchOptions: this.state.enabledSearchOptions,
        showResultsLimitReachedWarning:
          this.state.showResultsLimitReachedWarning,
        enableFeatureToggler: this.state.enableFeatureToggler,
        fitToResultMaxZoom: this.state.fitToResultMaxZoom,

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
    if (!groups) {
      return [];
    }
    return groups.reduce((i, group) => {
      var layers = [];
      if (group.groups?.length !== 0) {
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
        // We want to compare Numbers and Strings, hence the use of == operator.
        // eslint-disable-next-line
        if (layersConfig[layerTypes[i]][j].id == layerId) {
          found =
            layersConfig[layerTypes[i]][j]?.internalLayerName ||
            layersConfig[layerTypes[i]][j].caption;
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

  selectedSourceChange = (id, checked) => (e) => {
    var selectedSources = checked
      ? this.state.selectedSources.filter(
          (selectedSource) => selectedSource !== id
        )
      : [id, ...this.state.selectedSources];

    this.setState({
      selectedSources: selectedSources,
    });
  };

  renderSources(sources) {
    if (!sources) return null;
    return (
      <ul>
        {sources.map((source, i) => {
          var id = "layer_" + source.id;
          var checked = this.state.selectedSources.some(
            (id) => id === source.id
          );
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
            <input
              id="disableAutocomplete"
              name="disableAutocomplete"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.disableAutocomplete}
            />
            &nbsp;
            <label className="long-label" htmlFor="disableAutocomplete">
              Avaktivera autocomplete (visa sökresultat direkt).
            </label>
          </div>
          <div>
            <input
              id="disableSearchCombinations"
              name="disableSearchCombinations"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.disableSearchCombinations}
            />
            &nbsp;
            <label htmlFor="disableSearchCombinations" className="long-label">
              Avaktivera automatiska sök-kombinationer{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Låt inte sökmotorn skapa automatiska sök-kombinationer.
                (Kombinationerna kan öka möjligheten att användarna hittar vad de
                letar efter, men det kan ta längre tid för servern att bearbeta
                sökningen.)"
              />
            </label>
          </div>

          <div>
            <label htmlFor="delayBeforeAutoSearch">
              Fördröjning innan auto-sök (i millisekunder)
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
          <div>
            <input
              id="autocompleteWildcardAtStart"
              name="autocompleteWildcardAtStart"
              value={this.state.autocompleteWildcardAtStart}
              type="checkbox"
              checked={this.state.autocompleteWildcardAtStart}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />{" "}
            <label className="long-label" htmlFor="autocompleteWildcardAtStart">
              Använd wildcard före sökord för autocomplete
            </label>
          </div>
          <div>
            <input
              id="autofocusOnStart"
              name="autofocusOnStart"
              value={this.state.autofocusOnStart}
              type="checkbox"
              checked={this.state.autofocusOnStart}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />{" "}
            <label className="long-label" htmlFor="autofocusOnStart">
              Sätt fokus i sökrutan automatiskt när Hajk startar
            </label>
          </div>

          <div className="separator">Söktjänster</div>

          {this.state.tree}

          <div className="separator">Sök inom WMS-lager</div>

          <div>
            <label htmlFor="searchLayers">
              Välj vilka WMS-lager som ska vara tillgängliga som söktjänster.
              Kom ihåg att konfigurera respektive WMS-lagers sökinställningar i
              Lager-fliken!
            </label>
            <div className="layer-list">
              {this.renderSources(this.state.sources)}
            </div>
          </div>

          <div>
            <input
              id="showCorrespondingWMSLayers"
              name="showCorrespondingWMSLayers"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.showCorrespondingWMSLayers}
            />
            &nbsp;
            <label htmlFor="showCorrespondingWMSLayers" className="long-label">
              Tänd motsvarande WMS-lager automatiskt vid klick i resultatlistan
            </label>
          </div>

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
              Sök inom vyn
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

          <div className="separator">
            Aktiverade och förvalda användarinställningar
          </div>

          <p>
            Välj vilka sökinställningar som ska vara tillgängliga för användaren
            och vilka som ska vara förvalda. Användaren kommer kunna anpassa
            dessa utifrån sina önskemål under pågående session.
          </p>

          <div>
            <input
              id="searchInVisibleLayersEnabled"
              name="searchInVisibleLayersEnabled"
              type="checkbox"
              onChange={(e) => {
                const { checked } = e.target;
                this.setState((prevState) => {
                  const enabledSearchOptions = new Set(
                    prevState.enabledSearchOptions
                  );
                  if (checked) {
                    enabledSearchOptions.add("searchInVisibleLayers");
                  } else {
                    enabledSearchOptions.delete("searchInVisibleLayers");
                  }
                  return {
                    enabledSearchOptions: Array.from(enabledSearchOptions),
                  };
                });
              }}
              checked={this.state.enabledSearchOptions.includes(
                "searchInVisibleLayers"
              )}
            />
            &nbsp;
            <label
              className="long-label"
              htmlFor="searchInVisibleLayersEnabled"
            >
              Sök endast i synliga lager
            </label>
          </div>
          <div style={{ marginLeft: "20px" }}>
            <input
              id="searchInVisibleLayers"
              value={this.state.searchInVisibleLayers}
              type="checkbox"
              name="searchInVisibleLayers"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.searchInVisibleLayers}
              disabled={
                !this.state.enabledSearchOptions.includes(
                  "searchInVisibleLayers"
                )
              }
            />
            &nbsp;
            <label className="long-label" htmlFor="searchInVisibleLayers">
              Förvald
            </label>
          </div>

          <div>
            <input
              id="wildcardAtStartEnabled"
              name="wildcardAtStartEnabled"
              type="checkbox"
              onChange={(e) => {
                const { checked } = e.target;
                this.setState((prevState) => {
                  const enabledSearchOptions = new Set(
                    prevState.enabledSearchOptions
                  );
                  if (checked) {
                    enabledSearchOptions.add("wildcardAtStart");
                  } else {
                    enabledSearchOptions.delete("wildcardAtStart");
                  }
                  return {
                    enabledSearchOptions: Array.from(enabledSearchOptions),
                  };
                });
              }}
              checked={this.state.enabledSearchOptions.includes(
                "wildcardAtStart"
              )}
            />
            &nbsp;
            <label className="long-label" htmlFor="wildcardAtStartEnabled">
              Använd wildcard före sökord
            </label>
          </div>
          <div style={{ marginLeft: "20px" }}>
            <input
              id="wildcardAtStart"
              value={this.state.wildcardAtStart}
              type="checkbox"
              name="wildcardAtStart"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.wildcardAtStart}
              disabled={
                !this.state.enabledSearchOptions.includes("wildcardAtStart")
              }
            />
            &nbsp;
            <label className="long-label" htmlFor="wildcardAtStart">
              Förvald
            </label>
          </div>

          <div>
            <input
              id="wildcardAtEndEnabled"
              name="wildcardAtEndEnabled"
              type="checkbox"
              onChange={(e) => {
                const { checked } = e.target;
                this.setState((prevState) => {
                  const enabledSearchOptions = new Set(
                    prevState.enabledSearchOptions
                  );
                  if (checked) {
                    enabledSearchOptions.add("wildcardAtEnd");
                  } else {
                    enabledSearchOptions.delete("wildcardAtEnd");
                  }
                  return {
                    enabledSearchOptions: Array.from(enabledSearchOptions),
                  };
                });
              }}
              checked={this.state.enabledSearchOptions.includes(
                "wildcardAtEnd"
              )}
            />
            &nbsp;
            <label className="long-label" htmlFor="wildcardAtEndEnabled">
              Använd wildcard efter sökord
            </label>
          </div>
          <div style={{ marginLeft: "20px" }}>
            <input
              id="wildcardAtEnd"
              value={this.state.wildcardAtEnd}
              type="checkbox"
              name="wildcardAtEnd"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.wildcardAtEnd}
              disabled={
                !this.state.enabledSearchOptions.includes("wildcardAtEnd")
              }
            />
            &nbsp;
            <label className="long-label" htmlFor="wildcardAtEnd">
              Förvald
            </label>
          </div>

          <div>
            <input
              id="matchCaseEnabled"
              name="matchCaseEnabled"
              type="checkbox"
              onChange={(e) => {
                const { checked } = e.target;
                this.setState((prevState) => {
                  const enabledSearchOptions = new Set(
                    prevState.enabledSearchOptions
                  );
                  if (checked) {
                    enabledSearchOptions.add("matchCase");
                  } else {
                    enabledSearchOptions.delete("matchCase");
                  }
                  return {
                    enabledSearchOptions: Array.from(enabledSearchOptions),
                  };
                });
              }}
              checked={this.state.enabledSearchOptions.includes("matchCase")}
            />
            &nbsp;
            <label className="long-label" htmlFor="matchCaseEnabled">
              Skiftlägeskänslig sökning
            </label>
          </div>
          <div style={{ marginLeft: "20px" }}>
            <input
              id="matchCase"
              value={this.state.matchCase}
              type="checkbox"
              name="matchCase"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.matchCase}
              disabled={!this.state.enabledSearchOptions.includes("matchCase")}
            />
            &nbsp;
            <label className="long-label" htmlFor="matchCase">
              Förvald
            </label>
          </div>

          <div>
            <input
              id="activeSpatialFilterEnabled"
              name="activeSpatialFilterEnabled"
              type="checkbox"
              onChange={(e) => {
                const { checked } = e.target;
                this.setState((prevState) => {
                  const enabledSearchOptions = new Set(
                    prevState.enabledSearchOptions
                  );
                  if (checked) {
                    enabledSearchOptions.add("activeSpatialFilter");
                  } else {
                    enabledSearchOptions.delete("activeSpatialFilter");
                  }
                  return {
                    enabledSearchOptions: Array.from(enabledSearchOptions),
                  };
                });
              }}
              checked={this.state.enabledSearchOptions.includes(
                "activeSpatialFilter"
              )}
            />
            &nbsp;
            <label className="long-label" htmlFor="activeSpatialFilterEnabled">
              Kräv att hela objektet ryms inom sökområde
            </label>
          </div>
          <div style={{ marginLeft: "20px" }}>
            <input
              id="activeSpatialFilter"
              value={this.state.activeSpatialFilter === "within"}
              type="checkbox"
              name="activeSpatialFilter"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.activeSpatialFilter === "within"}
              disabled={
                !this.state.enabledSearchOptions.includes("activeSpatialFilter")
              }
            />
            &nbsp;
            <label className="long-label" htmlFor="activeSpatialFilter">
              Förvald
            </label>
          </div>

          <div>
            <input
              id="enableLabelOnHighlightEnabled"
              name="enableLabelOnHighlightEnabled"
              type="checkbox"
              onChange={(e) => {
                const { checked } = e.target;
                this.setState((prevState) => {
                  const enabledSearchOptions = new Set(
                    prevState.enabledSearchOptions
                  );
                  if (checked) {
                    enabledSearchOptions.add("enableLabelOnHighlight");
                  } else {
                    enabledSearchOptions.delete("enableLabelOnHighlight");
                  }
                  return {
                    enabledSearchOptions: Array.from(enabledSearchOptions),
                  };
                });
              }}
              checked={this.state.enabledSearchOptions.includes(
                "enableLabelOnHighlight"
              )}
            />
            &nbsp;
            <label
              className="long-label"
              htmlFor="enableLabelOnHighlightEnabled"
            >
              Visa etikett för valda resultat i kartan
            </label>
          </div>
          <div style={{ marginLeft: "20px" }}>
            <input
              id="enableLabelOnHighlight"
              value={this.state.enableLabelOnHighlight}
              type="checkbox"
              name="enableLabelOnHighlight"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableLabelOnHighlight}
              disabled={
                !this.state.enabledSearchOptions.includes(
                  "enableLabelOnHighlight"
                )
              }
            />
            &nbsp;
            <label className="long-label" htmlFor="enableLabelOnHighlight">
              Förvald
            </label>
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
              Visa förhandsvisning vid mouse over
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

          <div>
            <input
              id="fitToResultMaxZoom"
              value={this.state.fitToResultMaxZoom}
              type="number"
              min="-1"
              max="20"
              step="1"
              name="fitToResultMaxZoom"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.fitToResultMaxZoom}
            />
            &nbsp;
            <label className="long-label" htmlFor="fitToResultMaxZoom">
              Maximal zoomnivå vid zoomning till sökresultat (-1 för obegränsat)
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
