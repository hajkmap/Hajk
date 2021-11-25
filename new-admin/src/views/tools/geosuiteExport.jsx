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
  services: {
    trimble: {
      url: "https://geoarkiv-api.goteborg.se/prod",
      projectDetailsMethod: "/investigation",
      exportMethod: "/export"
    },
    wfs: {
      projects: {
        layer: {
          id: ""
        },
        spatialFilter: "intersects",
        attributes: {
          title: "projektnamn",
          link: "url",
        },
        maxFeatures: 50,
      },
      boreholes: {
        layer: {
          id: "",
        },
        attributes: {
          external_id: "externt_id",
          external_project_id: "externt_projekt_id",
        },
        maxFeatures: 0,
      }
    }
  },
  view: {
    termsAndConditionsLink: "https://goteborg.se/wps/portal/om-webbplatsen",
    errorMessage: "Kunde inte hämta resultat. Vänligen försök igen. Kontakta oss om felet kvarstår.",
    digitizeDescription: "Rita ditt område i kartan, avsluta genom att dubbelklicka.",
    projects: {
      order: {
        description: "Välj geoteknisk utredning nedan för att hämta motsvarande handlingar.",
      },
    },
    boreholes: {
      order: {
        intro: "Nedan visas alla borrhålsprojekt med undersökningspunkter inom det markerade området.",
        description: "Välj om du vill ladda ner hela borrhålsprojektet eller endast punkter inom markering. Du kan välja generellt för alla eller ställa in för varje projekt.",
        referenceSystemText: "Geotekniska undersökningspunkter är i koordinatsystemet SWEREF 99 12 00 samt höjdsystemet RH2000.",
        informationText: "Informationen levereras i GeoSuite Toolbox-format via en länk som du får skickad till din e-postadress. För att kunna genomföra beställningen krävs att e-postadressen är registrerad i Geoarkivets molntjänst.",
      },
      confirmation: {
        header: "Tack för din beställning!",
        informationText: "Ett e-postmeddelande med vidare instruktioner kommer att skickas till dig.",
        whereNextText: "Klicka på VÄLJ MER för att hämta mer data för ditt markerade område eller gå vidare med KLAR.",
      },
    },
  },
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
        services: tool.options.services,
        view: tool.options.view,
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
   * @param {*} propPath flat or nested path to state key to update, nesting is specified by double underscores (__)
   * @param {*} value new value to set on specified state key
   */
  getUpdatedStateProp = (obj, propPath, value) => {
    const [head, ...tail] = propPath.split('__');

    console.log("getUpdatedStateProp: propPath=%s, head=%s, tail=%s, obj:", propPath, head, tail, obj);
    if (!tail || !tail.length) {
      if (!obj) {
        console.warn(
          "geosuiteExport.jsx: getUpdatedStateProp - Internal error: cannot set key '%s' to '%value' since object is undefined",
          head, propPath, value
        );
        return {};
      }
      obj[head] = value;
      return obj;
    }
    const parentObject = obj[head];
    console.log("getUpdatedStateProp: parentObject=", parentObject);
    this.getUpdatedStateProp(parentObject, tail.join('__'), value);
    return parentObject;
  }

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    let value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }

    const [head, ...tail] = name.split('__');
    var newState;
    if (!tail || !tail.length) {
      console.log("handleInputChange: name=%s, no tail, value=%s", name, value);
      newState = {
        [name]: value
      };
    } else {
      const currentState = {
        [head]: this.state[head]
      };
      console.log("handleInputChange: name=%s, head=%s, value=%s, currentState:", name, head, value, currentState);
      newState = {
        [head]: this.getUpdatedStateProp(currentState, name, value)
      };
    }
    console.log("handleInputChange: state change - new state:", newState);
    this.setState(newState);
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
        services: this.state.services,
        view: this.state.view,
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

          <div className="separator">Tjänsteinställningar - Trimble GeoSuite Archive API</div>
          <div>
            <label htmlFor="services__trimble__url">
              Basadress{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Basadress till Trimble GeoSuite Archive API (URL till Trimble WebAPI)"
              />
            </label>
            <input
              type="text"
              id="services__trimble__url"
              name="services__trimble__url"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.trimble.url}
            />
          </div>

          <div className="separator">Tjänsteinställningar - Söklager Geotekniska utredningar</div>
          <div>
            <label htmlFor="services__wfs__projects__layer__id">
              Söklager, id{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Söklager-id för referens till lager konfigurerat i layers.json. Observera att lagret måste vara aktivt i verktyget Sök."
              />
            </label>
            <input
              type="text"
              id="services__wfs__projects__layer__id"
              name="services__wfs__projects__layer__id"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.wfs.projects.layer?.id || ""}
            />
          </div>
          <div>
            <label htmlFor="services__wfs__projects__layer__projection">
              Projektion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Söklagerprojektion i plan, anges om WFS-tjänsten kräver specifik projektion för sökning. Standardinställning är kartans projektion."
              />
            </label>
            <input
              type="text"
              id="services__wfs__projects__layer__projection"
              name="services__wfs__projects__layer__projection"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.wfs.projects.layer?.projection || ""}
            />
          </div>
          <div>
            <label htmlFor="services__wfs__projects__attributes__title">
              Attributnamn - titel{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Ange namn på WFS-attribut som ska användas för att hämta utredningens titel"
              />
            </label>
            <input
              type="text"
              id="services__wfs__projects__attributes__title"
              name="services__wfs__projects__attributes__title"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.wfs.projects.attributes.title}
            />
          </div>
          <div>
            <label htmlFor="services__wfs__projects__attributes__link">
              Attributnamn - länk{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Ange namn på WFS-attribut som ska användas för att hämta länken till utredningsdokument"
              />
            </label>
            <input
              type="text"
              id="services__wfs__projects__attributes__link"
              name="services__wfs__projects__attributes__link"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.wfs.projects.attributes.link}
            />
          </div>
          <div>
            <label htmlFor="services__wfs__projects__maxFeatures">
              Max antal sökträffar{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Ange max antal WFS sökträffar. Ange -1 för obegränsat antal."
              />
            </label>
            <input
              type="number"
              min="0"
              className="control-fixed-width"
              id="services__wfs__projects__maxFeatures"
              name="services__wfs__projects__maxFeatures"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.wfs.projects.maxFeatures}
            />
          </div>

          <div className="separator">Tjänsteinställningar - Söklager GeoSuite-format</div>
          <div>
            <label htmlFor="services__wfs__boreholes__layer__id">
              Söklager, id{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Söklager-id för referens till lager konfigurerat i layers.json. Observera att lagret måste vara aktivt i verktyget Sök."
              />
            </label>
            <input
              type="text"
              id="services__wfs__boreholes__layer__id"
              name="services__wfs__boreholes__layer__id"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.wfs.boreholes.layer?.id || ""}
            />
          </div>
          <div>
            <label htmlFor="services__wfs__boreholes__layer__projection">
              Projektion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Söklagerprojektion i plan, anges om WFS-tjänsten kräver specifik projektion för sökning. Standardinställning är kartans projektion."
              />
            </label>
            <input
              type="text"
              id="services__wfs__boreholes__layer__projection"
              name="services__wfs__boreholes__layer__projection"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.wfs.boreholes.layer?.projection || ""}
            />
          </div>
          <div>
            <label htmlFor="services__wfs__boreholes__attributes__external_id">
              Attributnamn - id{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Ange namn på WFS-attribut som ska användas för att hämta borrhålets externa identitet (Trimble borrhåls-id)"
              />
            </label>
            <input
              type="text"
              id="services__wfs__boreholes__attributes__external_id"
              name="services__wfs__boreholes__attributes__external_id"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.wfs.boreholes.attributes.external_id}
            />
          </div>
          <div>
            <label htmlFor="services__wfs__boreholes__attributes__external_project_id">
              Attributnamn - projekt-id{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Ange namn på WFS-attribut som ska användas för att hämta borrhålets externa projektidentitet (Trimble projekt-id)"
              />
            </label>
            <input
              type="text"
              id="services__wfs__boreholes__attributes__external_project_id"
              name="services__wfs__boreholes__attributes__external_project_id"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.wfs.boreholes.attributes.external_project_id}
            />
          </div>
          <div>
            <label htmlFor="services__wfs__boreholes__maxFeatures">
              Max antal sökträffar{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Ange max antal WFS sökträffar. Ange -1 för obegränsat antal."
              />
            </label>
            <input
              type="number"
              min="0"
              className="control-fixed-width"
              id="services__wfs__boreholes__maxFeatures"
              name="services__wfs__boreholes__maxFeatures"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.services.wfs.boreholes.maxFeatures}
            />
          </div>

          <div className="separator">Inställningar - gemensamt för samtliga format</div>
          <div>
            <label htmlFor="view__termsAndConditionsLink">
              Länk, villkor för nyttjande{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som en länk till villkoren för nyttjande av tjänsten"
              />
            </label>
            <input
              type="text"
              id="view__termsAndConditionsLink"
              name="view__termsAndConditionsLink"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.termsAndConditionsLink}
            />
          </div>
          <div>
            <label htmlFor="view__errorMessage">
              Felmeddelande, misslyckat tjänsteanrop{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som felmeddelande efter misslyckat anrop till externt API/tjänst för att hämta urval för beställning"
              />
            </label>
            <textarea
              type="text"
              id="view__errorMessage"
              name="view__errorMessage"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.errorMessage}
            />
          </div>
          <div>
            <label htmlFor="view__digitizeDescription">
              Urval, instruktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som instruktion för hur användaren markerar urvalsområdet för beställning av data"
              />
            </label>
            <textarea
              type="text"
              id="view__digitizeDescription"
              name="view__digitizeDescription"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.digitizeDescription}
            />
          </div>

          <div className="separator">Texter - Geotekniska utredningar, beställning</div>
          <div>
            <label htmlFor="view__projects__order__description">
              Beställning, instruktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som instruktion vid beställning av geotekniska utredningar"
              />
            </label>
            <textarea
              type="text"
              id="view__projects__order__description"
              name="view__projects__order__description"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.projects.order.description}
            />
          </div>

          <div className="separator">Texter - GeoSuite-format, beställning</div>
          <div>
            <label htmlFor="view__boreholes__order__intro">
              Beställning, introduktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som introduktion vid beställning av GeoSuite-format"
              />
            </label>
            <textarea
              type="text"
              id="view__boreholes__order__intro"
              name="view__boreholes__order__intro"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.boreholes.order.intro}
            />
          </div>
          <div>
            <label htmlFor="view__boreholes__order__description">
              Beställning, instruktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som instruktion vid beställning av GeoSuite-format"
              />
            </label>
            <textarea
              type="text"
              id="view__boreholes__order__description"
              name="view__boreholes__order__description"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.boreholes.order.description}
            />
          </div>
          <div>
            <label htmlFor="view__boreholes__order__referenceSystemText">
              Referenssystem{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som förklarande text angående referenssystem i GeoSuite-data"
              />
            </label>
            <textarea
              type="text"
              id="view__boreholes__order__referenceSystemText"
              name="view__boreholes__order__referenceSystemText"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.boreholes.order.referenceSystemText}
            />
          </div>
          <div>
            <label htmlFor="view__boreholes__order__informationText">
              Leveransinformation{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som förklarande text angående förutsättningar för leverans av GeoSuite-data"
              />
            </label>
            <textarea
              type="text"
              id="view__boreholes__order__informationText"
              name="view__boreholes__order__informationText"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.boreholes.order.informationText}
            />
          </div>

          <div className="separator">Texter - GeoSuite-format, bekräftelse</div>
          <div>
            <label htmlFor="view__boreholes__confirmation__header">
              Bekräftelse, ingress{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som ingress efter beställning av GeoSuite-format"
              />
            </label>
            <textarea
              type="text"
              id="view__boreholes__confirmation__header"
              name="view__boreholes__confirmation__header"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.boreholes.confirmation.header}
            />
          </div>
          <div>
            <label htmlFor="view__boreholes__confirmation__informationText">
              Bekräftelse, instruktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som instruktion efter beställning av GeoSuite-format"
              />
            </label>
            <textarea
              type="text"
              id="view__boreholes__confirmation__informationText"
              name="view__boreholes__confirmation__informationText"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.boreholes.confirmation.informationText}
            />
          </div>
          <div>
            <label htmlFor="view__boreholes__confirmation__whereNextText">
              Vidare, instruktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som instruktion hur användaren kan gå vidare efter en beställning av GeoSuite-data"
              />
            </label>
            <textarea
              type="text"
              id="view__boreholes__confirmation__whereNextText"
              name="view__boreholes__confirmation__whereNextText"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.boreholes.confirmation.whereNextText}
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
