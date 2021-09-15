import React from "react";
import { Component } from "react";
import { SketchPicker } from "react-color";
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

var defaultState = {
  primaryColor: "#00F",
  secondaryColor: "#FF0",
  preferredColorScheme: "user",
  validationErrors: [],
};

class MapOptions extends Component {
  constructor() {
    super();
    this.state = defaultState;
  }

  componentDidMount() {
    this.props.model.on("change:mapConfig", (e) => {
      var config = this.props.model.get("mapConfig");
      this.setState({
        primaryColor: config.colors.primaryColor,
        secondaryColor: config.colors.secondaryColor,
        preferredColorScheme: config.colors.preferredColorScheme,
        projection: config.projection,
        zoom: config.zoom,
        maxZoom: config.maxZoom,
        minZoom: config.minZoom,
        center: config.center,
        logoLight: config.logoLight || "logoLight.png",
        logoDark: config.logoDark || "logoDark.png",
        resolutions: config.resolutions,
        extent: config.extent,
        origin: config.origin,
        constrainOnlyCenter: config.constrainOnlyCenter,
        constrainResolution: config.constrainResolution,
        enableDownloadLink: config.enableDownloadLink,
        mapselector: config.mapselector,
        mapcleaner: config.mapcleaner,
        showThemeToggler: config.showThemeToggler,
        drawerVisible: config.drawerVisible,
        drawerVisibleMobile: config.drawerVisibleMobile,
        drawerPermanent: config.drawerPermanent,
        title: config.title ? config.title : "",
        geoserverLegendOptions: config.geoserverLegendOptions
          ? config.geoserverLegendOptions
          : "",
        defaultCookieNoticeMessage: config.defaultCookieNoticeMessage,
        defaultCookieNoticeUrl: config.defaultCookieNoticeUrl,
        crossOrigin: config.crossOrigin,
        showCookieNotice:
          config.showCookieNotice !== undefined
            ? config.showCookieNotice
            : true,
      });
      this.validate();
    });
  }

  componentWillUnmount() {
    this.props.model.off("change:mapConfig");
  }

  componentWillMount() {
    var mapConfig = this.props.model.get("mapConfig");
    this.setState({
      primaryColor:
        mapConfig.colors && mapConfig.colors.primaryColor
          ? mapConfig.colors.primaryColor
          : "#000",
      secondaryColor:
        mapConfig.colors && mapConfig.colors.secondaryColor
          ? mapConfig.colors.secondaryColor
          : "#000",
      preferredColorScheme:
        mapConfig.colors && mapConfig.colors.preferredColorScheme
          ? mapConfig.colors.preferredColorScheme
          : "user",
      title: mapConfig.title,
      projection: mapConfig.projection,
      zoom: mapConfig.zoom,
      maxZoom: mapConfig.maxZoom,
      minZoom: mapConfig.minZoom,
      center: mapConfig.center,
      logoLight: mapConfig.logoLight || "logoLight.png",
      logoDark: mapConfig.logoDark || "logoDark.png",
      resolutions: mapConfig.resolutions,
      extent: mapConfig.extent,
      origin: mapConfig.origin,
      constrainOnlyCenter: mapConfig.constrainOnlyCenter,
      constrainResolution: mapConfig.constrainResolution,
      enableDownloadLink: mapConfig.enableDownloadLink,
      mapselector: mapConfig.mapselector,
      mapcleaner: mapConfig.mapcleaner,
      showThemeToggler: mapConfig.showThemeToggler,
      drawerVisible: mapConfig.drawerVisible,
      drawerVisibleMobile: mapConfig.drawerVisibleMobile,
      drawerPermanent: mapConfig.drawerPermanent,
      activeDrawerOnStart: mapConfig.activeDrawerOnStart
        ? mapConfig.activeDrawerOnStart
        : "plugins",
      geoserverLegendOptions: mapConfig.geoserverLegendOptions,
      defaultCookieNoticeMessage: mapConfig.defaultCookieNoticeMessage
        ? mapConfig.defaultCookieNoticeMessage
        : "Vi använder cookies för att följa upp användandet och ge en bra upplevelse av kartan. Du kan blockera cookies i webbläsaren men då visas detta meddelande igen.",
      defaultCookieNoticeUrl: mapConfig.defaultCookieNoticeUrl
        ? mapConfig.defaultCookieNoticeUrl
        : "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/",
      crossOrigin: mapConfig.crossOrigin ? mapConfig.crossOrigin : "anonymous",
      showCookieNotice:
        mapConfig.showCookieNotice !== undefined
          ? mapConfig.showCookieNotice
          : true,
    });
  }

