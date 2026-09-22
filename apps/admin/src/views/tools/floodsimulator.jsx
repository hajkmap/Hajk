import React from "react";
import { Component } from "react";
import { SketchPicker } from "react-color";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/SaveSharp";
import { withStyles } from "@material-ui/core/styles";
import { blue } from "@material-ui/core/colors";
import DepthColorList from "../components/DepthColorList";

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
  title: "Översvämning",
  description: "Simulera en stigande vattennivå",
  elevationUrl: "",
  elevationEncoding: "terrarium",
  crossOrigin: "anonymous",
  tileSize: 256,
  minZoom: 0,
  maxZoom: 15,
  attributions: "",
  minLevel: 0,
  maxLevel: 10,
  levelStep: 0.01,
  defaultLevel: 1,
  animationDurationMs: 8000,
  showElevationReadout: true,
  minElevation: -100,
  maxElevation: 100,
  waterColor: "#86cbf9",
  deepWaterColor: "#283d4b",
  layerOpacity: 0.6,
  enableDepthShading: false,
  maxShadingDepth: 5,
  maxResolutionSlack: 1,
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
  visibleForGroups: [],
  title: DEFAULT_OPTIONS.title,
  description: DEFAULT_OPTIONS.description,
  elevationUrl: DEFAULT_OPTIONS.elevationUrl,
  elevationEncoding: DEFAULT_OPTIONS.elevationEncoding,
  crossOrigin: DEFAULT_OPTIONS.crossOrigin,
  tileSize: DEFAULT_OPTIONS.tileSize,
  minZoom: DEFAULT_OPTIONS.minZoom,
  maxZoom: DEFAULT_OPTIONS.maxZoom,
  attributions: DEFAULT_OPTIONS.attributions,
  minLevel: DEFAULT_OPTIONS.minLevel,
  maxLevel: DEFAULT_OPTIONS.maxLevel,
  levelStep: DEFAULT_OPTIONS.levelStep,
  defaultLevel: DEFAULT_OPTIONS.defaultLevel,
  animationDurationMs: DEFAULT_OPTIONS.animationDurationMs,
  showElevationReadout: DEFAULT_OPTIONS.showElevationReadout,
  minElevation: DEFAULT_OPTIONS.minElevation,
  maxElevation: DEFAULT_OPTIONS.maxElevation,
  waterColor: DEFAULT_OPTIONS.waterColor,
  deepWaterColor: DEFAULT_OPTIONS.deepWaterColor,
  depthColors: [],
  layerOpacity: DEFAULT_OPTIONS.layerOpacity,
  enableDepthShading: DEFAULT_OPTIONS.enableDepthShading,
  maxShadingDepth: DEFAULT_OPTIONS.maxShadingDepth,
  elevationExtent: "",
  elevationTileGridOrigin: "",
  elevationTileGridExtent: "",
  elevationTileGridResolutions: "",
  terrainZoomByMapZoomArray: "",
  terrainZoomByMapZoomBreakpoints: "",
  hideAtMinZoom: "",
  minMapZoom: "",
  maxResolution: "",
  maxResolutionSlack: DEFAULT_OPTIONS.maxResolutionSlack,
};

function parseNumberOrDefault(value, fallback) {
  if (value === "" || value === undefined || value === null) {
    return fallback;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumber(value) {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNumberList(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const numbers = value
    .split(",")
    .map((part) => parseFloat(part.trim()))
    .filter((n) => Number.isFinite(n));
  return numbers.length > 0 ? numbers : null;
}

function formatNumberList(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return "";
  }
  return value.join(", ");
}

function parseTerrainZoomBreakpoints(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const result = {};
  let hasEntry = false;
  value.split(",").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) {
      return;
    }
    const separator = trimmed.indexOf(":");
    if (separator === -1) {
      return;
    }
    const zoom = parseFloat(trimmed.slice(0, separator));
    const terrainZoom = parseFloat(trimmed.slice(separator + 1));
    if (Number.isFinite(zoom) && Number.isFinite(terrainZoom)) {
      result[String(Math.trunc(zoom))] = terrainZoom;
      hasEntry = true;
    }
  });
  return hasEntry ? result : null;
}

