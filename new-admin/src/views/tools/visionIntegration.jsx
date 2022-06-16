import React, { Component } from "react";
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

const DEFAULT_FIELDS_TO_SEND = [
  {
    key: "fnr",
    featureProperty: "fnr_fr",
    overrideValue: null,
  },
  {
    key: "name",
    featureProperty: "fastighet_enkel",
    overrideValue: null,
  },
  {
    key: "uuid",
    featureProperty: null,
    overrideValue: "5d560563-48c6-4588-9d24-46c41d0c7278",
  },
  {
    key: "municipality",
    featureProperty: null,
    overrideValue: "Gothenburg",
  },
];

const defaultState = {
  index: 0,
  active: false,
  target: "toolbar",
  position: "left",
  visibleAtStart: false,
  instruction: "",
  hubUrl: "https://some-fancy-signalr-hub.com/some-part-of-the-hub",
  userOverride: "",
  tree: "",
  integrationSettings: [
    {
      id: "ESTATES",
      searchKey: "fnr",
      wmsId: "999",
      wfsId: "99",
      fieldsToSend: DEFAULT_FIELDS_TO_SEND,
    },
  ],
  searchSources: [],
  searchableLayers: [],
  visibleForGroups: [],
  availableWmsLayers: [],
};

class ToolOptions extends Component {
  constructor() {
    super();
    this.state = defaultState;
    this.type = "visionintegration";
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
          target: tool.options.target || "toolbar",
          position: tool.options.position,
          width: tool.options.width,
          height: tool.options.height,
          visibleAtStart: tool.options.visibleAtStart,
          instruction: tool.options.instruction,
          hubUrl: tool.options.hubUrl || this.state.hubUrl,
          userOverride: tool.options.userOverride || this.state.userOverride,
          searchSources: tool.options.searchSources || this.state.searchSources,
          integrationSettings:
            tool.options.integrationSettings || this.state.integrationSettings,
        },
        () => {
          this.loadLayers(); // Load WFS search sources
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

    for (let id of this.state.searchSources) {
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

  getEstateIntegrationSettings = () => {
    return this.state.integrationSettings.find(
      (setting) => setting.id === "ESTATES"
    );
  };

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
        target: this.state.target,
        position: this.state.position,
        visibleAtStart: this.state.visibleAtStart,
        instruction: this.state.instruction,
        hubUrl: this.state.hubUrl,
        userOverride: this.state.userOverride,
        searchSources: this.state.searchSources,
        integrationSettings: this.state.integrationSettings,
        visibleForGroups: this.state.visibleForGroups,
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
          searchSources: [...this.state.searchSources, toAdd],
        });
      } else {
        let newArray = this.state.searchSources.filter(
          (o) => o.id !== layer.id.toString()
        );

        this.setState({
          searchSources: newArray,
        });
      }
    }
    if (e.target.type.toLowerCase() === "text") {
      let obj = this.state.searchSources.find(
        (o) => o.id === layer.id.toString()
      );
      let newArray = this.state.searchSources.filter(
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
        searchSources: newArray,
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
        availableWmsLayers: layers,
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
          <div className="separator">Generella inställningar</div>
          <div>
            <label htmlFor="hubUrl">URL till kommunikations-hub</label>
            <input
              id="hubUrl"
              value={this.state.hubUrl}
              type="text"
              name="hubUrl"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="userOverride">
              Användare för test (istället för inloggad användare)
            </label>
            <input
              id="userOverride"
              value={this.state.userOverride}
              type="text"
              name="userOverride"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div className="separator">Söktjänster</div>
          {this.state.tree}
          <div className="separator">Fastighetskoppling</div>
          <div>
            <label htmlFor="estate_settings_wfsId">Sökkälla</label>
            <select
              id="estate_settings_wfsId"
              name="estate_settings_wfsId"
              className="control-fixed-width"
              onChange={(e) => {
                const selected = e.target.value;
                const estateSettings = this.getEstateIntegrationSettings();
                estateSettings.wfsId = selected;
                this.setState({ integrationSettings: [estateSettings] });
              }}
              value={this.getEstateIntegrationSettings().wfsId}
            >
              {this.state.searchableLayers.map((l) => {
                return (
                  <option key={l.id} value={l.id.toString()}>
                    {l.internalLayerName?.length > 0
                      ? l.internalLayerName
                      : l.caption}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label htmlFor="estate_settings_searchKey">
              Fält för sökning i fastighets-WFS
            </label>
            <input
              id="estate_settings_searchKey"
              value={this.getEstateIntegrationSettings().searchKey}
              type="text"
              name="estate_settings_searchKey"
              onChange={(e) => {
                const sk = e.target.value;
                const estateSettings = this.getEstateIntegrationSettings();
                estateSettings.searchKey = sk;
                this.setState({ integrationSettings: [estateSettings] });
              }}
            />
          </div>
          <div>
            <label htmlFor="estate_settings_wmsId">Id för fastighets-WMS</label>
            <input
              id="estate_settings_wmsId"
              value={this.getEstateIntegrationSettings().wmsId}
              type="text"
              name="estate_settings_wmsId"
              onChange={(e) => {
                const id = e.target.value;
                const estateSettings = this.getEstateIntegrationSettings();
                estateSettings.wmsId = id;
                this.setState({ integrationSettings: [estateSettings] });
              }}
            />
          </div>
          {this.renderVisibleForGroups()}
        </form>
      </div>
    );
  }
}

export default ToolOptions;
