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

var Panel = require('views/panel');

/**
 * @class
 */
var RoutingPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {};
  },

  /**
   * Triggered when component updates.
   * @instance
   */
  componentDidUpdate: function () {
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
  },

  /**
   * Generete anchor text.
   * @instance
   */
  generate: function () {

  },

  /**
   * Render the view
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    console.log('Start of render');
    this.props.model.initStartPoint();
    console.log('After init');
    return(
      <Panel title="Navigation" onUnmountClicked={this.props.onUnmountClicked} onCloseClicked={this.props.onCloseClicked}>
        <div className="panel-content">
          <div className="panel panel-default">
              <div className="panel-heading"> ①. Choose a start point </div>
                <div className="panel-body">
                  <button onClick={() => this.props.model.turnOnGPSClicked()} className="btn btn-default" id="naviGPS">Use current position</button>
                  <button onClick={() => this.props.model.startPointSelection()} className="btn btn-default" id="startBtn">Choose Position on the map</button>
                </div>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> ②. Choose an end point </div>
               <div className="panel-body">
                 <button onClick={() => this.props.model.endPointSelection()} className="btn btn-default" id="startBtn">Choose Position on the map</button>
             </div>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> ③. Choose a travel mode </div>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> Result </div>
          </div>
        </div>
      </Panel>
    );
    /*
    return (
      <Panel title="Navigation" onUnmountClicked={this.props.onUnmountClicked} onCloseClicked={this.props.onCloseClicked}>
        <div className="panel-content">
          <p>
            Testar navigation
          </p>
        </div>
      </Panel>
    );
     */
  }
};

/**
 * RoutingPanelView module.<br>
 * Use <code>require('views/routingpanel')</code> for instantiation.
 * @module RoutingPanel-module
 * @returns {RoutingPanelView}
 */
module.exports = React.createClass(RoutingPanelView);
