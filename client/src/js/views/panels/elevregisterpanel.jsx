// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/hajkmap/Hajk

var Panel = require("views/panel");
var Alert = require("alert");
var ColorPicker = require("components/colorpicker");
var urlID = [],
  elev_count = [],
  toggle = 0,
  sum;
/**
 * @class
 */
var ElevregisterPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      visible: false,
      pointSettings: this.props.model.get("pointSettings"),
      pointRadius: this.props.model.get("pointRadius"),
      pointSymbol: this.props.model.get("pointSymbol"),
      fontSize: this.props.model.get("fontSize"),
      lineWidth: this.props.model.get("lineWidth"),
      lineStyle: this.props.model.get("lineStyle"),
      circleLineColor: this.props.model.get("circleLineColor"),
      circleFillColor: this.props.model.get("circleFillColor"),
      circleLineStyle: this.props.model.get("circleLineStyle"),
      circleLineWidth: this.props.model.get("circleLineWidth"),
      polygonLineWidth: this.props.model.get("polygonLineWidth"),
      polygonLineStyle: this.props.model.get("polygonLineStyle"),
      polygonFillOpacity: this.props.model.get("polygonFillOpacity"),
      boxLineColor: this.props.model.get("boxLineColor"),
      boxFillColor: this.props.model.get("boxFillColor"),
      boxLineStyle: this.props.model.get("boxLineStyle"),
      boxLineWidth: this.props.model.get("boxLineWidth")
    };
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function() {
    this.props.model.abort();
    this.props.model.off("change:dialog");
  },

  /**
   * Triggered before the component mounts.
   * @instance
   */
  componentWillMount: function() {
    this.setState({
      showLabels: this.props.model.get("showLabels")
    });
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function() {
    this.props.model.on("change:dialog", () => {
      this.setState({
        dialog: this.props.model.get("dialog")
      });
      this.refs.textInput.focus();
    });
  },

  /**
   * Render alert component
   * @instance
   * @return {AlertView}
   */
  renderAlert: function() {
    var options = {
      visible: this.state.alert,
      message: this.state.alertMessage,
      confirm: this.state.confirm,
      confirmAction: () => {
        this.state.confirmAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: ""
        });
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: ""
        });
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: ""
        });
      }
    };

    if (this.state.alert) {
      return <Alert options={options} />;
    } else {
      return null;
    }
  },

  /**
   * Remove all drawings from map.
   * @instance
   */
  clear: function() {
    this.props.model.clear();
  },

  /**
   * Confirm before clear.
   * @instance
   */
  alertClear: function() {
    this.setState({
      alert: true,
      alertMessage: "Ta bort symboler i kartan?",
      confirm: true,
      confirmAction: () => {
        this.clear();
        $("#studentCount").html("");
        elev_count = [];
      },
      denyAction: () => {
        this.setState({ alert: false });
      }
    });
  },

  showOnMap: function() {
    this.props.model.showOnMap(urlID);
  },

  getSchools: function() {
    this.props.model.getSchools();
  },

  getClasses: function() {
    this.props.model.getClasses();
  },
  /**
   * Abort any operation and deselect any tool.
   * @instance
   */
  abort: function() {
    this.props.model.abort();

    $("#abort").hide();
    this.setState({
      symbology: ""
    });
  },

  /*
   * Activate given elevregister tool and update visuals.
   * @instance
   * @param {string} type
   */
  activateElevregisterTool: function(type) {
    if (toggle % 2 == 0) {
      $("#color").attr("title", "Dölj stilsättning");
      $("#this_icon")
        .removeClass("fa-paint-brush")
        .addClass("fa-angle-up");
      this.setState({
        symbology: type
      });
      toggle++;
    } else {
      $("#this_icon")
        .removeClass("fa-angle-up")
        .addClass("fa-paint-brush");
      $("#color").attr("title", "Välj stilsättning");
      this.abort();
      toggle++;
    }
  },

  /**
   * Set marker image.
   * @instance
   * @param {object} e
   */
  setMarkerImg: function(e) {
    this.props.model.set("markerImg", e.target.src);
    this.forceUpdate();
  },

  /**
   * Render the symbology component.
   * @instance
   * @param {string} type
   * @return {external:ReactElement} component
   */
  renderSymbology: function(type) {
    function update(func, state_prop, e) {
      var value = e.target.value,
        state = {};

      if (e.target.type === "checkbox") {
        value = e.target.checked;
      }

      if (typeof value === "string") {
        value = !isNaN(parseFloat(value))
          ? parseFloat(value)
          : !isNaN(parseInt(value))
          ? parseInt(value)
          : value;
      }

      state[state_prop] = value;
      this.setState(state);
      this.props.model[func].call(this.props.model, value);
    }

    function hasClass(icon) {
      return this.props.model.get("markerImg") ===
        window.location.href + `assets/icons/${icon}.png`
        ? "selected"
        : "";
    }

    function renderIcons() {
      var icons = this.props.model.get("icons").split(",");

      return icons.map((icon, i) => {
        icon = icon.trim();
        if (icon === "br") {
          return <br key={i} />;
        } else {
          var iconSrc = `assets/icons/${icon}.png`;
          return (
            <div key={i} className={hasClass.call(this, icon)}>
              <img onClick={this.setMarkerImg} src={iconSrc} />
            </div>
          );
        }
      });
    }

    function renderPointSettings() {
      switch (this.state.pointSettings) {
        case "point":
          return (
            <div className="panel panel-default colorPicker">
              <div className="panel-body">
                <ColorPicker
                  model={this.props.model}
                  property="pointColor"
                  onChange={this.props.model.setPointColor.bind(
                    this.props.model
                  )}
                />
                <div>Välj storlek</div>
                <select
                  value={this.state.pointRadius}
                  onChange={update.bind(this, "setPointRadius", "pointRadius")}
                >
                  <option value="4">Liten</option>
                  <option value="7">Normal</option>
                  <option value="14">Stor</option>
                  <option value="20">Större</option>
                </select>
              </div>
            </div>
          );
      }
    }

    switch (type) {
      case "Point":
        return <div>{renderPointSettings.call(this)}</div>;

      default:
        return <div />;
    }
  },

  /**
   * Render the dialog component.
   * @instance
   * @param {boolean} visible
   * @return {external:ReactElement} component
   */
  renderDialog: function(visible) {
    if (!visible) return null;

    function enter(e) {
      if (e.keyCode == 13) {
        update.call(this);
      }
    }

    function abort() {
      this.props.model.set("dialog", false);
      this.refs.textInput.blur();
      this.props.model.removeEditFeature();
    }

    function update() {
      this.refs.textInput.blur();
      this.props.model.set("dialog", false);
      this.props.model.setPointText(this.refs.textInput.value);
    }

    return (
      <div className="modal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Ange text</h4>
            </div>
            <div className="modal-body">
              <input ref="textInput" onKeyDown={enter.bind(this)} />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-default"
                data-dismiss="modal"
                onClick={update.bind(this)}
              >
                Spara
              </button>
              &nbsp;
              <button
                type="button"
                className="btn btn-default"
                data-dismiss="modal"
                onClick={abort.bind(this)}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },

  /**
   * Render the view.
   * @instance
   * @return {external:ReactElement}
   */
  render: function() {
    //klasser: Hold down the Ctrl (windows) / Command (Mac) button to select multiple options.

    var dialog = this.renderDialog(this.state.dialog),
      symbology = this.renderSymbology(this.state.symbology);

    //this.getSchools();
    return (
      <Panel
        title="Elevregister"
        onCloseClicked={this.props.onCloseClicked}
        onUnmountClicked={this.props.onUnmountClicked}
        minimized={this.props.minimized}
        instruction={atob(this.props.model.get("instruction"))}
      >
        <div className="elevregister-tools">
          <div>
            <div className="panel panel-default">
              <div className="panel-heading">Skolform </div>
              <div className="panel-body">
                <select
                  id="skolform"
                  multiple="multiple"
                  onChange={this.getSchools}
                  style={{ width: "98%" }}
                >
                  <option id="0" value="FSK">
                    Förskola
                  </option>
                  <option id="1" value="GR">
                    Grundkola
                  </option>
                  <option id="2" value="GRSÄR">
                    Grundsärskola
                  </option>
                </select>
              </div>
              <div className="panel-heading">Skolor </div>
              <div className="panel-body">
                <select
                  id="skolor"
                  multiple="multiple"
                  onChange={this.getClasses}
                  style={{ width: "98%" }}
                />
              </div>
            </div>
            <br />
            <div className="panel panel-default">
              <div className="panel-heading">Klasser / avdelningar</div>
              <div className="panel-body">
                <select
                  id="klasser"
                  multiple="multiple"
                  style={{ width: "98%" }}
                >
                  <option value="none" />
                </select>
              </div>
            </div>{" "}
            <label id="studentCount" />
            <br />
            <div />
          </div>

          <div className="panel panel-default stilform">
            <div className="panel-heading">
              <button
                id="showID"
                className="btn btn-primary"
                onClick={this.showOnMap}
              >
                Visa
              </button>
              <button
                id="clear"
                className="btn btn-secondary"
                onClick={this.alertClear}
              >
                <i className="fa fa-trash fa-0" />
                Rensa
              </button>
              <button
                id="color"
                className="btn btn-secondary pull-right"
                onClick={this.activateElevregisterTool.bind(this, "Point")}
                title="Välj stilsättning"
              >
                <i id="this_icon" className="fa fa-paint-brush" />
              </button>
            </div>
          </div>
        </div>
        <div>
          {dialog}
          {symbology}
          {this.renderAlert()}
        </div>
      </Panel>
    );
  }
};

/**
 * ElevregisterPanelView module.<br>
 * Use <code>require('views/elevregisterpanel')</code> for instantiation.
 * @module ElevregisterPanelView-module
 * @returns {ElevregisterPanelView}
 */
module.exports = React.createClass(ElevregisterPanelView);