  getValue(fieldName) {
    var input = this.refs["input_" + fieldName],
      value = input ? input.value : "";

    if (input.type === "checkbox") {
      value = input.checked;
    }

    if (["zoom", "maxZoom", "minZoom"].includes(fieldName))
      value = parseInt(value);
    if (["origin", "extent", "center", "resolutions"].includes(fieldName))
      value = value.split(",").map((v) => parseFloat(v));

    if (fieldName === "title") {
      if (value === "") {
        value = this.props.model.get("mapFile");
      }
    }

    return value;
  }

  validate(callback) {
    var validationFields = [
        "title",
        "projection",
        "zoom",
        "maxZoom",
        "minZoom",
        "center",
      ],
      validationErrors = [];

    validationFields.forEach((field) => {
      var valid = this.validateField(field, false);
      if (!valid) {
        validationErrors.push(field);
      }
    });

    this.setState(
      {
        validationErrors: validationErrors,
      },
      () => {
        if (callback) {
          callback(validationErrors.length === 0);
        }
      }
    );
  }

  validateField(fieldName, updateState) {
    var value = this.getValue(fieldName),
      valid = true;

    function number(v) {
      return !empty(v) && !isNaN(Number(v));
    }

    function empty(v) {
      return typeof v === "string"
        ? v.trim() === ""
        : Array.isArray(v)
        ? v[0] === ""
        : false;
    }

    function coord(v) {
      return v.length === 2 && v.every(number);
    }

    function resolutions(v) {
      return v.length > 0 && v.every(number);
    }

    function extent(v) {
      return v.length === 4 && v.every(number);
    }

    switch (fieldName) {
      case "title":
        if (empty(value)) {
          valid = false;
        }
        break;
      case "resolutions":
        if (!resolutions(value)) {
          valid = false;
        }
        break;
      case "extent":
        if (!extent(value)) {
          valid = false;
        }
        break;
      case "origin":
      case "center":
        if (!coord(value) || empty(value)) {
          valid = false;
        }
        break;
      case "zoom":
      case "minZoom":
      case "maxZoom":
        if (!number(value) || empty(value)) {
          valid = false;
        }
        break;
      case "projection":
        if (empty(value)) {
          valid = false;
        }
        break;
      case "constrainOnlyCenter":
      case "constrainResolution":
      case "enableDownloadLink":
      case "mapselector":
      case "mapcleaner":
      case "showThemeToggler":
      case "drawerVisible":
      case "drawVisibleMobile":
      case "drawerPermanent":
        if (value !== true && value !== false) {
          valid = false;
        }
        break;
      default:
        break;
    }

    if (updateState !== false) {
      if (!valid) {
        this.setState({
          validationErrors: [...this.state.validationErrors, fieldName],
        });
      } else {
        this.setState({
          validationErrors: this.state.validationErrors.filter(
            (v) => v !== fieldName
          ),
        });
      }
    }

    return valid;
  }

