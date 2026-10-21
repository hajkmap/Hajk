import React from "react";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

const STYLE_GROUPS = {
  point: ["pointColor", "pointRadius"],
  line: ["lineColor", "lineWidth"],
  polygon: [
    "polygonStrokeColor",
    "polygonStrokeWidth",
    "polygonFillColor",
    "polygonFillOpacity",
  ],
};

const STYLE_DEFAULTS = {
  pointColor: "#008000",
  pointRadius: 6,
  lineColor: "#0000ff",
  lineWidth: 3,
  polygonStrokeColor: "#0000ff",
  polygonStrokeWidth: 2,
  polygonFillColor: "#0000ff",
  polygonFillOpacity: 0.3,
};

const OVERRIDE_FLAGS = {
  point: "overridePoint",
  line: "overrideLine",
  polygon: "overridePolygon",
};

const styleFieldsPresent = (layer, type) =>
  STYLE_GROUPS[type].every((key) => layer?.[key] != null && layer[key] !== "");

const createDefaultState = () => ({
  id: "",
  type: "KML",
  caption: "",
  url: "",
  attribution: "",
  queryable: true,
  opacity: 1,
  minZoom: -1,
  maxZoom: -1,
  drawOrder: 1,
  overridePoint: false,
  overrideLine: false,
  overridePolygon: false,
  pointInfobox: "",
  lineInfobox: "",
  polygonInfobox: "",
  collectionInfobox: "",
  internalLayerName: "",
  content: "",
  owner: "",
  infoOwner: "",
  infoTitle: "",
  infoText: "",
  infoUrl: "",
  infoUrlText: "",
  infoOpenDataLink: "",
  infoVisible: false,
  validationErrors: [],
});

export default class KMLLayerForm extends React.Component {
  state = createDefaultState();

  loadLayer(layer) {
    this.setState((previousState) => ({
      ...Object.fromEntries(
        Object.keys(previousState).map((key) => [key, undefined]),
      ),
      ...createDefaultState(),
      ...layer,
      overridePoint: styleFieldsPresent(layer, "point"),
      overrideLine: styleFieldsPresent(layer, "line"),
      overridePolygon: styleFieldsPresent(layer, "polygon"),
      validationErrors: [],
    }));
  }

  toggleOverride(type, enabled) {
    const flag = OVERRIDE_FLAGS[type];
    if (!enabled) {
      this.setState({ [flag]: false });
      return;
    }
    const patch = { [flag]: true };
    for (const key of STYLE_GROUPS[type]) {
      if (this.state[key] == null || this.state[key] === "")
        patch[key] = STYLE_DEFAULTS[key];
    }
    this.setState(patch);
  }

  validate() {
    const validationErrors = ["caption", "url"].filter(
      (key) => !this.state[key]?.trim(),
    );
    const numericKeys = ["opacity", "minZoom", "maxZoom", "drawOrder"];
    const colorKeys = [];
    if (this.state.overridePoint) {
      numericKeys.push("pointRadius");
      colorKeys.push("pointColor");
    }
    if (this.state.overrideLine) {
      numericKeys.push("lineWidth");
      colorKeys.push("lineColor");
    }
    if (this.state.overridePolygon) {
      numericKeys.push("polygonStrokeWidth", "polygonFillOpacity");
      colorKeys.push("polygonStrokeColor", "polygonFillColor");
    }
    for (const key of numericKeys) {
      const value = this.state[key];
      if (
        !Number.isFinite(value) ||
        (["opacity", "polygonFillOpacity"].includes(key) &&
          (value < 0 || value > 1)) ||
        (["pointRadius", "lineWidth", "polygonStrokeWidth"].includes(key) &&
          value <= 0)
      )
        validationErrors.push(key);
    }
    for (const key of colorKeys) {
      if (typeof this.state[key] !== "string" || !this.state[key].trim())
        validationErrors.push(key);
    }
    this.setState({ validationErrors });
    return validationErrors.length === 0;
  }

