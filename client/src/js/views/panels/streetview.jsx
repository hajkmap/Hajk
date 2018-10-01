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
/**
 * @class
 */
var StreetView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      imageDate: ""
    };
  },

  /**
   * Triggered when component updates.
   * @instance
   */
  componentDidUpdate: function() {},

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function() {
    $(".ol-viewport").css("cursor", "crosshair");
    this.props.model.activate();
    this.props.model.on("change:imageDate", () => {
      this.setState({
        imageDate: this.props.model.get("imageDate")
      });
    });
    this.props.model.on("change:location", () => {
      this.props.navigationPanel.maximize();
    });
  },

  componentWillUnmount: function() {
    $(".ol-viewport").css("cursor", "default");
    this.props.model.deactivate();
    this.props.model.off("change:imageDate");
  },

  renderInfoText: function() {
    if (!this.props.model.get("location")) {
      return (
        <div>
          Klicka i kartan för att aktivera street view. <br />
          Förstora fönstret genom att trycka på symbolen i övre högra hörnet.{" "}
          <br />
        </div>
      );
    }
  },

  /**
   * Render the view
   * @instance
   * @return {external:ReactElement}
   */
  render: function() {
    return (
      <Panel
        title="Street View"
        onCloseClicked={this.props.onCloseClicked}
        onUnmountClicked={this.props.onUnmountClicked}
        instruction={atob(this.props.model.get("instruction"))}
      >
        <div className="panel-content">
          <h3>Street view</h3>
          {this.renderInfoText()}
          <div id="street-view-window" />
          <div id="image-date">
            {this.state.imageDate ? this.state.imageDate : ""}
          </div>
        </div>
      </Panel>
    );
  }
};

/**
 * StreetViewPanelView module.<br>
 * Use <code>require('views/streetviewpanel')</code> for instantiation.
 * @module StreetViewPanel-module
 * @returns {StreetViewPanel}
 */
module.exports = React.createClass(StreetView);
