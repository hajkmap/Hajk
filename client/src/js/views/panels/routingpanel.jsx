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

  showResult: function(routeResult) {
    console.log(this.props.model.plotRoute(res));
  },

  showImage: function(src, id) {
    var img = document.createElement("img");
    img.src = src;
    img.id = id;

    docunebt.body.appendChild(img);
  },
  /**
   * Render the view
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    this.props.model.initStartPoint();

    return(
      <Panel title="Navigation"  onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized}>
        <div className="panel-content">
          <div className="panel panel-default">
              <div className="panel-heading"> ①. Välj startpunkt </div>
                <div className="panel-body">
                  <button onClick={() => this.props.model.turnOnGPSClicked()} className="btn btn-default" id="naviGPS">Välj befintlig position</button>
                  <button onClick={() => this.props.model.activateStartMode()} className="btn btn-default" id="startBtn">Välj position på kartan</button>
                </div>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> ②. Välj destination </div>
               <div className="panel-body">
                 <button onClick={() => this.props.model.activateEndMode()} className="btn btn-default" id="startBtn">Välj position på kartan</button>
             </div>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> ③. Välj färdsätt </div>
             <div className="panel-body">
               <button className="btn btn-default" onClick={() => this.props.model.setTravelMode('walking')}><img src="/assets/icons/gaRouting.png"/></button>
               <button className="btn btn-default" onClick={() => this.props.model.setTravelMode('driving')}><img src="/assets/icons/koraRouting.png"/></button>
               <button className="btn btn-default" onClick={() => this.props.model.setTravelMode('bicycling')}><img src="/assets/icons/cyklaRouting.png"/></button>
               <button className="btn btn-default" onClick={() => this.props.model.setTravelMode('transit')}><img src="/assets/icons/kollektivRouting.png"/></button>
             </div>
          </div>
          <div className="panel panel-default-transparent">
             <button onClick={() => this.props.model.activateRoutingMode()} className="btn btn-default" id="startBtn">Sök resa</button>
             <button onClick={() => this.props.model.deleteLayers()} className="btn btn-default" id="startBtn">Rensa</button>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> Resultat </div>
                 <div className="panel-body">
                   <div id="resultList"></div>
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