  save() {
    var config = this.props.model.get("mapConfig");
    this.validate((valid) => {
      if (valid) {
        config.title = this.getValue("title");
        config.projection = this.getValue("projection");
        config.zoom = this.getValue("zoom");
        config.maxZoom = this.getValue("maxZoom");
        config.minZoom = this.getValue("minZoom");
        config.center = this.getValue("center");
        config.logoLight = this.getValue("logoLight");
        config.logoDark = this.getValue("logoDark");
        config.resolutions = this.getValue("resolutions");
        config.extent = this.getValue("extent");
        config.origin = this.getValue("origin");
        config.constrainOnlyCenter = this.getValue("constrainOnlyCenter");
        config.constrainResolution = this.getValue("constrainResolution");
        config.enableDownloadLink = this.getValue("enableDownloadLink");
        config.mapselector = this.getValue("mapselector");
        config.mapcleaner = this.getValue("mapcleaner");
        config.showThemeToggler = this.getValue("showThemeToggler");
        config.drawerVisible = this.getValue("drawerVisible");
        config.drawerVisibleMobile = this.getValue("drawerVisibleMobile");
        config.drawerPermanent = this.getValue("drawerPermanent");
        config.activeDrawerOnStart = this.getValue("activeDrawerOnStart");
        config.geoserverLegendOptions = this.getValue("geoserverLegendOptions");
        config.defaultCookieNoticeMessage = this.getValue(
          "defaultCookieNoticeMessage"
        );
        config.defaultCookieNoticeUrl = this.getValue("defaultCookieNoticeUrl");
        config.crossOrigin = this.getValue("crossOrigin");
        config.showCookieNotice = this.getValue("showCookieNotice");
        this.props.model.updateMapConfig(config, (success) => {
          var msg = success
            ? "Uppdateringen lyckades."
            : "Uppdateringen misslyckades.";
          this.props.parent.setState({
            alert: true,
            alertMessage: msg,
          });
        });
      }
    });
  }

  handlePrimaryColorComplete(color) {
    if (!this.props.model.get("mapConfig").colors) {
      this.props.model.get("mapConfig").colors = {};
    }
    this.props.model.get("mapConfig").colors.primaryColor = color.hex;
    this.setState({
      primaryColor: color.hex,
    });
  }

  handleSecondaryColorComplete(color) {
    if (!this.props.model.get("mapConfig").colors) {
      this.props.model.get("mapConfig").colors = {};
    }
    this.props.model.get("mapConfig").colors.secondaryColor = color.hex;
    this.setState({
      secondaryColor: color.hex,
    });
  }

  handlePreferredColorScheme(value) {
    if (!this.props.model.get("mapConfig").colors) {
      this.props.model.get("mapConfig").colors = {};
    }
    this.props.model.get("mapConfig").colors.preferredColorScheme = value;
    this.setState({
      preferredColorScheme: value,
    });
  }

  getValidationClass(inputName) {
    return this.state.validationErrors.find((v) => v === inputName)
      ? "validation-error"
      : "";
  }

