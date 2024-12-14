import React from "react";
import { Component } from "react";
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
};

class LayerComparer extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "layercomparer";
    this.handleLayerToggle = this.handleLayerToggle.bind(this);
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
    } else {
      this.setState({
        active: false,
      });
    }
  }

  handleLayerToggle(layer) {
    this.setState((prevState) => {
      const { chosenLayers } = prevState;
      const exists = chosenLayers.some(
        (chosenLayer) => chosenLayer.id === layer.id
      );

      if (exists) {
        return { chosenLayers: chosenLayers.filter((l) => l.id !== layer.id) };
      } else {
        return {
          chosenLayers: [
            ...chosenLayers,
            { id: layer.id, caption: layer.caption },
          ],
        };
      }
    });
  }

  renderLayersList() {
    const allLayers = this.props.model.get("layers");
    const { chosenLayers, selectChosenLayers } = this.state;

    if (!allLayers || !Array.isArray(allLayers)) {
      return <div>Inga lager tillgängliga.</div>;
    }

    return (
      <>
        <h3>Välj lager:</h3>
        <ul>
          {allLayers.map((layer) => {
            const isChecked = chosenLayers.some(
              (chosenLayer) => chosenLayer.id === layer.id
            );
            return (
              <li key={layer.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={!selectChosenLayers}
                    onChange={() => this.handleLayerToggle(layer)}
                  />
                  {layer.caption || layer.name || layer.id}
                </label>
              </li>
            );
          })}
        </ul>
      </>
    );
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
            <label>
              <input
                type="checkbox"
                checked={this.state.selectChosenLayers}
                onChange={(e) => {
                  const checked = e.target.checked;
                  this.setState((prevState) => ({
                    selectChosenLayers: checked,
                    chosenLayers: checked ? prevState.chosenLayers : [],
                  }));
                }}
              />
              Aktivera "Välj lager"
            </label>
            {this.renderLayersList()}
          </div>

          {this.renderVisibleForGroups()}
        </form>
      </div>
    );
  }
}

export default LayerComparer;
