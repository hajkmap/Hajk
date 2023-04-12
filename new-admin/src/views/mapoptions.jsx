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
        extraPrintResolutions: config.extraPrintResolutions || "",
        extent: config.extent,
        origin: config.origin,
        constrainOnlyCenter: config.constrainOnlyCenter,
        constrainResolution: config.constrainResolution,
        constrainResolutionMobile: config.constrainResolutionMobile || false,
        enableDownloadLink: config.enableDownloadLink || false,
        enableAppStateInHash: config.enableAppStateInHash,
        altShiftDragRotate: config.altShiftDragRotate || true,
        onFocusOnly: config.onFocusOnly || false,
        doubleClickZoom: config.doubleClickZoom || true,
        keyboard: config.keyboard || true,
        mouseWheelZoom: config.mouseWheelZoom || true,
        shiftDragZoom: config.shiftDragZoom || true,
        dragPan: config.dragPan || true,
        pinchRotate: config.pinchRotate || true,
        pinchZoom: config.pinchZoom || true,
        mapselector: config.mapselector,
        mapcleaner: config.mapcleaner,
        mapresetter: config.mapresetter,
        showThemeToggler: config.showThemeToggler,
        showUserAvatar: config.showUserAvatar,
        showRecentlyUsedPlugins: config.showRecentlyUsedPlugins,
        introductionEnabled: config.introductionEnabled || false,
        introductionShowControlButton:
          config.introductionShowControlButton || false,
        introductionSteps:
          this.tryJsonStringify(config.introductionSteps) || "[]",
        drawerVisible: config.drawerVisible,
        drawerVisibleMobile: config.drawerVisibleMobile,
        drawerPermanent: config.drawerPermanent,
        drawerStatic: config.drawerStatic,
        zoomDelta: config.zoomDelta || "",
        zoomDuration: config.zoomDuration || "",
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
        cookieUse3dPart:
          config.cookieUse3dPart !== undefined ? config.cookieUse3dPart : false,
      });
      this.validate();
    });
  }

  componentWillUnmount() {
    this.props.model.off("change:mapConfig");
  }

  tryJsonStringify(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      console.log(error);
      return "";
    }
  }

  isValidJson(v) {
    try {
      JSON.parse(v);
      return true;
    } catch (error) {
      console.log(
        'Invalid format for Introduction steps configuration, please see documentation at https://github.com/HiDeoo/intro.js-react#step. Or provide an empty Array, "[]", if you do not want to specify any Introduction steps.'
      );
      return false;
    }
  }

  UNSAFE_componentWillMount() {
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
      extraPrintResolutions: mapConfig.extraPrintResolutions || "",
      extent: mapConfig.extent,
      origin: mapConfig.origin,
      constrainOnlyCenter: mapConfig.constrainOnlyCenter,
      constrainResolution: mapConfig.constrainResolution,
      constrainResolutionMobile: mapConfig.constrainResolutionMobile || false,
      enableDownloadLink: mapConfig.enableDownloadLink,
      enableAppStateInHash: mapConfig.enableAppStateInHash,
      altShiftDragRotate: mapConfig.altShiftDragRotate,
      onFocusOnly: mapConfig.onFocusOnly,
      doubleClickZoom: mapConfig.doubleClickZoom,
      keyboard: mapConfig.keyboard,
      mouseWheelZoom: mapConfig.mouseWheelZoom,
      shiftDragZoom: mapConfig.shiftDragZoom,
      dragPan: mapConfig.dragPan,
      pinchRotate: mapConfig.pinchRotate,
      pinchZoom: mapConfig.pinchZoom,
      zoomDelta: mapConfig.zoomDelta || "",
      zoomDuration: mapConfig.zoomDuration || "",
      mapselector: mapConfig.mapselector,
      mapcleaner: mapConfig.mapcleaner,
      mapresetter: mapConfig.mapresetter,
      showThemeToggler: mapConfig.showThemeToggler,
      showUserAvatar: mapConfig.showUserAvatar,
      showRecentlyUsedPlugins: mapConfig.showRecentlyUsedPlugins,
      introductionEnabled: mapConfig.introductionEnabled || false,
      introductionShowControlButton:
        mapConfig.introductionShowControlButton || false,
      introductionSteps:
        this.tryJsonStringify(mapConfig.introductionSteps) || "[]",
      drawerVisible: mapConfig.drawerVisible,
      drawerVisibleMobile: mapConfig.drawerVisibleMobile,
      drawerPermanent: mapConfig.drawerPermanent,
      drawerStatic: mapConfig.drawerStatic,
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
      cookieUse3dPart:
        mapConfig.cookieUse3dPart !== undefined
          ? mapConfig.cookieUse3dPart
          : false,
    });
  }

  getValue(fieldName) {
    var input = this.refs["input_" + fieldName],
      value = input ? input.value : "";

    if (input.type === "checkbox") {
      value = input.checked;
    }

    if (
      ["zoom", "maxZoom", "minZoom", "zoomDelta", "zoomDuration"].includes(
        fieldName
      )
    )
      value = parseInt(value);
    if (
      [
        "origin",
        "extent",
        "center",
        "resolutions",
        "extraPrintResolutions",
      ].includes(fieldName)
    )
      value =
        value.trim().length > 0
          ? value.split(",").map((v) => parseFloat(v))
          : [];

    if (fieldName === "title") {
      if (value === "") {
        value = this.props.model.get("mapFile");
      }
    }

    if (fieldName === "introductionSteps") {
      value = this.isValidJson(value) ? JSON.parse(value) : "";
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
        "zoomDelta",
        "zoomDuration",
        "center",
        "introductionSteps",
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
      case "introductionSteps":
        valid = Array.isArray(value);
        break;
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
      case "extraPrintResolutions":
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
      case "zoomDelta":
      case "zoomDuration":
      case "projection":
        if (empty(value)) {
          valid = false;
        }
        break;
      case "constrainOnlyCenter":
      case "constrainResolution":
      case "constrainResolutionMobile":
      case "enableDownloadLink":
      case "enableAppStateInHash":
      case "altShiftDragRotate":
      case "onFocusOnly":
      case "doubleClickZoom":
      case "keyboard":
      case "mouseWheelZoom":
      case "shiftDragZoom":
      case "dragPan":
      case "pinchRotate":
      case "pinchZoom":
      case "mapselector":
      case "mapcleaner":
      case "mapresetter":
      case "showThemeToggler":
      case "showUserAvatar":
      case "showRecentlyUsedPlugins":
      case "introductionEnabled":
      case "introductionShowControlButton":
      case "drawerStatic":
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
        config.extraPrintResolutions = this.getValue("extraPrintResolutions");
        config.extent = this.getValue("extent");
        config.origin = this.getValue("origin");
        config.constrainOnlyCenter = this.getValue("constrainOnlyCenter");
        config.constrainResolution = this.getValue("constrainResolution");
        config.constrainResolutionMobile = this.getValue(
          "constrainResolutionMobile"
        );
        config.enableDownloadLink = this.getValue("enableDownloadLink");
        config.enableAppStateInHash = this.getValue("enableAppStateInHash");
        config.altShiftDragRotate = this.getValue("altShiftDragRotate");
        config.onFocusOnly = this.getValue("onFocusOnly");
        config.doubleClickZoom = this.getValue("doubleClickZoom");
        config.keyboard = this.getValue("keyboard");
        config.mouseWheelZoom = this.getValue("mouseWheelZoom");
        config.shiftDragZoom = this.getValue("shiftDragZoom");
        config.dragPan = this.getValue("dragPan");
        config.pinchRotate = this.getValue("pinchRotate");
        config.pinchZoom = this.getValue("pinchZoom");
        config.zoomDelta = this.getValue("zoomDelta");
        config.zoomDuration = this.getValue("zoomDuration");
        config.mapselector = this.getValue("mapselector");
        config.mapcleaner = this.getValue("mapcleaner");
        config.mapresetter = this.getValue("mapresetter");
        config.showThemeToggler = this.getValue("showThemeToggler");
        config.showUserAvatar = this.getValue("showUserAvatar");
        config.showRecentlyUsedPlugins = this.getValue(
          "showRecentlyUsedPlugins"
        );
        config.introductionEnabled = this.getValue("introductionEnabled");
        config.introductionShowControlButton = this.getValue(
          "introductionShowControlButton"
        );
        config.introductionSteps = this.getValue("introductionSteps");
        config.drawerVisible = this.getValue("drawerVisible");
        config.drawerVisibleMobile = this.getValue("drawerVisibleMobile");
        config.drawerPermanent = this.getValue("drawerPermanent");
        config.drawerStatic = this.getValue("drawerStatic");
        config.activeDrawerOnStart = this.getValue("activeDrawerOnStart");
        config.geoserverLegendOptions = this.getValue("geoserverLegendOptions");
        config.defaultCookieNoticeMessage = this.getValue(
          "defaultCookieNoticeMessage"
        );
        config.defaultCookieNoticeUrl = this.getValue("defaultCookieNoticeUrl");
        config.crossOrigin = this.getValue("crossOrigin");
        config.showCookieNotice = this.getValue("showCookieNotice");
        config.cookieUse3dPart = this.getValue("cookieUse3dPart");
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
                Upplösningar (Extra för utskrift){" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Extra upplösningar som läggs på befintliga upplösningar vid utskrift"
                />
              </label>
              <input
                type="text"
                ref="input_extraPrintResolutions"
                value={this.state.extraPrintResolutions}
                className={this.getValidationClass("extraPrintResolutions")}
                onChange={(e) => {
                  this.setState({ extraPrintResolutions: e.target.value }, () =>
                    this.validateField("extraPrintResolutions")
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
                Lås zoom till satta upplösningar för datorer{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Styr ol.Views 'constrainResolution'-parameter. Om sant kommer det endast gå att zooma mellan satta resolutions"
                />
              </label>
            </div>
            <div>
              <input
                id="input_constrainResolutionMobile"
                type="checkbox"
                ref="input_constrainResolutionMobile"
                onChange={(e) => {
                  this.setState({
                    constrainResolutionMobile: e.target.checked,
                  });
                }}
                checked={this.state.constrainResolutionMobile}
              />
              &nbsp;
              <label
                className="long-label"
                htmlFor="input_constrainResolutionMobile"
              >
                Lås zoom till satta upplösningar för mobiltelefoner{" "}
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
            <div>
              <input
                id="input_enableAppStateInHash"
                type="checkbox"
                ref="input_enableAppStateInHash"
                onChange={(e) => {
                  this.setState({ enableAppStateInHash: e.target.checked });
                }}
                checked={this.state.enableAppStateInHash}
              />
              &nbsp;
              <label
                className="long-label"
                htmlFor="input_enableAppStateInHash"
              >
                Beta: aktivera liveuppdatering av hashparametar i URL-fältet{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Kartans status hålls ständigt uppdaterad, som en del av URL:ens #-parametrar. Se även #1252."
                />
              </label>
            </div>
            <div className="separator">Kartinteraktioner</div>
            <div>
              Se{" "}
              <a href="https://openlayers.org/en/latest/apidoc/module-ol_interaction.html#.defaults">
                OpenLayers-dokumentation
              </a>{" "}
              för detaljer kring vad varje inställning gör.
            </div>
            <div>
              <input
                id="input_altShiftDragRotate"
                type="checkbox"
                ref="input_altShiftDragRotate"
                onChange={(e) => {
                  this.setState({ altShiftDragRotate: e.target.checked });
                }}
                checked={this.state.altShiftDragRotate}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_altShiftDragRotate">
                Whether Alt-Shift-drag rotate is desired{" "}
              </label>
            </div>
            <div>
              <input
                id="input_onFocusOnly"
                type="checkbox"
                ref="input_onFocusOnly"
                onChange={(e) => {
                  this.setState({ onFocusOnly: e.target.checked });
                }}
                checked={this.state.onFocusOnly}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_onFocusOnly">
                Interact only when the map has the{" "}
                <abbr
                  title="This affects the
                MouseWheelZoom and DragPan interactions and is useful when page
                scroll is desired for maps that do not have the browser's focus."
                >
                  focus
                </abbr>{" "}
                (default: false).
              </label>
            </div>
            <div>
              <input
                id="input_doubleClickZoom"
                type="checkbox"
                ref="input_doubleClickZoom"
                onChange={(e) => {
                  this.setState({ doubleClickZoom: e.target.checked });
                }}
                checked={this.state.doubleClickZoom}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_doubleClickZoom">
                Whether double click zoom is desired.
              </label>
            </div>
            <div>
              <input
                id="input_keyboard"
                type="checkbox"
                ref="input_keyboard"
                onChange={(e) => {
                  this.setState({ keyboard: e.target.checked });
                }}
                checked={this.state.keyboard}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_keyboard">
                Whether keyboard interaction is desired.
              </label>
            </div>
            <div>
              <input
                id="input_mouseWheelZoom"
                type="checkbox"
                ref="input_mouseWheelZoom"
                onChange={(e) => {
                  this.setState({ mouseWheelZoom: e.target.checked });
                }}
                checked={this.state.mouseWheelZoom}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_mouseWheelZoom">
                Whether mousewheel zoom is desired.
              </label>
            </div>
            <div>
              <input
                id="input_shiftDragZoom"
                type="checkbox"
                ref="input_shiftDragZoom"
                onChange={(e) => {
                  this.setState({ shiftDragZoom: e.target.checked });
                }}
                checked={this.state.shiftDragZoom}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_shiftDragZoom">
                Whether Shift-drag zoom is desired.
              </label>
            </div>
            <div>
              <input
                id="input_dragPan"
                type="checkbox"
                ref="input_dragPan"
                onChange={(e) => {
                  this.setState({ dragPan: e.target.checked });
                }}
                checked={this.state.dragPan}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_dragPan">
                Whether drag pan is desired.
              </label>
            </div>
            <div>
              <input
                id="input_pinchRotate"
                type="checkbox"
                ref="input_pinchRotate"
                onChange={(e) => {
                  this.setState({ pinchRotate: e.target.checked });
                }}
                checked={this.state.pinchRotate}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_pinchRotate">
                Whether pinch rotate is desired.
              </label>
            </div>
            <div>
              <input
                id="input_pinchZoom"
                type="checkbox"
                ref="input_pinchZoom"
                onChange={(e) => {
                  this.setState({ pinchZoom: e.target.checked });
                }}
                checked={this.state.pinchZoom}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_pinchZoom">
                Whether pinch zoom is desired.
              </label>
            </div>
            <div>
              <label>
                Zoom level delta when using keyboard or double click zoom.
              </label>
              <input
                type="number"
                min="0"
                ref="input_zoomDelta"
                value={this.state.zoomDelta}
                className={
                  (this.getValidationClass("zoomDelta"), "control-fixed-width")
                }
                onChange={(e) => {
                  this.setState({ zoomDelta: e.target.value }, () =>
                    this.validateField("zoomDelta")
                  );
                }}
              />
            </div>
            <div>
              <label>Duration of the zoom animation in milliseconds.</label>
              <input
                type="number"
                min="0"
                ref="input_zoomDuration"
                value={this.state.zoomDuration}
                className={
                  (this.getValidationClass("zoomDuration"),
                  "control-fixed-width")
                }
                onChange={(e) => {
                  this.setState({ zoomDuration: e.target.value }, () =>
                    this.validateField("zoomDuration")
                  );
                }}
              />
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
              <input
                id="input_cookieUse3dPart"
                type="checkbox"
                ref="input_cookieUse3dPart"
                onChange={(e) => {
                  this.setState({ cookieUse3dPart: e.target.checked });
                }}
                checked={this.state.cookieUse3dPart}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_cookieUse3dPart">
                Visa alternativ för 3:e part cookies{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer en checkbox angående 3:e part cookies visas för nya användare."
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
                id="input_mapresetter"
                type="checkbox"
                ref="input_mapresetter"
                onChange={(e) => {
                  this.setState({ mapresetter: e.target.checked });
                }}
                checked={this.state.mapresetter}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_mapresetter">
                Visa en hemknapp som återställer kartans innehåll till startläge{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer en hemknapp som återställer kartan att visas för användaren"
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
            <div>
              <input
                id="input_showUserAvatar"
                type="checkbox"
                ref="input_showUserAvatar"
                onChange={(e) => {
                  this.setState({ showUserAvatar: e.target.checked });
                }}
                checked={this.state.showUserAvatar}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_showUserAvatar">
                Visa en knapp med användarens initialer intill zoomknapparna{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om AD-kopplingen är aktiv kommer en avatar-ikon bestående av användarens initialer att visas bland kartkontrollerna"
                />
              </label>
            </div>
            <div>
              <input
                id="input_showRecentlyUsedPlugins"
                type="checkbox"
                ref="input_showRecentlyUsedPlugins"
                onChange={(e) => {
                  this.setState({ showRecentlyUsedPlugins: e.target.checked });
                }}
                checked={this.state.showRecentlyUsedPlugins}
              />
              &nbsp;
              <label
                className="long-label"
                htmlFor="input_showRecentlyUsedPlugins"
              >
                Visa en snabbväljare med de senast använda verktygen{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Den här kontrollen visar en liten knapp som vid hover/touch visar de senast använda verktygen och låter användaren aktivera dessa. Snabbväljaren är särskild användbar i mobilläget."
                />
              </label>
            </div>
            <div className="separator">Introduktionsguide</div>
            <div>
              <input
                id="input_introductionEnabled"
                type="checkbox"
                ref="input_introductionEnabled"
                onChange={(e) => {
                  this.setState({ introductionEnabled: e.target.checked });
                }}
                checked={this.state.introductionEnabled}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_introductionEnabled">
                Starta introduktionsguiden automatiskt första gången användaren
                besöker kartan{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktivt kommer en introduktionsguide att visas för användaren vid första besöket"
                />
              </label>
            </div>
            <div>
              <input
                id="input_introductionShowControlButton"
                type="checkbox"
                ref="input_introductionShowControlButton"
                disabled={!this.state.introductionEnabled}
                onChange={(e) => {
                  this.setState({
                    introductionShowControlButton: e.target.checked,
                  });
                }}
                checked={this.state.introductionShowControlButton}
              />
              &nbsp;
              <label
                className="long-label"
                htmlFor="input_introductionShowControlButton"
              >
                Visa en knapp i kartan som låter användaren att starta guiden
                manuellt{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktivt kommer en knapp att visas intill zoom-knapparna. "
                />
              </label>
            </div>
            <div>
              <label>
                Steg som visas i introduktionsguiden{" "}
                <a
                  href="https://github.com/HiDeoo/intro.js-react#step"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  (se exempel)
                </a>{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="JSON-objekt som specificerar vilka element som highlightas i introduktionsguiden. OBS: kan lämnas tomt för att highlighta ett antal standardobjekt (sidopanelen, sökrutan, etc). "
                />
              </label>
              <textarea
                type="text"
                placeholder="[]"
                disabled={!this.state.introductionEnabled}
                ref="input_introductionSteps"
                value={this.state.introductionSteps}
                className={this.getValidationClass("introductionSteps")}
                onChange={(e) => {
                  this.setState({ introductionSteps: e.target.value }, () =>
                    this.validateField("introductionSteps")
                  );
                }}
              />
            </div>
            <div className="separator">Inställningar för sidopanel</div>
            <div>
              <input
                id="input_drawerStatic"
                type="checkbox"
                ref="input_drawerStatic"
                onChange={(e) => {
                  this.setState({ drawerStatic: e.target.checked });
                  if (e.target.checked === true) {
                    this.setState({
                      drawerPermanent: true,
                      drawerVisible: true,
                    });
                  }
                }}
                checked={this.state.drawerStatic}
              />
              &nbsp;
              <label className="long-label" htmlFor="input_drawerStatic">
                Låt sidopanelen vara permanent synlig{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Om aktiv kommer sidopanelen inte gå att göra osynlig"
                />
              </label>
            </div>
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
                disabled={this.state.drawerStatic === true}
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
                disabled={this.state.drawerStatic === true}
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
                disabled={
                  this.state.drawerVisible !== true ||
                  this.state.drawerStatic === true
                }
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
