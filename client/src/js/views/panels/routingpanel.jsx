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
    return {
      selectTravelMode: "walk"
    };
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

  getTravelMode: function () {
    return this.state.selectTravelMode;
  },

  setTravelMode: function(e) {
    this.setState({
      selectTravelMode: e.target.value
    });
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
      <Panel title="Navigation"  onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized}>
        <div className="panel-content">
          <div className="panel panel-default">
              <div className="panel-heading"> ①. Choose a start point </div>
                <div className="panel-body">
                  <button onClick={() => this.props.model.turnOnGPSClicked()} className="btn btn-default" id="naviGPS">Use current position</button>
                  <button onClick={() => this.props.model.activateStartMode()} className="btn btn-default" id="startBtn">Choose Position on the map</button>
                </div>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> ②. Choose an end point </div>
               <div className="panel-body">
                 <button onClick={() => this.props.model.activateEndMode()} className="btn btn-default" id="startBtn">Choose Position on the map</button>
             </div>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> ③. Choose a travel mode </div>
             <div className="panel-body">
               <select id="travel_mode_id" onChange={this.setTravelMode} defaultValue={this.state.selectTravelMode}>
                 <option value="walking">Gå</option>
                 <option value="cycling">Cykla</option>
                 <option value="driving">Bil</option>
                 <option value="transit">Kollektivtrafik</option>
               </select>
             </div>
          </div>
          <div className="panel panel-default-transparent">
             <button onClick={() => this.props.model.activateRoutingMode()} className="btn btn-default" id="startBtn">Sök resa</button>
             <button onClick={() => this.props.model.deleteLayers()} className="btn btn-default" id="startBtn">Rensa</button>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> Result </div>
                 <div className="panel-body">
                 </div>
          </div>
        </div>
      </Panel>
    );
  }
};

/**
 * RoutingPanelView module.<br>
 * Use <code>require('views/routingpanel')</code> for instantiation.
 * @module RoutingPanel-module
 * @returns {RoutingPanelView}
 */
module.exports = React.createClass(RoutingPanelView);
