import React from "react";
import { Component } from "react";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/SaveSharp";
import { withStyles } from "@material-ui/core/styles";
import { blue } from "@material-ui/core/colors";
import LayerComparerLayerList from "../components/LayerComparerLayerList";

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
  validationErrors: [],
  active: false,
  index: 0,
  target: "toolbar",
  showNonBaseLayersInSelect: false,
  instruction: "",
  visibleAtStart: false,
  visibleForGroups: [],
  chosenLayers: [],
  selectChosenLayers: false,
  layers: [],
};

class LayerComparer extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "layercomparer";
  }

  componentDidMount() {
    const tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        target: tool.options.target || "toolbar",
        showNonBaseLayersInSelect: tool.options.showNonBaseLayersInSelect,
        instruction: tool.options.instruction,
        visibleAtStart: tool.options.visibleAtStart,
        visibleForGroups: tool.options.visibleForGroups
          ? tool.options.visibleForGroups
          : [],
        chosenLayers: tool.options.chosenLayers
          ? tool.options.chosenLayers
          : [],
        selectChosenLayers: tool.options.selectChosenLayers,
      });
      this.loadLayers();
    } else {
      this.setState({
        active: false,
      });
    }
  }

  handleSelectChosenLayersChange = (checked) => {
    this.setState((prevState) => ({
      selectChosenLayers: checked,
      chosenLayers: checked ? prevState.chosenLayers : [],
      showNonBaseLayersInSelect: checked
        ? false
        : prevState.showNonBaseLayersInSelect,
    }));

    if (checked) {
      this.loadLayers();
    }
  };

  getLayersFromGroupsAndBaselayers(options) {
    const layers = [];

    function collectLayersFromGroup(group) {
      if (group.layers) {
        layers.push(...group.layers);
      }
      if (group.groups) {
        group.groups.forEach(collectLayersFromGroup);
      }
    }

    if (options.groups) {
      options.groups.forEach(collectLayersFromGroup);
    }

    if (options.baselayers) {
      layers.push(...options.baselayers);
    }

    return layers;
  }

  loadLayers() {
    const toolConfig = this.props.model.get("toolConfig");
    const layerswitcherTool = toolConfig.find(
      (tool) => tool.type === "layerswitcher"
    );

    if (!layerswitcherTool) {
      console.error("LayerSwitcher not found in toolConfig.");
      return;
    }

    const layerSwitcherLayers = this.getLayersFromGroupsAndBaselayers(
      layerswitcherTool.options
    );

    const allLayers = this.props.model.get("layers");

    const comparedLayers = layerSwitcherLayers
      .filter((lsLayer) => allLayers.some((al) => al.id === lsLayer.id))
      .map((lsLayer) => {
        const realLayer = allLayers.find((al) => al.id === lsLayer.id);
        return {
          id: realLayer.id,
          caption: realLayer.caption || "Okänt lager",
        };
      });

    this.setState({ layers: comparedLayers });
  }

  /**
   *
   */

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
        showNonBaseLayersInSelect: this.state.showNonBaseLayersInSelect,
        instruction: this.state.instruction,
        visibleAtStart: this.state.visibleAtStart,
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
        chosenLayers: this.state.chosenLayers,
        selectChosenLayers: this.state.selectChosenLayers,
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

    this.setState({
      visibleForGroups: value !== "" ? groups : [],
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
            onChange={(e) => {
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
    const { layers } = this.state;
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
          <div className="separator">Övriga inställningar</div>
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
            <input
              id="input-showNonBaseLayersInSelect"
              name="showNonBaseLayersInSelect"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.showNonBaseLayersInSelect}
              disabled={this.state.selectChosenLayers}
            />
            &nbsp;
            <label
              className="long-label"
              htmlFor="input-showNonBaseLayersInSelect"
            >
              Visa (utöver bakgrundslager) även vanliga kartlager som valbara i
              jämföraren.
            </label>
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
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.instruction ? atob(this.state.instruction) : ""}
            />
          </div>
          <div>
            <label style={{ paddingBottom: "20px" }}>
              <input
                type="checkbox"
                checked={this.state.selectChosenLayers}
                onChange={(e) =>
                  this.handleSelectChosenLayersChange(e.target.checked)
                }
              />
              Aktivera "Välj lager"
            </label>
          </div>
          <div>
            {this.state.selectChosenLayers && (
              <LayerComparerLayerList
                allLayers={layers}
                chosenLayers={this.state.chosenLayers}
                onChosenLayersChange={(updatedLayers) =>
                  this.setState({ chosenLayers: updatedLayers })
                }
              />
            )}
          </div>

          {this.renderVisibleForGroups()}
        </form>
      </div>
    );
  }
}

export default LayerComparer;
