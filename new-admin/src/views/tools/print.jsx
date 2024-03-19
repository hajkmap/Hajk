import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/SaveSharp";
import { withStyles } from "@material-ui/core/styles";
import { blue } from "@material-ui/core/colors";
import { MenuItem, Select } from "@material-ui/core";
import { SketchPicker } from "react-color";

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
  active: false,
  index: 0,
  target: "toolbar",
  instruction: "",
  copyright: "",
  disclaimer: "",
  date: "",
  scales: "200, 400, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000",
  scaleMeters:
    "10, 10, 20, 40, 60, 100, 100, 300, 600, 2000, 4000, 8000, 10000, 160000",
  dpis: "72, 150, 300",
  paperFormats: "A2, A3, A4",
  logo: "https://github.com/hajkmap/Hajk/raw/master/design/logo_small.png",
  logoMaxWidth: 40,
  northArrowMaxWidth: 10,
  northArrow: "",
  visibleForGroups: [],
  visibleAtStart: false,
  includeLogo: true,
  logoPlacement: "topRight",
  includeQrCode: false,
  qrCodePlacement: "topRight",
  includeScaleBar: true,
  scaleBarPlacement: "bottomLeft",
  includeNorthArrow: true,
  northArrowPlacement: "topLeft",
  useMargin: false,
  useTextIconsInMargin: false,
  mapTextColor: "#000000",
  useCustomTileLoaders: true,
  includeImageBorder: false,
  maxTileSize: 4096,
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "print";
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        target: tool.options.target || "toolbar",
        copyright: tool.options.copyright || this.state.copyright,
        disclaimer: tool.options.disclaimer || this.state.disclaimer,
        date: tool.options.date || this.state.date,
        position: tool.options.position,
        width: tool.options.width,
        height: tool.options.height,
        instruction: tool.options.instruction,
        scales: tool.options.scales || this.state.scales,
        scaleMeters: tool.options.scaleMeters || this.state.scaleMeters,
        dpis: tool.options.dpis || this.state.dpis,
        paperFormats: tool.options.paperFormats || this.state.paperFormats,
        logo: tool.options.logo,
        logoMaxWidth: tool.options.logoMaxWidth || this.state.logoMaxWidth,
        northArrowMaxWidth:
          tool.options.northArrowMaxWidth || this.state.northArrowMaxWidth,
        northArrow: tool.options.northArrow || this.state.northArrow,
        useMargin:
          typeof tool.options.useMargin !== "undefined"
            ? tool.options.useMargin
            : this.state.useMargin,
        useTextIconsInMargin:
          typeof tool.options.useTextIconsInMargin !== "undefined"
            ? tool.options.useTextIconsInMargin
            : this.state.useTextIconsInMargin,
        mapTextColor: tool.options.mapTextColor || this.state.mapTextColor,
        visibleAtStart: tool.options.visibleAtStart,
        visibleForGroups: tool.options.visibleForGroups
          ? tool.options.visibleForGroups
          : [],
        includeLogo:
          tool.options.includeLogo === "boolean"
            ? tool.options.includeLogo
            : this.state.includeLogo,
        logoPlacement: tool.options.logoPlacement || this.state.logoPlacement,
        includeQrCode:
          tool.options.includeQrCode === "boolean"
            ? tool.options.includeQrCode
            : this.state.includeQrCode,
        qrCodePlacement:
          tool.options.qrCodePlacement || this.state.qrCodePlacement,
        includeScaleBar:
          tool.options.includeScaleBar === "boolean"
            ? tool.options.includeScaleBar
            : this.state.includeScaleBar,
        scaleBarPlacement:
          tool.options.scaleBarPlacement || this.state.scaleBarPlacement,
        includeNorthArrow:
          tool.options.includeNorthArrow === "boolean"
            ? tool.options.includeNorthArrow
            : this.state.includeNorthArrow,
        northArrowPlacement:
          tool.options.northArrowPlacement || this.state.northArrowPlacement,
        includeImageBorder:
          tool.options.includeImageBorder || this.state.includeImageBorder,
        useCustomTileLoaders:
          tool.options.useCustomTileLoaders ?? this.state.useCustomTileLoaders,
        maxTileSize: tool.options.maxTileSize || this.state.maxTileSize,
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
        copyright: this.state.copyright,
        disclaimer: this.state.disclaimer,
        date: this.state.date,
        width: this.state.width,
        height: this.state.height,
        scales: this.state.scales,
        scaleMeters: this.state.scaleMeters,
        logo: this.state.logo,
        logoMaxWidth: this.state.logoMaxWidth,
        northArrowMaxWidth: this.state.northArrowMaxWidth,
        dpis: this.state.dpis,
        paperFormats: this.state.paperFormats,
        northArrow: this.state.northArrow,
        useMargin: this.state.useMargin,
        useTextIconsInMargin: this.state.useTextIconsInMargin,
        mapTextColor: this.state.mapTextColor,
        instruction: this.state.instruction,
        visibleAtStart: this.state.visibleAtStart,
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
        includeLogo: this.state.includeLogo,
        logoPlacement: this.state.logoPlacement,
        includeQrCode: this.state.includeQrCode,
        qrCodePlacement: this.state.qrCodePlacement,
        includeScaleBar: this.state.includeScaleBar,
        scaleBarPlacement: this.state.scaleBarPlacement,
        includeNorthArrow: this.state.includeNorthArrow,
        northArrowPlacement: this.state.northArrowPlacement,
        includeImageBorder: this.state.includeImageBorder,
        useCustomTileLoaders: this.state.useCustomTileLoaders,
        maxTileSize: this.state.maxTileSize,
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

  renderPlacementSelect = (currentValue, name) => {
    return (
      <Select
        id={name}
        name={name}
        className="control-fixed-width"
        value={currentValue}
        onChange={(e) => {
          this.handleInputChange(e);
        }}
      >
        <MenuItem value={"topLeft"}>Uppe till vänster</MenuItem>
        <MenuItem value={"topRight"}>Uppe till höger</MenuItem>
        <MenuItem value={"bottomRight"}>Nere till höger</MenuItem>
        <MenuItem value={"bottomLeft"}>Nere till vänster</MenuItem>
      </Select>
    );
  };

  renderIncludeSelect = (currentValue, name) => {
    return (
      <Select
        id={name}
        name={name}
        value={currentValue}
        className="control-fixed-width"
        onChange={(e) => {
          this.handleInputChange(e);
        }}
      >
        <MenuItem value={true}>Ja</MenuItem>
        <MenuItem value={false}>Nej</MenuItem>
      </Select>
    );
  };

  renderUseCustomTileLoadersSelect = (currentValue, name) => {
    return (
      <Select
        id={name}
        name={name}
        value={currentValue}
        className="control-fixed-width"
        onChange={(e) => {
          this.handleInputChange(e);
        }}
      >
        <MenuItem value={true}>Ja</MenuItem>
        <MenuItem value={false}>Nej</MenuItem>
      </Select>
    );
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
          <div className="information-box">
            Tänk på att öka minnesanvändningen i GeoServer för WMS om du
            använder detta verktyg. Utskrifter med hög DPI och SingeTile kräver
            mycket minne. Standard för GeoServer är 128MB och det är inte säkert
            det räcker för att alla requests ska returneras korrekt. <br />
            <div className="separator">För att ändra minnesanvändningen</div>
            Logga in i GeoServer > Tjänster > WMS > Gränser för
            resursförbrukning > Max renderingsminne (KB)
          </div>
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
          <div className="separator">Inställningar för bildhantering</div>
          <div>
            <label htmlFor="includeLogo">
              Aktivera beräknad bildladdning{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Om aktivt kommer verktyget se till att förfrågningar mot WMS-servern inte överstiger serverns minesgräns. Denna inställning gör också att bilderna kommer efterfrågas med korrekt DPI."
              />
            </label>
            {this.renderUseCustomTileLoadersSelect(
              this.state.useCustomTileLoaders,
              "useCustomTileLoaders"
            )}
          </div>
          <div>
            <label htmlFor="disclaimer">
              Maximal Tile-storlek{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Om automatisk bildberäkning är satt till aktivt måste en maximal storlek på de framtagna bilderna anges. Värdet bör vara runt 4096."
              />
            </label>
            <input
              type="number"
              name="maxTileSize"
              value={this.state.maxTileSize}
              min={256}
              max={16384}
              step={1}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div className="separator">Inställningar för utskrift</div>
          <div>
            <label htmlFor="copyright">Copyright</label>
            <input
              type="text"
              name="copyright"
              value={this.state.copyright}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="disclaimer">Disclaimer</label>
            <input
              type="text"
              name="disclaimer"
              value={this.state.disclaimer}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="date">Date</label>
            <input
              type="text"
              name="date"
              value={this.state.date}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="scales">Skalor</label>
            <input
              type="text"
              name="scales"
              value={this.state.scales}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="scaleMeters">Skalmeter</label>
            <input
              type="text"
              name="scaleMeters"
              value={this.state.scaleMeters}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="dpis">DPIer</label>
            <input
              type="text"
              name="dpis"
              value={this.state.dpis}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="paperFormats">Pappersformat</label>
            <input
              type="text"
              name="paperFormats"
              value={this.state.paperFormats}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="logo">
              Logo{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Sökväg till logga att använda i utskrifterna. Kan vara relativ Hajk-root eller absolut."
              />
            </label>
            <input
              type="text"
              name="logo"
              value={this.state.logo}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="includeLogo">
              Inkludera logga{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Inställning för om loggan skall inkluderas som standard. Användarna kan ändra detta själva."
              />
            </label>
            {this.renderIncludeSelect(this.state.includeLogo, "includeLogo")}
          </div>
          <div>
            <label htmlFor="logoPlacement">
              Logoplacering{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Inställning för loggans standardplacering. Användarna kan ändra detta själva."
              />
            </label>
            {this.renderPlacementSelect(
              this.state.logoPlacement,
              "logoPlacement"
            )}
          </div>
          <div>
            <label htmlFor="logoMaxWidth">
              Logo maxbredd{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="0 betyder att storleken på loggans bild används"
              />
            </label>
            <input
              id="logoMaxWidth"
              name="logoMaxWidth"
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.logoMaxWidth}
            />
          </div>
          <div>
            <label htmlFor="logo">
              Norrpil{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Sökväg till norrpil att använda i utskrifterna. Kan vara relativ Hajk-root eller absolut."
              />
            </label>
            <input
              type="text"
              name="northArrow"
              value={this.state.northArrow}
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="includeNorthArrow">
              Inkludera norrpil{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Inställning för om norrpilen skall inkluderas som standard. Användarna kan ändra detta själva."
              />
            </label>
            {this.renderIncludeSelect(
              this.state.includeNorthArrow,
              "includeNorthArrow"
            )}
          </div>
          <div>
            <label htmlFor="logoPlacement">
              Norrpilsplacering{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Inställning för norrpilens standardplacering. Användarna kan ändra detta själva."
              />
            </label>
            {this.renderPlacementSelect(
              this.state.northArrowPlacement,
              "northArrowPlacement"
            )}
          </div>

          <div>
            <label htmlFor="northArrowMaxWidth">
              Norrpil maxbredd{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="0 betyder att storleken på loggans bild används"
              />
            </label>
            <input
              id="northArrowMaxWidth"
              name="northArrowMaxWidth"
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.northArrowMaxWidth}
            />
          </div>

          <div>
            <label htmlFor="includeScaleBar">
              Inkludera skalstock{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Inställning för om skalstocken skall inkluderas som standard. Användarna kan ändra detta själva."
              />
            </label>
            {this.renderIncludeSelect(
              this.state.includeScaleBar,
              "includeScaleBar"
            )}
          </div>
          <div>
            <label htmlFor="logoPlacement">
              Skalstocksplacering{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Inställning för skalstockens standardplacering. Användarna kan ändra detta själva."
              />
            </label>
            {this.renderPlacementSelect(
              this.state.scaleBarPlacement,
              "scaleBarPlacement"
            )}
          </div>
          <div>
            <label htmlFor="includeQrCode">
              Inkludera qr-kod{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Inställning för om qr-kod skall inkluderas som standard. Användarna kan ändra detta själva."
              />
            </label>
            {this.renderIncludeSelect(
              this.state.includeQrCode,
              "includeQrCode"
            )}
          </div>
          <div>
            <label htmlFor="qrCodePlacement">
              Qr-kodsplacering{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Inställning för qr-kodens standardplacering. Användarna kan ändra detta själva."
              />
            </label>
            {this.renderPlacementSelect(
              this.state.qrCodePlacement,
              "qrCodePlacement"
            )}
          </div>
          <div>
            <label htmlFor="includeImageBorder">
              Inkludera bildram{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Inställning för om kartbildsram skall inkluderas som standard."
              />
            </label>
            {this.renderIncludeSelect(
              this.state.includeImageBorder,
              "includeImageBorder"
            )}
          </div>
          <div>
            <input
              id="useMargin"
              name="useMargin"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.useMargin}
            />
            &nbsp;
            <label htmlFor="useMargin">Marginal runt karta (förval)</label>
          </div>
          <div>
            <input
              id="useTextIconsInMargin"
              name="useTextIconsInMargin"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.useTextIconsInMargin}
            />
            &nbsp;
            <label htmlFor="useMargin">
              Rubriktext m.m. i marginalerna (förval)
            </label>
          </div>
          <div>
            <div>
              Textfärg{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Inställning för textens förvalda färg."
              />
            </div>
            <SketchPicker
              color={this.state.mapTextColor}
              onChangeComplete={(e) => this.setState({ mapTextColor: e.hex })}
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
              value={
                this.state.instruction
                  ? atob(this.state.instruction)
                  : "Utskriften sker på klienten och inte på servern som den gamla gjorde."
              }
            />
          </div>
          {this.renderVisibleForGroups()}
        </form>
      </div>
    );
  }
}

export default ToolOptions;
