import React from "react";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

const createDefaultState = () => ({
  id: "",
  type: "GPX",
  caption: "",
  url: "",
  attribution: "",
  queryable: true,
  opacity: 1,
  minZoom: -1,
  maxZoom: -1,
  drawOrder: 1,
  waypointColor: "#008000",
  waypointRadius: 6,
  routeColor: "#ffa500",
  routeWidth: 3,
  trackColor: "#0000ff",
  trackWidth: 3,
  waypointInfobox: "",
  routeInfobox: "",
  trackInfobox: "",
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

export default class GPXLayerForm extends React.Component {
  state = createDefaultState();

  loadLayer(layer) {
    this.setState((previousState) => ({
      ...Object.fromEntries(
        Object.keys(previousState).map((key) => [key, undefined]),
      ),
      ...createDefaultState(),
      ...layer,
      validationErrors: [],
    }));
  }

  validate() {
    const validationErrors = ["caption", "url"].filter(
      (key) => !this.state[key]?.trim(),
    );
    for (const key of [
      "opacity",
      "minZoom",
      "maxZoom",
      "drawOrder",
      "waypointRadius",
      "routeWidth",
      "trackWidth",
    ]) {
      const value = this.state[key];
      if (
        !Number.isFinite(value) ||
        (key === "opacity" && (value < 0 || value > 1)) ||
        (["waypointRadius", "routeWidth", "trackWidth"].includes(key) &&
          value <= 0)
      )
        validationErrors.push(key);
    }
    this.setState({ validationErrors });
    return validationErrors.length === 0;
  }

  getLayer() {
    const { validationErrors, ...layer } = this.state;
    return { ...layer, type: "GPX", date: Date.now().toString() };
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
    return (
      <div>
        <p>
          GPX 1.0/1.1. Externa servrar måste tillåta CORS. Alla waypoints,
          rutter och spår visas.
        </p>
        {field("caption", "Visningsnamn")}
        {field("url", "GPX URL")}
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
        {field("waypointColor", "Waypoint färg", "color")}
        {field("waypointRadius", "Waypoint radie", "number")}
        {field("routeColor", "Rutt färg", "color")}
        {field("routeWidth", "Rutt bredd", "number")}
        {field("trackColor", "Spår färg", "color")}
        {field("trackWidth", "Spår bredd", "number")}
        <p>
          Infoboxar använder Markdown och attribut som övriga lager. Tom mall
          visar attributtabellen.
        </p>
        {field("waypointInfobox", "Waypoint infobox", "text", true)}
        {field("routeInfobox", "Rutt infobox", "text", true)}
        {field("trackInfobox", "Spår infobox", "text", true)}
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
