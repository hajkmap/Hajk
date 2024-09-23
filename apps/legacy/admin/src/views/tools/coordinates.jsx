import React from "react";
import { Component } from "react";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import RemoveIcon from "@material-ui/icons/Remove";
import SaveIcon from "@material-ui/icons/SaveSharp";
import { withStyles } from "@material-ui/core/styles";
import { red, green, blue } from "@material-ui/core/colors";

const ColorButtonRed = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

var defaultState = {
  validationErrors: [],
  transformations: [],
  active: false,
  index: 0,
  target: 0,
  instruction: "",
  visibleAtStart: false,
  thousandSeparator: false,
  showFieldsOnStart: false,
  src: "marker.png",
  scale: 0.15,
  anchorX: 0.5,
  anchorY: 1,
  visibleForGroups: [],
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "coordinates";

    this.renderVisibleForGroups = this.renderVisibleForGroups.bind(this);
    this.handleAuthGrpsChange = this.handleAuthGrpsChange.bind(this);
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        target: tool.options.target || "toolbar",
        position: tool.options.position,
        width: tool.options.width,
        height: tool.options.height,
        instruction: tool.options.instruction,
        transformations: tool.options.transformations || [],
        visibleAtStart: tool.options.visibleAtStart,
        thousandSeparator: tool.options.thousandSeparator,
        showFieldsOnStart: tool.options.showFieldsOnStart,
        src: tool.options.src || this.state.src,
        scale: tool.options.scale || this.state.scale,
        anchorX: tool.options.anchor ? tool.options.anchor[0] : this.state.anchorX,
        anchorY: tool.options.anchor ? tool.options.anchor[1] : this.state.anchorY,
        visibleForGroups: tool.options.visibleForGroups
          ? tool.options.visibleForGroups
          : [],
      });
    } else {
      this.setState({
        active: false,
      });
    }
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
        position: this.state.position,
        width: this.state.width,
        height: this.state.height,
        instruction: this.state.instruction,
        transformations: this.state.transformations,
        visibleAtStart: this.state.visibleAtStart,
        thousandSeparator: this.state.thousandSeparator,
        showFieldsOnStart: this.state.showFieldsOnStart,
        src: this.state.src,
        scale: this.state.scale,
        anchor: [this.state.anchorX, this.state.anchorY],
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
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
            this.setState({
              transformations: [],
            });
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

  addTransformation(e) {
    var elements = this.refs.transformationForm.elements,
      transformation = {
        code: elements["code"].value,
        precision: elements["precision"].value,
        default: elements["default"].checked,
        hint: elements["hint"].value,
        title: elements["title"].value,
        xtitle: elements["xtitle"].value,
        ytitle: elements["ytitle"].value,
        inverseAxis: elements["inverseAxis"].checked,
      };
    this.state.transformations.push(transformation);
    this.setState({
      transformations: this.state.transformations,
    });
  }

  removeTransformation(code) {
    this.setState({
      transformations: this.state.transformations.filter(
        (f) => f.code !== code
      ),
    });
  }

  renderTransformations() {
    return this.state.transformations.map((t, i) => (
      <div key={i} className="inset-form">
        <div>
          <ColorButtonRed
            variant="contained"
            className="btn"
            onClick={() => this.removeTransformation(t.code)}
            startIcon={<RemoveIcon />}
          >
            Ta bort
          </ColorButtonRed>
        </div>
        <div>
          <span>SRS-kod</span>: <span>{t.code}</span>
        </div>
        <div>
          <span>Standard</span>: <span>{t.default ? "Ja" : "Nej"}</span>
        </div>
        <div>
          <span>Beskrivning</span>: <span>{t.hint}</span>
        </div>
        <div>
          <span>Titel</span>: <span>{t.title}</span>
        </div>
        <div>
          <span>X-etikett</span>: <span>{t.xtitle}</span>
        </div>
        <div>
          <span>Y-etikett</span>: <span>{t.ytitle}</span>
        </div>
        <div>
          <span>Precision</span>: <span>{t.precision}</span>
        </div>
        <div>
          <span>Inverterad</span>: <span>{t.inverseAxis ? "Ja" : "Nej"}</span>
        </div>
      </div>
    ));
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
          <div className="separator">Ikon</div>
          <div>
            <label htmlFor="src">URL till bild</label>
            <input
              value={this.state.src}
              type="text"
              name="src"
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
              min="0"
              max="100"
              step="0.1"
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
              type="number"
              min="0"
              max="100"
              step="0.1"
              name="anchorY"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="scale">Skala för ikon</label>
            <input
              value={this.state.scale}
              type="number"
              step="0.01"
              min="0.01"
              max="10"
              name="scale"
              onChange={e => {
                this.handleInputChange(e);
              }}
            />
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
              id="thousandSeparator"
              name="thousandSeparator"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.thousandSeparator}
            />
            &nbsp;
            <label htmlFor="thousandSeparator">
              Formattera nummer (1000 -&gt; 1 000)
            </label>
          </div>
          <div>
            <input
              id="showFieldsOnStart"
              name="showFieldsOnStart"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.showFieldsOnStart}
            />
            &nbsp;
            <label htmlFor="showFieldsOnStart">
              Visa projektionsfälten från start
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
          {this.renderVisibleForGroups()}
          <div>
            <div>Transformationer</div>
            {this.renderTransformations()}
          </div>
          <div>
            <form
              ref="transformationForm"
              onSubmit={(e) => {
                e.preventDefault();
                this.addTransformation(e);
              }}
            >
              <div>
                <label>SRS-kod*</label>
                <input name="code" type="text" />
              </div>
              <div>
                <input name="default" type="checkbox" />
                &nbsp;
                <label>Standard*</label>
              </div>
              <div>
                <label>Beskrivning*</label>
                <input name="hint" type="text" />
              </div>
              <div>
                <label>Titel*</label>
                <input name="title" type="text" />
              </div>
              <div>
                <label>X-etikett*</label>
                <input name="xtitle" type="text" />
              </div>
              <div>
                <label>Y-etikett*</label>
                <input name="ytitle" type="text" />
              </div>
              <div>
                <label>Precision (antal decimaler)</label>
                <input
                  name="precision"
                  type="number"
                  min="0"
                  max="7"
                  step="1"
                />
              </div>
              <div>
                <input name="inverseAxis" type="checkbox" />
                &nbsp;
                <label>Inverterad</label>
              </div>
              <ColorButtonGreen
                variant="contained"
                className="btn"
                type="submit"
                startIcon={<AddIcon />}
              >
                Lägg till
              </ColorButtonGreen>
            </form>
          </div>
        </form>
      </div>
    );
  }
}

export default ToolOptions;
