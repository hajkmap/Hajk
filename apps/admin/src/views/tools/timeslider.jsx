import React, { Component } from "react";
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
  icons: "",
  visibleAtStart: false,
  instruction: "",
  activeLayers: [],
  layers: [],
  defaultResolution: "years",
};

class ToolOptions extends Component {
  constructor() {
    super();
    this.state = defaultState;
    this.type = "timeslider";
  }

  componentDidMount() {
    const tool = this.getTool();
    const layers = this.getLayersWithDates();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        target: tool.options.target || "toolbar",
        position: tool.options.position,
        width: tool.options.width,
        height: tool.options.height,
        icons: tool.options.icons,
        visibleAtStart: tool.options.visibleAtStart,
        instruction: tool.options.instruction,
        layers: layers,
        activeLayers: tool.options.layers ?? [],
        defaultResolution: tool.options.defaultResolution ?? "years",
      });
    } else {
      this.setState({
        active: false,
        layers: layers,
      });
    }
  }

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    let value = target.type === "checkbox" ? target.checked : target.value;
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
    const tool = {
      type: this.type,
      index: this.state.index,
      options: {
        target: this.state.target,
        position: this.state.position,
        width: this.state.width,
        height: this.state.height,
        visibleAtStart: this.state.visibleAtStart,
        instruction: this.state.instruction,
        icons: this.state.icons,
        proxyUrl: this.state.proxyUrl,
        layers: this.state.activeLayers,
        defaultResolution: this.state.defaultResolution,
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

  getLayersWithDates = () => {
    return this.props.model.get("layers").filter((layer) => {
      //8 to follow xxxxmmdd-format...
      return (
        layer.timeSliderStart?.length === 8 && layer.timeSliderEnd?.length === 8
      );
    });
  };

  renderServices() {
    const { layers } = this.state;
    if (layers) {
      return layers.map((layer, i) => {
        let active = this.state.activeLayers.find(
          (layerId) => layerId === layer.id
        );
        if (active === undefined) {
          active = false;
        }
        return (
          <li key={i}>
            <input
              id={layer.id}
              name={layer.caption}
              type="checkbox"
              checked={active}
              onChange={(e) => {
                let actives = [...this.state.activeLayers];
                if (e.target.checked) {
                  actives.push(layer.id);
                } else {
                  actives = actives.filter((layerId) => layerId !== layer.id);
                }
                this.setState({
                  activeLayers: actives,
                });
              }}
            />
            &nbsp;
            <label htmlFor={layer.id}>{layer.caption}</label>
          </li>
        );
      });
    } else {
      return null;
    }
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
          <div className="separator">Övriga inställningar</div>
          <div>
            <label>
              Tjänster{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Markera vilka tjänster som ska användas i tidslinjen."
              />
            </label>
            <ul
              style={{
                display: "inline-block",
                padding: 0,
              }}
            >
              {this.renderServices()}
            </ul>
          </div>
          <div>
            <label>
              Upplösning{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Välj hur stort steg som ska tas varje gång tidslinjen uppdateras."
              />
            </label>
            <select
              id="defaultResolution"
              name="defaultResolution"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.defaultResolution}
            >
              <option value="days">En dag</option>
              <option value="months">En månad</option>
              <option value="years">Ett år</option>
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
        </form>
      </div>
    );
  }
}

export default ToolOptions;