function formatTerrainZoomBreakpoints(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((zoom) => `${zoom}:${value[zoom]}`)
    .join(", ");
}

function serializeDepthColors(depthColors) {
  if (!Array.isArray(depthColors) || depthColors.length === 0) {
    return [];
  }
  return depthColors
    .map((stop) => ({
      maxDepth: parseFloat(stop.maxDepth),
      color: typeof stop.color === "string" ? stop.color.trim() : "",
    }))
    .filter((stop) => Number.isFinite(stop.maxDepth) && stop.color)
    .sort((a, b) => a.maxDepth - b.maxDepth);
}

function serializeElevationTileGrid(originText, extentText, resolutionsText) {
  const origin = parseNumberList(originText);
  const extent = parseNumberList(extentText);
  const resolutions = parseNumberList(resolutionsText);
  const grid = {};
  if (origin) {
    grid.origin = origin;
  }
  if (extent) {
    grid.extent = extent;
  }
  if (resolutions) {
    grid.resolutions = resolutions;
  }
  return Object.keys(grid).length > 0 ? grid : null;
}

function loadTerrainZoomFields(mapping) {
  if (Array.isArray(mapping)) {
    return {
      terrainZoomByMapZoomArray: formatNumberList(mapping),
      terrainZoomByMapZoomBreakpoints: "",
    };
  }
  if (mapping && typeof mapping === "object") {
    return {
      terrainZoomByMapZoomArray: "",
      terrainZoomByMapZoomBreakpoints: formatTerrainZoomBreakpoints(mapping),
    };
  }
  return {
    terrainZoomByMapZoomArray: "",
    terrainZoomByMapZoomBreakpoints: "",
  };
}

class FloodSimulator extends Component {
  constructor() {
    super();
    this.state = defaultState;
    this.type = "floodsimulator";
  }