  getLayer() {
    const {
      validationErrors,
      overridePoint,
      overrideLine,
      overridePolygon,
      ...layer
    } = this.state;
    if (!overridePoint) STYLE_GROUPS.point.forEach((key) => delete layer[key]);
    if (!overrideLine) STYLE_GROUPS.line.forEach((key) => delete layer[key]);
    if (!overridePolygon)
      STYLE_GROUPS.polygon.forEach((key) => delete layer[key]);
    return { ...layer, type: "KML", date: Date.now().toString() };
  }

  render() {
    const field = (key, label, type = "text", multiline = false) => (
      <TextField
        key={key}
        fullWidth
        margin="normal"
        label={label}
        type={type}
        multiline={multiline}
        required={["caption", "url"].includes(key)}
        error={this.state.validationErrors.includes(key)}
        value={this.state[key] ?? ""}
        onChange={(e) =>
          this.setState({
            [key]: type === "number" ? Number(e.target.value) : e.target.value,
          })
        }
      />
    );
    const override = (type, label) => (
      <FormControlLabel
        key={type}
        label={label}
        control={
          <Checkbox
            checked={this.state[OVERRIDE_FLAGS[type]]}
            onChange={(e) => this.toggleOverride(type, e.target.checked)}
          />
        }
      />
    );
    return (
      <div>
        <p>
          KML. Externa servrar måste tillåta CORS. Stilar i filen används
          tills de skrivs över nedan.
        </p>
        {field("caption", "Visningsnamn")}
        {field("url", "KML URL")}
        {field("attribution", "Attribution")}
        <FormControlLabel
          label="Sökbar med infoklick"
          control={
            <Checkbox
              checked={this.state.queryable}
              onChange={(e) => this.setState({ queryable: e.target.checked })}
            />
          }
        />
        {field("opacity", "Opacitet (0–1)", "number")}
        {field("minZoom", "Minsta zoom (-1 = ingen gräns)", "number")}
        {field("maxZoom", "Största zoom (-1 = ingen gräns)", "number")}
        {field("drawOrder", "Ritordning", "number")}
        <p>
          Bocka i en geometrityp för att ersätta filens stil. Avbockat lämnas
          den typen oförändrad och skrivs inte till lagret.
        </p>
        {override("point", "Ersätt punktstil")}
        {this.state.overridePoint && (
          <>
            {field("pointColor", "Punktfärg", "color")}
            {field("pointRadius", "Punktradie", "number")}
          </>
        )}
        {override("line", "Ersätt linjestil")}
        {this.state.overrideLine && (
          <>
            {field("lineColor", "Linjefärg", "color")}
            {field("lineWidth", "Linjebredd", "number")}
          </>
        )}
        {override("polygon", "Ersätt polygonstil")}
        {this.state.overridePolygon && (
          <>
            {field("polygonStrokeColor", "Polygonkantfärg", "color")}
            {field("polygonStrokeWidth", "Polygonkantbredd", "number")}
            {field("polygonFillColor", "Polygonfyllnadsfärg", "color")}
            {field(
              "polygonFillOpacity",
              "Polygonfyllnadsopacitet (0–1)",
              "number",
            )}
          </>
        )}
        <p>
          Infoboxar använder Markdown och attribut som övriga lager. Tom mall
          visar attributtabellen.
        </p>
        {field("pointInfobox", "Punkt infobox", "text", true)}
        {field("lineInfobox", "Linje infobox", "text", true)}
        {field("polygonInfobox", "Polygon infobox", "text", true)}
        {field("collectionInfobox", "Samlingsgeometri infobox", "text", true)}
        {[
          ["internalLayerName", "Internt lagernamn"],
          ["content", "Beskrivning"],
          ["owner", "Ansvarig"],
          ["infoOwner", "Informationsägare"],
          ["infoTitle", "Rubrik för lagerinformation"],
          ["infoText", "Lagerinformation"],
          ["infoUrl", "Informationslänk"],
          ["infoUrlText", "Länktext"],
          ["infoOpenDataLink", "Länk till öppna data"],
        ].map(([key, label]) => field(key, label))}
        <FormControlLabel
          label="Visa lagerinformation"
          control={
            <Checkbox
              checked={this.state.infoVisible}
              onChange={(e) => this.setState({ infoVisible: e.target.checked })}
            />
          }
        />
      </div>
    );
  }
}
