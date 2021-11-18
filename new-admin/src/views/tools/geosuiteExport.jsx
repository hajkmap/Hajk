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
  active: false,
  index: 0,
  target: "toolbar",
  visibleAtStart: false,
  view: {
    termsAndConditionsLink: "https://goteborg.se/wps/portal/om-webbplatsen",
    boreholeIntro: "Nedan visas alla borrhålsprojekt med undersökningspunkter inom det markerade området.",
    boreholeDescription: "Välj om du vill ladda ner hela borrhålsprojektet eller endast punkter inom markering. Du kan välja generellt för alla eller ställa in för varje projekt.",
    referenceSystemText: "Geotekniska undersökningspunkter är i koordinatsystemet SWEREF 99 12 00 samt höjdsystemet RH2000.",
    deliveryInformationText: "Informationen levereras i GeoSuite Toolbox-format via en länk som du får skickad till din e-postadress. För att kunna genomföra beställningen krävs att e-postadressen är registrerad i Geoarkivets molntjänst.",
    deliveryConfirmationHeader: "Tack för din beställning!",
    deliveryInformationTextFirst: "Ett e-postmeddelande med vidare instruktioner kommer att skickas till dig.",
    deliveryInformationTextSecond: "Klicka på VÄLJ MER för att hämta mer data för ditt markerade område eller gå vidare med KLAR.",
    documentDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur iste minima est? Voluptate hic dicta quaerat modi, vitae maxime ad?",
    errorMessage: "Kunde inte hämta resultat. Vänligen försök igen. Kontakta oss om felet kvarstår."
  },
  services: {
    trimble: {
      url: "https://geoarkiv-api.goteborg.se/prod",
      projectDetailsMethod: "/investigation",
      exportMethod: "/export"
    },
    wfs: {
      boreholes: {},
      projects: {}
    }
  }
};

class ToolOptions extends Component {
  constructor() {
    super();
    this.state = defaultState;
    this.type = "geosuiteexport";
  }

  componentDidMount() {
    const tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        target: tool.options.target || "toolbar",
        visibleAtStart: tool.options.visibleAtStart,
        position: tool.options.position,
        view: tool.options.view,
        services: tool.options.services
      });
    } else {
      this.setState({
        active: false
      });
    }
  }

  /**
   * Updates current state property with new value, potentially recursively on a nested property path.
   * Inspired by https://stackoverflow.com/a/50392139/13508133, modified by Sweco to to handle empty tail and work on current state
   * @param {*} obj current value object for setting updated state key, should be an empty object on first level call
   * @param {*} propPath flat or nested path to state key to update, nesting is specified by underscores (_)
   * @param {*} value new value to set on specified state key
   */
   getUpdatedStateProp = (obj, propPath, value) => {
    const [head, ...tail] = propPath.split('_');

    if (!tail || !tail.length) {
      obj[head] = value;
      return obj;
    }
    var parentObject = obj[head];
    if (!parentObject) {
      parentObject = this.state[head];
    }
    return this.getUpdatedStateProp(parentObject, tail.join('_'), value);
  }

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    let value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }

    const [head, ...tail] = name.split('_');
    if (!tail || !tail.length) {
      this.setState({
        [name]: value
      });
    } else {
      this.setState({
        [head]: this.getUpdatedStateProp({}, name, value)
      });
    }
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
    const tool = {
      type: this.type,
      index: this.state.index,
      options: {
        target: this.state.target,
        position: this.state.position,
        visibleAtStart: this.state.visibleAtStart,
        view: this.state.view,
        services: this.state.services
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
          <div className="separator">Trimble GeoSuite Archive API</div>
          <div>
            <label htmlFor="services_trimble_url">
              Basadress{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Basadress till Trimble GeoSuite Archive API (URL till Trimble WebAPI)"
              />
            </label>
            <input
              type="text"
              id="services_trimble_url"
              name="services_trimble_url"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.trimble.url}
            />
          </div>
          <div className="separator">Texter</div>
          <div>
            <label htmlFor="view_termsAndConditionsLink">
              Villkor{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som en länk till villkor för användning och beställning av data"
              />
            </label>
            <input
              type="text"
              id="view_termsAndConditionsLink"
              name="view_termsAndConditionsLink"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.termsAndConditionsLink}
            />
          </div>
          <div>
            <label htmlFor="view_boreholeIntro">
              Beställning GeoSuite-format, intro{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som introduktion vid beställning av GeoSuite-format"
              />
            </label>
            <textarea
              type="text"
              id="view_boreholeIntro"
              name="view_boreholeIntro"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.boreholeIntro}
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
        </form>
      </div>
    );
  }
}

export default ToolOptions;
