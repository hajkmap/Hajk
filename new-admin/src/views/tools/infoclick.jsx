import React, { Component } from "react";
import { SketchPicker } from "react-color";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/Save";
import { withStyles } from "@material-ui/core/styles";
import { blue } from "@material-ui/core/colors";

var defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  visibleForGroups: [],
  title: "Infoclick",
  linksColor: "primary",
  linksUnderline: "always",
  position: "right",
  width: 400,
  height: 300,
  src: "marker.png",
  scale: 0.15,
  strokeColor: { r: 200, b: 0, g: 0, a: 0.7 },
  strokeWidth: 4,
  fillColor: { r: 255, b: 0, g: 0, a: 0.1 },
  anchorX: 0.5,
  anchorY: 1,
  allowDangerousHtml: true,
  useNewInfoclick: false,
  useNewPlaceholderMatching: false,
  transformLinkUri: true,
};

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "infoclick";
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        title: tool.options.title,
        position: tool.options.position,
        linksColor: tool.options.linksColor,
        linksUnderline: tool.options.linksUnderline,
        width: tool.options.width,
        height: tool.options.height,
        src: tool.options.src,
        scale: tool.options.scale || this.state.scale,
        strokeColor: tool.options.strokeColor || this.state.strokeColor,
        strokeWidth: tool.options.strokeWidth || this.state.strokeWidth,
        fillColor: tool.options.fillColor || this.state.fillColor,
        anchorX: tool.options.anchor[0] || this.state.anchorX,
        anchorY: tool.options.anchor[1] || this.state.anchorY,
        allowDangerousHtml:
          tool.options.allowDangerousHtml || this.state.allowDangerousHtml,
        useNewInfoclick:
          tool.options.useNewInfoclick || this.state.useNewInfoclick,
        useNewPlaceholderMatching:
          tool.options.useNewPlaceholderMatching ||
          this.state.useNewPlaceholderMatching,
        transformLinkUri:
          tool.options.transformLinkUri ?? this.state.transformLinkUri,
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
    const target = event.target;
    const name = target.name;
    var value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
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
      }
    });
  }

  save() {
    var tool = {
      type: this.type,
      index: this.state.index,
      options: {
        title: this.state.title,
        position: this.state.position,
        linksColor: this.state.linksColor,
        linksUnderline: this.state.linksUnderline,
        width: this.state.width,
        height: this.state.height,
        anchor: [this.state.anchorX, this.state.anchorY],
        scale: this.state.scale,
        src: this.state.src,
        strokeColor: this.state.strokeColor,
        strokeWidth: this.state.strokeWidth,
        fillColor: this.state.fillColor,
        allowDangerousHtml: this.state.allowDangerousHtml,
        useNewInfoclick: this.state.useNewInfoclick,
        useNewPlaceholderMatching: this.state.useNewPlaceholderMatching,
        transformLinkUri: this.state.transformLinkUri,
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
            <label htmlFor="title">
              Titel{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Rubrik som visas i infoclick-fönstret"
              />
            </label>
            <input
              id="title"
              name="title"
              placeholder={defaultState.title}
              type="text"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.title}
            />
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
              placeholder={defaultState.width}
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
              placeholder={defaultState.height}
              type="text"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.height}
            />
          </div>
          <div className="separator">Generella inställningar</div>
          {this.renderVisibleForGroups()}
          <div>
            <input
              id="allowDangerousHtml"
              name="allowDangerousHtml"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.allowDangerousHtml}
            />
            &nbsp;
            <label htmlFor="allowDangerousHtml">Tillåt HTML i infoclick</label>
          </div>
          <div>
            <input
              id="useNewInfoclick"
              name="useNewInfoclick"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.useNewInfoclick}
            />
            &nbsp;
            <label htmlFor="useNewInfoclick" style={{ width: "auto" }}>
              Använd ny Infoclick-variant (se GitHub issue #1034)
            </label>
          </div>
          <div>
            <input
              id="useNewPlaceholderMatching"
              name="useNewPlaceholderMatching"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.useNewPlaceholderMatching}
            />
            &nbsp;
            <label
              htmlFor="useNewPlaceholderMatching"
              style={{ width: "auto" }}
            >
              Tillåt fler tecken, bl a MarkDown, som del av infoclicks{" "}
              <i>placeholder</i> (se GitHub issue #1368)
            </label>
          </div>
          <div>
            <input
              id="transformLinkUri"
              name="transformLinkUri"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.transformLinkUri}
            />
            &nbsp;
            <label htmlFor="transformLinkUri" style={{ width: "auto" }}>
              URL-verifiering aktiverad. (Verifieringen måste avaktiveras för
              att tillåta länkar till desktop-programvaror.)
            </label>
          </div>
          <div className="separator">Länkarnas utseende</div>

          <div>
            <label htmlFor="linksColor">
              Färg{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Länkarnas färg. Se MUI:s dokumentation på https://mui.com/material-ui/react-link/"
              />
            </label>
            <select
              id="linksColor"
              name="linksColor"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.linksColor}
            >
              <option value="primary">primary</option>
              <option value="secondary">secondary</option>
              <option value="inherit">inherit</option>
            </select>
          </div>
          <div>
            <label htmlFor="linksUnderline">
              Understuket{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Om länktexten ska vara understruken. Se MUI:s dokumentation på https://mui.com/material-ui/react-link/"
              />
            </label>
            <select
              id="linksUnderline"
              name="linksUnderline"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.linksUnderline}
            >
              <option value="always">always</option>
              <option value="hover">hover</option>
              <option value="no">no</option>
            </select>
          </div>

          <div className="separator">Ikon och markering</div>
          <div>
            <label htmlFor="src">URL till bild</label>
            <input
              value={this.state.src}
              type="text"
              name="src"
              placeholder="Lämnas tomt för en cirkel, alternativ ange URL till ikon."
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
              placeholder={defaultState.anchorX}
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
              placeholder={defaultState.anchorY}
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
            <label htmlFor="scale">Skala för icon</label>
            <input
              value={this.state.scale}
              type="number"
              placeholder={defaultState.scale}
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
          <div>
            <label htmlFor="strokeWidth">Bredd på markeringens ram (px)</label>
            <input
              value={this.state.strokeWidth}
              type="number"
              placeholder={defaultState.strokeWidth}
              min="0"
              max="100"
              step="1"
              name="strokeWidth"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div className="clearfix">
            <span className="pull-left">
              <div>
                <label className="long-label" htmlFor="strokeColor">
                  Färg på markerings ram (rgba)
                </label>
              </div>
              <div>
                <SketchPicker
                  color={{
                    r: this.state.strokeColor.r,
                    b: this.state.strokeColor.b,
                    g: this.state.strokeColor.g,
                    a: this.state.strokeColor.a,
                  }}
                  onChangeComplete={(color) =>
                    this.handleColorChange("strokeColor", color)
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <label className="long-label" htmlFor="fillColor">
                  Färg på markeringens fyllnad (rgba)
                </label>
              </div>
              <div>
                <SketchPicker
                  color={{
                    r: this.state.fillColor.r,
                    b: this.state.fillColor.b,
                    g: this.state.fillColor.g,
                    a: this.state.fillColor.a,
                  }}
                  onChangeComplete={(color) =>
                    this.handleColorChange("fillColor", color)
                  }
                />
              </div>
            </span>
          </div>
        </form>
      </div>
    );
  }
}

export default ToolOptions;