  render() {
    return (
      <div>
        <aside>Hantera inställningar för kartan.</aside>
        <article>
          <fieldset className="tree-view">
            <legend>Kartinställningar</legend>
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={(e) => this.save(e)}
              startIcon={<SaveIcon />}
            >
              Spara
            </ColorButtonBlue>
            <br />
            <div>
              <label>
                Titel{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om inget anges blir titel kartans filnamn"
                />
              </label>
              <input
                type="text"
                ref="input_title"
                value={this.state.title}
                className={this.getValidationClass("title")}
                onChange={(e) => {
                  this.setState({ title: e.target.value }, () =>
                    this.validateField("title")
                  );
                }}
              />
            </div>
            <div>
              <div className="separator">
                Grundinställningar för kartvisning
              </div>
              <label>
                Projektion{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'projection'-parameter, ex 'EPSG:3008'"
                />
              </label>
              <input
                type="text"
                ref="input_projection"
                value={this.state.projection}
                className={this.getValidationClass("projection")}
                onChange={(e) => {
                  this.setState({ projection: e.target.value }, () =>
                    this.validateField("projection")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Startzoom{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'zoom'-parameter, ex '2'"
                />
              </label>
              <input
                type="number"
                min="0"
                ref="input_zoom"
                value={this.state.zoom}
                className={
                  (this.getValidationClass("zoom"), "control-fixed-width")
                }
                onChange={(e) => {
                  this.setState({ zoom: e.target.value }, () =>
                    this.validateField("zoom")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Max-zoomnivå{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'maxZoom'-parameter, ex '20'"
                />
              </label>
              <input
                type="number"
                min="0"
                ref="input_maxZoom"
                value={this.state.maxZoom}
                className={
                  (this.getValidationClass("maxZoom"), "control-fixed-width")
                }
                onChange={(e) => {
                  this.setState({ maxZoom: e.target.value }, () =>
                    this.validateField("maxZoom")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Min-zoomnivå{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'minZoom'-parameter, ex '0'"
                />
              </label>
              <input
                type="number"
                min="0"
                ref="input_minZoom"
                value={this.state.minZoom}
                className={
                  (this.getValidationClass("minZoom"), "control-fixed-width")
                }
                onChange={(e) => {
                  this.setState({ minZoom: e.target.value }, () =>
                    this.validateField("minZoom")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Centrumkoordinat{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'center'-parameter, ex '110600,6283796'"
                />
              </label>
              <input
                type="text"
                ref="input_center"
                value={this.state.center}
                className={this.getValidationClass("center")}
                onChange={(e) => {
                  this.setState({ center: e.target.value }, () =>
                    this.validateField("center")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Upplösningar{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'resolutions'-parameter, ex '4096,2048,1024,512'"
                />
              </label>
              <input
                type="text"
                ref="input_resolutions"
                value={this.state.resolutions}
                className={this.getValidationClass("resolutions")}
                onChange={(e) => {
                  this.setState({ resolutions: e.target.value }, () =>
                    this.validateField("resolutions")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Extent{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'extent'-parameter, ex '1,2,3,4'"
                />
              </label>
              <input
                type="text"
                ref="input_extent"
                value={this.state.extent}
                className={this.getValidationClass("extent")}
                onChange={(e) => {
                  this.setState({ extent: e.target.value }, () =>
                    this.validateField("extent")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Origin{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Används som OpenLayers View 'origin'-parameter, ex '0,0'"
                />
              </label>
              <input
                type="text"
                ref="input_origin"
                value={this.state.origin}
                className={this.getValidationClass("origin")}
                onChange={(e) => {
                  this.setState({ origin: e.target.value }, () =>
                    this.validateField("origin")
                  );
                }}
              />
            </div>
            <div>
              <input
                id="input_constrainOnlyCenter"
                type="checkbox"
                ref="input_constrainOnlyCenter"
                onChange={(e) => {
                  this.setState({ constrainOnlyCenter: e.target.checked });
                }}
                checked={this.state.constrainOnlyCenter}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_constrainOnlyCenter">
                Lätta på extent{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Styr ol.Views 'constrainOnlyCenter'-parameter. Om sant kommer endast centrumkoordinaten att begränsas till extent."
                />
              </label>
            </div>
            <div>
              <input
                id="input_constrainResolution"
                type="checkbox"
                ref="input_constrainResolution"
                onChange={(e) => {
                  this.setState({ constrainResolution: e.target.checked });
                }}
                checked={this.state.constrainResolution}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_constrainResolution">
                Lås zoom till satta upplösningar{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Styr ol.Views 'constrainResolution'-parameter. Om sant kommer det endast gå att zooma mellan satta resolutions"
                />
              </label>
            </div>
            <div>
              <input
                id="input_enableDownloadLink"
                type="checkbox"
                ref="input_enableDownloadLink"
                onChange={(e) => {
                  this.setState({ enableDownloadLink: e.target.checked });
                }}
                checked={this.state.enableDownloadLink}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_enableDownloadLink">
                Tillåt nedladdning av WMS-lager{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktivt kommer en nedladdningsknapp att visas brevid varje lager i Lagerhanteraren."
                />
              </label>
            </div>
            <div className="separator">Extra inställningar</div>
            <div>
              <label>
                Logo för ljust tema{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Sökväg till logga att använda i <img>-taggen. Kan vara relativ Hajk-root eller absolut."
                />
              </label>
              <input
                type="text"
                ref="input_logoLight"
                value={this.state.logoLight}
                className={this.getValidationClass("logoLight")}
                onChange={(e) => {
                  this.setState({ logoLight: e.target.value }, () =>
                    this.validateField("logoLight")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Logo för mörkt tema{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Sökväg till logga att använda i <img>-taggen. Kan vara relativ Hajk-root eller absolut."
                />
              </label>
              <input
                type="text"
                ref="input_logoDark"
                value={this.state.logoDark}
                className={this.getValidationClass("logoDark")}
                onChange={(e) => {
                  this.setState({ logoDark: e.target.value }, () =>
                    this.validateField("logoDark")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Legend options{" "}
                <a
                  href="http://docs.geoserver.org/stable/en/user/services/wms/get_legend_graphic/index.html#controlling-legend-appearance-with-legend-options"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="Klicka för mer info om formatering"
                  />
                </a>
              </label>
              <input
                type="text"
                ref="input_geoserverLegendOptions"
                value={this.state.geoserverLegendOptions}
                className={this.getValidationClass("geoserverLegendOptions")}
                onChange={(e) => {
                  this.setState({ geoserverLegendOptions: e.target.value });
                }}
              />
            </div>
            <div>
              <input
                id="input_showCookieNotice"
                type="checkbox"
                ref="input_showCookieNotice"
                onChange={(e) => {
                  this.setState({ showCookieNotice: e.target.checked });
                }}
                checked={this.state.showCookieNotice}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_showCookieNotice">
                Visa cookies-meddelande{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer ett meddelande angående hantering av cookies visas för nya användare."
                />
              </label>
            </div>
            <div>
              <label>
                Cookies-meddelande{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Ange meddelande för cookies"
                />
              </label>
              <textarea
                type="text"
                disabled={!this.state.showCookieNotice}
                ref="input_defaultCookieNoticeMessage"
                value={this.state.defaultCookieNoticeMessage}
                className={this.getValidationClass(
                  "defaultCookieNoticeMessage"
                )}
                onChange={(e) => {
                  this.setState(
                    { defaultCookieNoticeMessage: e.target.value },
                    () => this.validateField("defaultCookieNoticeMessage")
                  );
                }}
              />
            </div>
            <div>
              <label>
                Cookies-länk{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Valfri URL som öppnas med knappen 'Mer information'"
                />
              </label>
              <input
                type="text"
                ref="input_defaultCookieNoticeUrl"
                disabled={!this.state.showCookieNotice}
                value={this.state.defaultCookieNoticeUrl}
                className={this.getValidationClass("defaultCookieNoticeUrl")}
                onChange={(e) => {
                  this.setState({ defaultCookieNoticeUrl: e.target.value });
                }}
              />
            </div>
            <div>
              <label>
                Cross origin-parameter{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Ställer in vilket värde som används för 'crossOrigin'. Om osäker, används 'anonymous'. "
                />
              </label>
              <input
                type="text"
                ref="input_crossOrigin"
                disabled={!this.state.showCookieNotice}
                value={this.state.crossOrigin}
                className={this.getValidationClass("crossOrigin")}
                onChange={(e) => {
                  this.setState({ crossOrigin: e.target.value });
                }}
              />
            </div>
            <div className="separator">Extra kontroller i kartan</div>
            <div>
              <input
                id="input_mapselector"
                type="checkbox"
                ref="input_mapselector"
                onChange={(e) => {
                  this.setState({ mapselector: e.target.checked });
                }}
                checked={this.state.mapselector}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_mapselector">
                Visa kartväljare{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer en väljare med andra tillgängliga kartor att visas för användaren"
                />
              </label>
            </div>
            <div>
              <input
                id="input_mapcleaner"
                type="checkbox"
                ref="input_mapcleaner"
                onChange={(e) => {
                  this.setState({ mapcleaner: e.target.checked });
                }}
                checked={this.state.mapcleaner}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_mapcleaner">
                Visa knapp för att rensa kartan{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer en väljare med andra tillgängliga kartor att visas för användaren"
                />
              </label>
            </div>
            <div>
              <input
                id="input_showThemeToggler"
                type="checkbox"
                ref="input_showThemeToggler"
                onChange={(e) => {
                  this.setState({ showThemeToggler: e.target.checked });
                }}
                checked={this.state.showThemeToggler}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_showThemeToggler">
                Visa knapp för att byta mellan ljust och mörkt tema{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer en knapp som möjliggör temaväxling att visas"
                />
              </label>
            </div>
            <div className="separator">Inställningar för sidopanel</div>
            <div>
              <input
                id="input_drawerVisible"
                type="checkbox"
                ref="input_drawerVisible"
                onChange={(e) => {
                  this.setState({ drawerVisible: e.target.checked });
                  // If visible gets unchecked, ensure that permanent is unchecked too
                  if (e.target.checked === false) {
                    this.setState({
                      drawerPermanent: false,
                    });
                  }
                }}
                checked={this.state.drawerVisible}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_drawerVisible">
                Starta med sidopanelen synlig{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer sidopanelen att vara synlig när kartan laddat"
                />
              </label>
            </div>
            <div>
              <input
                id="input_drawerVisibleMobile"
                type="checkbox"
                ref="input_drawerVisibleMobile"
                onChange={(e) => {
                  this.setState({ drawerVisibleMobile: e.target.checked });
                }}
                checked={this.state.drawerVisibleMobile}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_drawerVisibleMobile">
                Starta med sidopanelen synlig i mobilläge{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer sidopanelen att vara öppen - men inte låst -  vid skärmens kant vid start"
                />
              </label>
            </div>
            <div>
              <input
                id="input_drawerPermanent"
                type="checkbox"
                ref="input_drawerPermanent"
                onChange={(e) => {
                  this.setState({ drawerPermanent: e.target.checked });
                }}
                checked={this.state.drawerPermanent}
                disabled={this.state.drawerVisible !== true}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_drawerPermanent">
                Låt sidopanelen vara låst vid start{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer sidopanelen att vara låst vid skärmens kant vid start (gäller ej mobila enheter)"
                />
              </label>
            </div>
            <div>
              <label>
                Aktiv drawer innehåll{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Styra drawer innehåll som ska vara aktiv vid start. Gäller om flera verktyg som aktiveras via drawer knapp användas."
                />
              </label>
              <input
                type="text"
                ref="input_activeDrawerOnStart"
                value={this.state.activeDrawerOnStart}
                className={this.getValidationClass("activeDrawerOnStart")}
                onChange={(e) => {
                  this.setState({ activeDrawerOnStart: e.target.value }, () =>
                    this.validateField("activeDrawerOnStart")
                  );
                }}
              />
            </div>
            <div className="separator">Färginställningar för kartan</div>
            <div>
              <label htmlFor="target">
                Ljus/mörkt färgtema{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Avgör om användarens preferenser gällande färgtema följs"
                />
              </label>
              <select
                id="preferredColorScheme"
                name="preferredColorScheme"
                className="control-fixed-width"
                onChange={(e) => {
                  this.handlePreferredColorScheme(e.target.value);
                }}
                value={this.state.preferredColorScheme}
              >
                <option value="user">Låt användaren bestämma (default)</option>
                <option value="light">Ljust</option>
                <option value="dark">Mörkt</option>
              </select>
            </div>
            <div className="clearfix">
              <span className="pull-left">
                <div>Huvudfärg</div>
                <SketchPicker
                  color={this.state.primaryColor}
                  onChangeComplete={(e) => this.handlePrimaryColorComplete(e)}
                />
              </span>
              <span className="pull-left" style={{ marginLeft: "10px" }}>
                <div>Komplementfärg</div>
                <SketchPicker
                  color={this.state.secondaryColor}
                  onChangeComplete={(e) => this.handleSecondaryColorComplete(e)}
                />
              </span>
            </div>
            <br />
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={(e) => this.save(e)}
              startIcon={<SaveIcon />}
            >
              Spara
            </ColorButtonBlue>
            &nbsp;
          </fieldset>
        </article>
      </div>
    );
  }
}

export default MapOptions;
