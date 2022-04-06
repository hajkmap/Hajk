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
  title: "Hämta data",
  description: "Hämta data med urvalsområde",
  target: "toolbar",
  visibleAtStart: false,
  services: {
    trimble: {
      url: "https://geoarkiv-api.goteborg.se/prod",
      projectDetailsMethod: "/investigation",
      exportMethod: "/export",
    },
    wfs: {
      projects: {
        layer: {
          id: "",
          geometryField: "geom",
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
          geometryField: "geom",
        },
        attributes: {
          external_id: "externt_id",
          external_project_id: "externt_projekt_id",
        },
        maxFeatures: 0,
      },
    },
  },
  view: {
    termsAndConditionsLink: "https://goteborg.se/wps/portal/om-webbplatsen",
    errorMessage:
      "Kunde inte hämta resultat. Vänligen försök igen. Kontakta oss om felet kvarstår.",
    digitizeDescription:
      "Rita ditt område i kartan, avsluta genom att dubbelklicka.",
    projects: {
      order: {
        description:
          "Välj geoteknisk utredning nedan för att hämta motsvarande handlingar.",
      },
      confirmation: {
        header: "Tack för din beställning!",
        informationText: "Nedladdning av dina filer är klar.",
        whereNextText:
          "Klicka på VÄLJ MER för att hämta mer data för ditt markerade område eller gå vidare med KLAR.",
      },
    },
    boreholes: {
      order: {
        intro:
          "Nedan visas alla borrhålsprojekt med undersökningspunkter inom det markerade området.",
        description:
          "Välj om du vill ladda ner hela borrhålsprojektet eller endast punkter inom markering. Du kan välja generellt för alla eller ställa in för varje projekt.",
        referenceSystemText:
          "Geotekniska undersökningspunkter är i koordinatsystemet SWEREF 99 12 00 samt höjdsystemet RH2000.",
        informationText:
          "Informationen levereras i GeoSuite Toolbox-format via en länk som du får skickad till din e-postadress. För att kunna genomföra beställningen krävs att e-postadressen är registrerad i Geoarkivets molntjänst.",
        informationLink: {
          linkText: "",
          linkHref: "",
        },
      },
      confirmation: {
        header: "Tack för din beställning!",
        informationText:
          "Ett e-postmeddelande med vidare instruktioner kommer att skickas till dig.",
        whereNextText:
          "Klicka på VÄLJ MER för att hämta mer data för ditt markerade område eller gå vidare med KLAR.",
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
        title: tool.options.title || "Hämta data",
        description: tool.options.description || "Hämta data med urvalsområde",
        target: tool.options.target || "toolbar",
        visibleAtStart: tool.options.visibleAtStart,
        position: tool.options.position,
        services: tool.options.services,
        view: tool.options.view,
      });
    } else {
      this.setState({
        active: false,
      });
    }
  }

  /**
   * Updates current state property with new value, potentially recursively on a nested property path.
   * Inspired by https://stackoverflow.com/a/50392139/13508133, modified by Sweco to to handle empty tail.
   * @param {*} obj current value object for setting updated state key, should be an empty object on first level call
   * @param {*} propPath flat or nested path to state key to update, nesting is specified by double underscores (__)
   * @param {*} value new value to set on specified state key
   */
  getUpdatedStateProp = (obj, propPath, value) => {
    const [head, ...tail] = propPath.split("__");

    if (!tail || !tail.length) {
      if (!obj) {
        console.warn(
          "geosuiteExport.jsx: getUpdatedStateProp - Internal error: cannot set key '%s' to '%value' since object is undefined",
          head,
          propPath,
          value
        );
        return {};
      }
      obj[head] = value;
      return obj;
    }
    const parentObject = obj[head];
    this.getUpdatedStateProp(parentObject, tail.join("__"), value);
    return parentObject;
  };

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    let value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }

    const [head, ...tail] = name.split("__");
    var newState;
    if (!tail || !tail.length) {
      newState = {
        [name]: value,
      };
    } else {
      const currentState = {
        [head]: this.state[head],
      };
      newState = {
        [head]: this.getUpdatedStateProp(currentState, name, value),
      };
    }
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
        title: this.state.title,
        description: this.state.description,
        visibleAtStart: this.state.visibleAtStart,
        services: this.state.services,
        view: this.state.view,
      },
    };

    const existing = this.getTool();

    function update() {
      this.props.model.updateToolConfig(
        this.props.model.get("toolConfig"),
        (success) => {
          if (success) {
            this.props.parent.props.parent.setState({
              alert: true,
              alertMessage: "Uppdateringen lyckades.",
            });
          } else {
            this.props.parent.props.parent.setState({
              alert: true,
              alertMessage: "Uppdateringen misslyckades.",
            });
          }
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
            <label htmlFor="title">
              Titel{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visningsnamn för verktyget"
              />
            </label>
            <input
              type="text"
              id="title"
              name="title"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.title}
            />
          </div>
          <div>
            <label htmlFor="description">
              Instruktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som tooltip vid mouseover på verktygsknappen"
              />
            </label>
            <textarea
              type="text"
              id="description"
              name="description"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.description}
            />
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

          <div className="separator">
            Tjänsteinställningar - Trimble GeoSuite Archive API
          </div>
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

          <div className="separator">
            Tjänsteinställningar - Söklager Geotekniska utredningar
          </div>
          <div>
            <label htmlFor="services__wfs__projects__layer__id">
              Söklager, id{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Söklager-id för referens till lager konfigurerat i layers.json."
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
            <label htmlFor="services__wfs__projects__layer__geometryField">
              Geometriattribut{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Attributnamn för WFS-tjänstens geometri."
              />
            </label>
            <input
              type="text"
              id="services__wfs__projects__layer__geometryField"
              name="services__wfs__projects__layer__geometryField"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={
                this.state.services.wfs.projects.layer?.geometryField || ""
              }
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
                title="Ange max antal WFS sökträffar. Ange 0 för obegränsat antal."
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

          <div className="separator">
            Tjänsteinställningar - Söklager GeoSuite-format
          </div>
          <div>
            <label htmlFor="services__wfs__boreholes__layer__id">
              Söklager, id{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Söklager-id för referens till lager konfigurerat i layers.json."
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
            <label htmlFor="services__wfs__boreholes__layer__geometryField">
              Geometriattribut{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Attributnamn för WFS-tjänstens geometri."
              />
            </label>
            <input
              type="text"
              id="services__wfs__boreholes__layer__geometryField"
              name="services__wfs__boreholes__layer__geometryField"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={
                this.state.services.wfs.boreholes.layer?.geometryField || ""
              }
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
              value={
                this.state.services.wfs.boreholes.attributes.external_project_id
              }
            />
          </div>
          <div>
            <label htmlFor="services__wfs__boreholes__maxFeatures">
              Max antal sökträffar{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Ange max antal WFS sökträffar. Ange 0 för obegränsat antal."
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

          <div className="separator">
            Inställningar - gemensamt för samtliga format
          </div>
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

          <div className="separator">
            Texter - Geotekniska utredningar, beställning
          </div>
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
          <div>
            <label htmlFor="view__boreholes__order__informationLink__linkText">
              Leveransinformation länk text{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Synlig text till länk till vidare information om leveransinformation. Lämna tom för att inte visa en länk"
              />
            </label>
            <input
              type="text"
              id="view__boreholes__order__informationLink__linkText"
              name="view__boreholes__order__informationLink__linkText"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.boreholes.order.informationLink.linkText}
            />
          </div>
          <div>
            <label htmlFor="view__boreholes__order__informationLink__linkHref">
              Leveransinformation länk adress{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Synlig text till länk till vidare information om leveransinformation"
              />
            </label>
            <input
              type="text"
              id="view__boreholes__order__informationLink__linkHref"
              name="view__boreholes__order__informationLink__linkHref"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.boreholes.order.informationLink.linkHref}
            />
          </div>

          <div className="separator">
            Texter - Geotekniska utredningar, bekräftelse
          </div>
          <div>
            <label htmlFor="view__projects__confirmation__header">
              Bekräftelse, ingress{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som ingress efter beställning av geotekniska utredningar"
              />
            </label>
            <textarea
              type="text"
              id="view__projects__confirmation__header"
              name="view__projects__confirmation__header"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.projects.confirmation.header}
            />
          </div>
          <div>
            <label htmlFor="view__projects__confirmation__informationText">
              Bekräftelse, instruktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som instruktion efter beställning av geotekniska utredningar"
              />
            </label>
            <textarea
              type="text"
              id="view__projects__confirmation__informationText"
              name="view__projects__confirmation__informationText"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.projects.confirmation.informationText}
            />
          </div>
          <div>
            <label htmlFor="view__projects__confirmation__whereNextText">
              Vidare, instruktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som instruktion hur användaren kan gå vidare efter en beställning av geotekniska utredningar"
              />
            </label>
            <textarea
              type="text"
              id="view__projects__confirmation__whereNextText"
              name="view__projects__confirmation__whereNextText"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.view.projects.confirmation.whereNextText}
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
        </form>
      </div>
    );
  }
}

export default ToolOptions;