  componentDidMount() {
    const tool = this.getTool();
    if (tool) {
      const options = tool.options || {};
      const grid = options.elevationTileGrid || {};
      this.setState({
        active: true,
        index: tool.index,
        target: options.target || "toolbar",
        position: options.position || defaultState.position,
        width: options.width ?? "",
        height: options.height ?? "",
        visibleAtStart: options.visibleAtStart ?? false,
        visibleForGroups: options.visibleForGroups
          ? options.visibleForGroups
          : [],
        title: options.title ?? DEFAULT_OPTIONS.title,
        description: options.description ?? DEFAULT_OPTIONS.description,
        elevationUrl: options.elevationUrl ?? DEFAULT_OPTIONS.elevationUrl,
        elevationEncoding:
          options.elevationEncoding ?? DEFAULT_OPTIONS.elevationEncoding,
        crossOrigin:
          options.crossOrigin === undefined
            ? DEFAULT_OPTIONS.crossOrigin
            : options.crossOrigin,
        tileSize: options.tileSize ?? DEFAULT_OPTIONS.tileSize,
        minZoom: options.minZoom ?? DEFAULT_OPTIONS.minZoom,
        maxZoom: options.maxZoom ?? DEFAULT_OPTIONS.maxZoom,
        attributions: options.attributions ?? DEFAULT_OPTIONS.attributions,
        minLevel: options.minLevel ?? DEFAULT_OPTIONS.minLevel,
        maxLevel: options.maxLevel ?? DEFAULT_OPTIONS.maxLevel,
        levelStep: options.levelStep ?? DEFAULT_OPTIONS.levelStep,
        defaultLevel: options.defaultLevel ?? DEFAULT_OPTIONS.defaultLevel,
        animationDurationMs:
          options.animationDurationMs ?? DEFAULT_OPTIONS.animationDurationMs,
        showElevationReadout:
          options.showElevationReadout ?? DEFAULT_OPTIONS.showElevationReadout,
        minElevation: options.minElevation ?? DEFAULT_OPTIONS.minElevation,
        maxElevation: options.maxElevation ?? DEFAULT_OPTIONS.maxElevation,
        waterColor: options.waterColor ?? DEFAULT_OPTIONS.waterColor,
        deepWaterColor:
          options.deepWaterColor ?? DEFAULT_OPTIONS.deepWaterColor,
        depthColors: Array.isArray(options.depthColors)
          ? options.depthColors
              .map((stop) => ({
                maxDepth: stop.maxDepth,
                color: stop.color,
              }))
              .sort((a, b) => parseFloat(a.maxDepth) - parseFloat(b.maxDepth))
          : [],
        layerOpacity: options.layerOpacity ?? DEFAULT_OPTIONS.layerOpacity,
        enableDepthShading:
          options.enableDepthShading ?? DEFAULT_OPTIONS.enableDepthShading,
        maxShadingDepth:
          options.maxShadingDepth ?? DEFAULT_OPTIONS.maxShadingDepth,
        elevationExtent: formatNumberList(options.elevationExtent),
        elevationTileGridOrigin: formatNumberList(grid.origin),
        elevationTileGridExtent: formatNumberList(grid.extent),
        elevationTileGridResolutions: formatNumberList(grid.resolutions),
        ...loadTerrainZoomFields(options.terrainZoomByMapZoom),
        hideAtMinZoom:
          options.hideAtMinZoom == null ? "" : options.hideAtMinZoom,
        minMapZoom: options.minMapZoom == null ? "" : options.minMapZoom,
        maxResolution:
          options.maxResolution == null ? "" : options.maxResolution,
        maxResolutionSlack:
          options.maxResolutionSlack ?? DEFAULT_OPTIONS.maxResolutionSlack,
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
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }
    this.setState({
      [name]: value,
    });
  }

  handleNumberInputChange(event) {
    const { name, value } = event.target;
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
    const options = {
      target: this.state.target,
      position: this.state.position,
      visibleAtStart: this.state.visibleAtStart,
      title: this.state.title,
      description: this.state.description,
      elevationUrl: this.state.elevationUrl,
      elevationEncoding: this.state.elevationEncoding,
      crossOrigin: this.state.crossOrigin,
      tileSize: parseNumberOrDefault(
        this.state.tileSize,
        DEFAULT_OPTIONS.tileSize
      ),
      minZoom: parseNumberOrDefault(
        this.state.minZoom,
        DEFAULT_OPTIONS.minZoom
      ),
      maxZoom: parseNumberOrDefault(
        this.state.maxZoom,
        DEFAULT_OPTIONS.maxZoom
      ),
      attributions: this.state.attributions,
      minLevel: parseNumberOrDefault(
        this.state.minLevel,
        DEFAULT_OPTIONS.minLevel
      ),
      maxLevel: parseNumberOrDefault(
        this.state.maxLevel,
        DEFAULT_OPTIONS.maxLevel
      ),
      levelStep: parseNumberOrDefault(
        this.state.levelStep,
        DEFAULT_OPTIONS.levelStep
      ),
      defaultLevel: parseNumberOrDefault(
        this.state.defaultLevel,
        DEFAULT_OPTIONS.defaultLevel
      ),
      animationDurationMs: parseNumberOrDefault(
        this.state.animationDurationMs,
        DEFAULT_OPTIONS.animationDurationMs
      ),
      showElevationReadout: this.state.showElevationReadout,
      minElevation: parseNumberOrDefault(
        this.state.minElevation,
        DEFAULT_OPTIONS.minElevation
      ),
      maxElevation: parseNumberOrDefault(
        this.state.maxElevation,
        DEFAULT_OPTIONS.maxElevation
      ),
      waterColor: this.state.waterColor,
      deepWaterColor: this.state.deepWaterColor,
      depthColors: serializeDepthColors(this.state.depthColors),
      layerOpacity: parseNumberOrDefault(
        this.state.layerOpacity,
        DEFAULT_OPTIONS.layerOpacity
      ),
      enableDepthShading: this.state.enableDepthShading,
      maxShadingDepth: parseNumberOrDefault(
        this.state.maxShadingDepth,
        DEFAULT_OPTIONS.maxShadingDepth
      ),
      maxResolutionSlack: parseNumberOrDefault(
        this.state.maxResolutionSlack,
        DEFAULT_OPTIONS.maxResolutionSlack
      ),
      visibleForGroups: this.state.visibleForGroups.map(
        Function.prototype.call,
        String.prototype.trim
      ),
    };

    if (this.state.width !== "" && this.state.width != null) {
      options.width = this.state.width;
    }
    if (this.state.height !== "" && this.state.height != null) {
      options.height = this.state.height;
    }

    const elevationExtent = parseNumberList(this.state.elevationExtent);
    if (elevationExtent) {
      options.elevationExtent = elevationExtent;
    }

    const elevationTileGrid = serializeElevationTileGrid(
      this.state.elevationTileGridOrigin,
      this.state.elevationTileGridExtent,
      this.state.elevationTileGridResolutions
    );
    if (elevationTileGrid) {
      options.elevationTileGrid = elevationTileGrid;
    }

    const terrainZoomArray = parseNumberList(
      this.state.terrainZoomByMapZoomArray
    );
    const terrainZoomBreakpoints = parseTerrainZoomBreakpoints(
      this.state.terrainZoomByMapZoomBreakpoints
    );
    if (terrainZoomArray) {
      options.terrainZoomByMapZoom = terrainZoomArray;
    } else if (terrainZoomBreakpoints) {
      options.terrainZoomByMapZoom = terrainZoomBreakpoints;
    }

    const hideAtMinZoom = parseOptionalNumber(this.state.hideAtMinZoom);
    if (hideAtMinZoom !== undefined) {
      options.hideAtMinZoom = hideAtMinZoom;
    }

    const minMapZoom = parseOptionalNumber(this.state.minMapZoom);
    if (minMapZoom !== undefined) {
      options.minMapZoom = minMapZoom;
    }

    const maxResolution = parseOptionalNumber(this.state.maxResolution);
    if (maxResolution !== undefined) {
      options.maxResolution = maxResolution;
    }

    const tool = {
      type: this.type,
      index: this.state.index,
      options,
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

  renderHelpLabel(id, label, tooltip) {
    return (
      <label htmlFor={id}>
        {label}{" "}
        {tooltip ? (
          <i
            className="fa fa-question-circle"
            data-toggle="tooltip"
            title={tooltip}
          />
        ) : null}
      </label>
    );
  }

  render() {
    const hasDepthClasses = this.state.depthColors.length > 0;

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
          <div className="separator">Höjddata</div>
          <div>
            {this.renderHelpLabel(
              "elevationUrl",
              "URL till höjddata",
              "XYZ-mall för Terrarium- eller Terrain-RGB-rutor, t.ex. https://…/{z}/{x}/{y}.png. Överlägget skapas inte förrän en URL är ifylld."
            )}
            <input
              id="elevationUrl"
              name="elevationUrl"
              type="text"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.elevationUrl}
            />
          </div>
          <div>
            <label htmlFor="elevationEncoding">Kodning</label>
            <select
              id="elevationEncoding"
              name="elevationEncoding"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.elevationEncoding}
            >
              <option value="terrarium">terrarium</option>
              <option value="mapbox">mapbox</option>
            </select>
          </div>
          <div>
            {this.renderHelpLabel(
              "crossOrigin",
              "Cross-origin",
              "Behövs för höjdavläsning vid pekaren. 'ingen' utelämnar attributet — överlägget ritas fortfarande men avläsningen fungerar inte."
            )}
            <select
              id="crossOrigin"
              name="crossOrigin"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.crossOrigin}
            >
              <option value="anonymous">anonymous</option>
              <option value="use-credentials">use-credentials</option>
              <option value="">ingen</option>
            </select>
          </div>
          <div>
            <label htmlFor="tileSize">Tile-storlek</label>
            <input
              id="tileSize"
              name="tileSize"
              type="text"
              inputMode="numeric"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.tileSize}
            />
          </div>
          <div>
            <label htmlFor="attributions">Attribution</label>
            <input
              id="attributions"
              name="attributions"
              type="text"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.attributions}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "elevationExtent",
              "Utbredning (extent)",
              "DEM-täckning som kommaseparerad lista: minX, minY, maxX, maxY. Lämna tomt för att använda kartans extent."
            )}
            <input
              id="elevationExtent"
              name="elevationExtent"
              type="text"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.elevationExtent}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "minElevation",
              "Min höjd (nodata)",
              "Höjder vid eller under detta värde behandlas som nodata (t.ex. RGB 0,0,0)."
            )}
            <input
              id="minElevation"
              name="minElevation"
              type="text"
              inputMode="decimal"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.minElevation}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "maxElevation",
              "Max höjd (nodata)",
              "Höjder vid eller över detta värde behandlas som nodata."
            )}
            <input
              id="maxElevation"
              name="maxElevation"
              type="text"
              inputMode="decimal"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.maxElevation}
            />
          </div>
          <div className="separator">Zoom och synlighet</div>
          <div>
            {this.renderHelpLabel(
              "minZoom",
              "Lägsta terrängzoom",
              "Lägsta terräng-{z} som finns. Lägre Hajk-zoomar återanvänder dessa rutor."
            )}
            <input
              id="minZoom"
              name="minZoom"
              type="text"
              inputMode="numeric"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.minZoom}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "maxZoom",
              "Högsta terrängzoom",
              "Högsta terräng-{z} som finns. Högre Hajk-zoomar återanvänder dessa rutor."
            )}
            <input
              id="maxZoom"
              name="maxZoom"
              type="text"
              inputMode="numeric"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.maxZoom}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "terrainZoomByMapZoomArray",
              "Terrängzoom per kartzoom (lista)",
              "Ett terräng-{z} per Hajk-zoom, kommaseparerat, t.ex. 4, 4, 4, 4, 4, 5, 6. Lämna tomt för att klampa mot min/max zoom. Har företräde om båda fälten är ifyllda."
            )}
            <input
              id="terrainZoomByMapZoomArray"
              name="terrainZoomByMapZoomArray"
              type="text"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.terrainZoomByMapZoomArray}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "terrainZoomByMapZoomBreakpoints",
              "Terrängzoom per kartzoom (brytpunkter)",
              "Lista med zoom:terrängZoom, t.ex. 0:4, 5:5, 6:6. Används bara om listfältet ovan är tomt."
            )}
            <input
              id="terrainZoomByMapZoomBreakpoints"
              name="terrainZoomByMapZoomBreakpoints"
              type="text"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.terrainZoomByMapZoomBreakpoints}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "hideAtMinZoom",
              "Dölj vid minsta kartzoom",
              "Dölj överlägget och sluta begära rutor vid denna OpenLayers-zoom och lägre. Exempel: 1 döljer zoom 0 och 1. Lämna tomt så att vattnet fortfarande visas vid utzoomning."
            )}
            <input
              id="hideAtMinZoom"
              name="hideAtMinZoom"
              type="text"
              inputMode="numeric"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.hideAtMinZoom}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "minMapZoom",
              "Min kartzoom",
              "Dölj överlägget under denna Hajk-zoom. Lämna tomt så att zoomning utåt förbi minZoom fortfarande visar vatten."
            )}
            <input
              id="minMapZoom"
              name="minMapZoom"
              type="text"
              inputMode="decimal"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.minMapZoom}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "maxResolution",
              "Max resolution",
              "OpenLayers maxResolution (exklusiv). Lämna tomt för att härleda från min kartzoom."
            )}
            <input
              id="maxResolution"
              name="maxResolution"
              type="text"
              inputMode="decimal"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.maxResolution}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "maxResolutionSlack",
              "Max resolution slack",
              "Multiplikator när maxResolution härleds från min kartzoom. 1 använder nästa grövre zoom."
            )}
            <input
              id="maxResolutionSlack"
              name="maxResolutionSlack"
              type="text"
              inputMode="decimal"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.maxResolutionSlack}
            />
          </div>
          <div className="separator">Tile-rutnät</div>
          <div>
            {this.renderHelpLabel(
              "elevationTileGridOrigin",
              "Origo",
              "Överstyr XYZ-rutnätets origo (två tal, kommaseparerade). Lämna tomt för att härleda från kartan."
            )}
            <input
              id="elevationTileGridOrigin"
              name="elevationTileGridOrigin"
              type="text"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.elevationTileGridOrigin}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "elevationTileGridExtent",
              "Utbredning",
              "Överstyr tile-gridets extent (fyra tal, kommaseparerade)."
            )}
            <input
              id="elevationTileGridExtent"
              name="elevationTileGridExtent"
              type="text"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.elevationTileGridExtent}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "elevationTileGridResolutions",
              "Upplösningar",
              "Kommaseparerad lista med upplösningar för höjdpyramiden."
            )}
            <input
              id="elevationTileGridResolutions"
              name="elevationTileGridResolutions"
              type="text"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.elevationTileGridResolutions}
            />
          </div>
          <div className="separator">Vattennivå</div>
          <div>
            <label htmlFor="minLevel">Lägsta nivå (m)</label>
            <input
              id="minLevel"
              name="minLevel"
              type="text"
              inputMode="decimal"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.minLevel}
            />
          </div>
          <div>
            <label htmlFor="maxLevel">Högsta nivå (m)</label>
            <input
              id="maxLevel"
              name="maxLevel"
              type="text"
              inputMode="decimal"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.maxLevel}
            />
          </div>
          <div>
            <label htmlFor="levelStep">Steg (m)</label>
            <input
              id="levelStep"
              name="levelStep"
              type="text"
              inputMode="decimal"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.levelStep}
            />
          </div>
          <div>
            <label htmlFor="defaultLevel">Startnivå (m)</label>
            <input
              id="defaultLevel"
              name="defaultLevel"
              type="text"
              inputMode="decimal"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.defaultLevel}
            />
          </div>
          <div>
            {this.renderHelpLabel(
              "animationDurationMs",
              "Animationstid (ms)",
              "Startvärde för spela-knappen, från lägsta till högsta nivå. Användaren kan justera 1–30 s i klienten."
            )}
            <input
              id="animationDurationMs"
              name="animationDurationMs"
              type="text"
              inputMode="numeric"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.animationDurationMs}
            />
          </div>
          <div>
            <input
              id="showElevationReadout"
              name="showElevationReadout"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.showElevationReadout}
            />
            &nbsp;
            <label htmlFor="showElevationReadout">Visa höjdavläsning</label>
          </div>
          <div className="separator">Utseende</div>
          <div className="clearfix">
            <span className="pull-left">
              <div>
                <label className="long-label" htmlFor="waterColor">
                  Vattenfärg
                </label>
              </div>
              <div>
                <SketchPicker
                  color={this.state.waterColor}
                  disableAlpha
                  onChangeComplete={(color) =>
                    this.setState({ waterColor: color.hex })
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <label className="long-label" htmlFor="deepWaterColor">
                  Djupvattenfärg
                </label>
              </div>
              <div>
                <SketchPicker
                  color={this.state.deepWaterColor}
                  disableAlpha
                  onChangeComplete={(color) =>
                    this.setState({ deepWaterColor: color.hex })
                  }
                />
              </div>
            </span>
          </div>
          <div>
            <label htmlFor="layerOpacity">Opacitet</label>
            <input
              id="layerOpacity"
              name="layerOpacity"
              type="text"
              inputMode="decimal"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.layerOpacity}
            />
          </div>
          <div>
            <input
              id="enableDepthShading"
              name="enableDepthShading"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enableDepthShading}
            />
            &nbsp;
            <label htmlFor="enableDepthShading">Visa vattendjup</label>
          </div>
          <div>
            {this.renderHelpLabel(
              "maxShadingDepth",
              "Max djup för linjär ramp (m)",
              "Djup som mappas till djupvattenfärgen på den linjära rampen. Används inte när djupklasser är definierade."
            )}
            <input
              id="maxShadingDepth"
              name="maxShadingDepth"
              type="text"
              inputMode="decimal"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleNumberInputChange(e);
              }}
              value={this.state.maxShadingDepth}
            />
          </div>
          {hasDepthClasses && (
            <div style={{ fontStyle: "italic", color: "#666" }}>
              Djupvattenfärg och max djup för linjär ramp används inte när
              djupklasser är definierade.
            </div>
          )}
          <DepthColorList
            depthColors={this.state.depthColors}
            onChange={(depthColors) => this.setState({ depthColors })}
          />
          {this.renderVisibleForGroups()}
        </form>
      </div>
    );
  }
}

export default FloodSimulator;
