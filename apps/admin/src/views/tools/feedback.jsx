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

const DEFAULT_OPTIONS = {
  title: "Tyck till",
  description: "Skicka synpunkter till oss",
  instructionText:
    "Har du synpunkter på kartan eller dess innehåll? Skriv dem här.",
  thankYouText: "Tack för din återkoppling!",
  maxLength: 2000,
};

const defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  target: "toolbar",
  position: "left",
  width: 400,
  height: "dynamic",
  visibleAtStart: false,
  visibleAtStartMobile: false,
  visibleForGroups: [],
  ...DEFAULT_OPTIONS,
};

class ToolOptions extends Component {
  constructor() {
    super();
    this.state = defaultState;
    this.type = "feedback";
  }

  componentDidMount() {
    const tool = this.getTool();
    if (tool) {
      const options = tool.options || {};
      this.setState({
        active: true,
        index: tool.index,
        target: options.target || "toolbar",
        position: options.position || defaultState.position,
        width: options.width ?? "",
        height: options.height ?? "",
        visibleAtStart: options.visibleAtStart ?? false,
        visibleAtStartMobile: options.visibleAtStartMobile ?? false,
        visibleForGroups: options.visibleForGroups
          ? options.visibleForGroups
          : [],
        title: options.title ?? DEFAULT_OPTIONS.title,
        description: options.description ?? DEFAULT_OPTIONS.description,
        instructionText:
          options.instructionText ?? DEFAULT_OPTIONS.instructionText,
        thankYouText: options.thankYouText ?? DEFAULT_OPTIONS.thankYouText,
        maxLength: options.maxLength ?? DEFAULT_OPTIONS.maxLength,
      });
    } else {
      this.setState({
        active: false,
      });
    }
  }

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    let value = target.type === "checkbox" ? target.checked : target.value;
    // Only coerce numeric inputs - free text (e.g. title) must stay a string.
    if (target.type === "number" && value !== "") {
      value = Number(value);
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

  remove() {
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

  showAlert(message, extra = {}) {
    this.props.parent.props.parent.setState({
      alert: true,
      alertMessage: message,
      ...extra,
    });
  }

  save() {
    const maxLength = Number(this.state.maxLength);
    if (this.state.active && !(Number.isInteger(maxLength) && maxLength > 0)) {
      this.showAlert("Max antal tecken måste vara ett positivt heltal.");
      return;
    }

    const tool = {
      type: this.type,
      index: this.state.index,
      options: {
        target: this.state.target,
        position: this.state.position,
        width: this.state.width,
        height: this.state.height,
        visibleAtStart: this.state.visibleAtStart,
        visibleAtStartMobile: this.state.visibleAtStartMobile,
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
        title: this.state.title,
        description: this.state.description,
        instructionText: this.state.instructionText,
        thankYouText: this.state.thankYouText,
        maxLength: maxLength,
      },
    };

    const existing = this.getTool();

    function update() {
      this.props.model.updateToolConfig(
        this.props.model.get("toolConfig"),
        () => {
          this.showAlert("Uppdateringen lyckades");
        }
      );
    }

    if (!this.state.active) {
      if (existing) {
        this.showAlert(
          "Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?",
          {
            confirm: true,
            confirmAction: () => {
              this.remove();
              update.call(this);
              this.setState(defaultState);
            },
          }
        );
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
    const value = event.target.value;
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

  renderHelpLabel(id, text, help) {
    return (
      <label htmlFor={id}>
        {text}{" "}
        <i
          className="fa fa-question-circle"
          data-toggle="tooltip"
          title={help}
        />
      </label>
    );
  }

  renderCheckbox(name, label) {
    return (
      <div>
        <input
          id={name}
          name={name}
          type="checkbox"
          onChange={(e) => {
            this.handleInputChange(e);
          }}
          checked={this.state[name]}
        />
        &nbsp;
        <label htmlFor={name}>{label}</label>
      </div>
    );
  }

  renderWindowSettings() {
    return (
      <>
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
          {this.renderHelpLabel(
            "position",
            "Fönsterplacering",
            "Placering av verktygets fönster. Anges som antingen 'left' eller 'right'."
          )}
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
          {this.renderHelpLabel(
            "width",
            "Fönsterbredd",
            "Bredd i pixlar på verktygets fönster. Anges som ett numeriskt värde. Lämna tomt för att använda standardbredd."
          )}
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
          {this.renderHelpLabel(
            "height",
            "Fönsterhöjd",
            "Höjd i pixlar på verktygets fönster. Anges antingen numeriskt (pixlar), 'dynamic' för att automatiskt anpassa höjden efter innehållet eller 'auto' att använda maximal höjd."
          )}
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
        {this.renderCheckbox("visibleAtStart", "Synlig vid start")}
        {this.renderCheckbox(
          "visibleAtStartMobile",
          "Synlig vid start (mobil)"
        )}
      </>
    );
  }

  renderPluginSettings() {
    return (
      <>
        <div className="separator">Presentation</div>
        <div>
          <label htmlFor="title">Titel</label>
          <input
            id="title"
            name="title"
            type="text"
            onChange={(e) => {
              this.handleInputChange(e);
            }}
            value={this.state.title}
          />
        </div>
        <div>
          {this.renderHelpLabel(
            "description",
            "Beskrivning",
            "Om verktyget visas som widget (inställningen 'Verktygsplacering' sätts till 'left' eller 'right') så kommer denna beskrivning att visas inne i widget-knappen."
          )}
          <input
            id="description"
            name="description"
            type="text"
            onChange={(e) => {
              this.handleInputChange(e);
            }}
            value={this.state.description}
          />
        </div>
        <div>
          {this.renderHelpLabel(
            "instructionText",
            "Instruktionstext",
            "Visas ovanför textfältet där användaren skriver sin återkoppling."
          )}
          <textarea
            id="instructionText"
            name="instructionText"
            onChange={(e) => {
              this.handleInputChange(e);
            }}
            value={this.state.instructionText}
          />
        </div>
        <div>
          {this.renderHelpLabel(
            "thankYouText",
            "Tack-text",
            "Visas för användaren när återkopplingen har skickats."
          )}
          <textarea
            id="thankYouText"
            name="thankYouText"
            onChange={(e) => {
              this.handleInputChange(e);
            }}
            value={this.state.thankYouText}
          />
        </div>
        <div>
          {this.renderHelpLabel(
            "maxLength",
            "Max antal tecken",
            "Maximalt antal tecken i ett meddelande. Kan inte överstiga backendens FEEDBACK_MAX_MESSAGE_LENGTH."
          )}
          <input
            id="maxLength"
            name="maxLength"
            type="number"
            min="1"
            className="control-fixed-width"
            onChange={(e) => {
              this.handleInputChange(e);
            }}
            value={this.state.maxLength}
          />
          <small style={{ display: "block", color: "#666" }}>
            Värdet kan inte överstiga FEEDBACK_MAX_MESSAGE_LENGTH i backendens
            .env (backenden avvisar längre meddelanden).
          </small>
        </div>
      </>
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
          {this.renderCheckbox("active", "Aktiverad")}
          <div
            style={{
              marginTop: 10,
              padding: 10,
              background: "#f5f5f5",
              borderRadius: 4,
            }}
          >
            Verktyget kräver att funktionen även är aktiverad i backend med{" "}
            <strong>FEEDBACK_ACTIVE=true</strong> i <code>.env</code>. Inkommen
            feedback kan läsas under fliken "Feedback".
          </div>
          {this.renderWindowSettings()}
          {this.renderPluginSettings()}
          {this.renderVisibleForGroups()}
        </form>
      </div>
    );
  }
}

export default ToolOptions;
