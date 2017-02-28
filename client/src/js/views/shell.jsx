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
// https://github.com/Johkar/Hajk2

var MapView = require('views/map');
var MapModel = require('models/map');
var Toolbar = require('views/toolbar');
var LayerCollection = require('collections/layers');
var Toolcollection = require('collections/tools');
var NavigationPanel = require('views/navigationpanel');
var NavigationPanelModel = require("models/navigation");
var SearchBar = require("components/searchbar");

/**
 * @class
 */
var ShellView = {
  /**
   * Get default properties.
   * @instance
   * @return {object}
   */
  getDefaultProps : function () {
    return {
      config: {
        layers: [],
        tools: [],
        map: {}
      }
    };
  },

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function () {
    return {
      mapModel: undefined,
      toolsCollection: undefined,
      navigationModel: undefined,
      scale: 1
    };
  },

  shouldComponentUpdate: function () {
    return true;
  },

  /**
   * Triggered before the component mounts.
   * @instance
   */
  componentWillMount: function () {
    this.model = this.props.model;
    this.setState({
      views: [
        <MapView key={this.model.cid} id={this.model.cid} />
      ]
    });
  },

  /**
   * Format scale
   * @instance
   * @param {number} scale
   * @return {string} formatted
   */
  formatScale: function(scale) {
    return Math.round(scale).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  },

  configure: function() {
    this.model.configure.call(this.model);
    this.setState({
      views: [
        <MapView key={this.model.cid} id={this.model.cid} />,
        <Toolbar key="toolbar" model={this.model.get('toolCollection')} navigationModel={this.model.get('navigation')} />,
        <NavigationPanel key="navigation" model={this.model.get('navigation')} />
      ],
      scale: this.formatScale(this.model.getMap().getScale())
    });

    var bindViewScaleEvents = () => {
      var view = this.model.getMap().getMap().getView();
      view.on('change:resolution', () => {
        this.setState({
          scale: this.formatScale(this.model.getMap().getScale())
        });
      });
    };

    bindViewScaleEvents();
    this.model.getMap().getMap().on('change:view', bindViewScaleEvents);
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.configure();

    this.model.on('change:configUpdated', () => {
      var config = this.model.getConfig();
      this.model.get('map').update(config.map);
      //
      // TODO:
      // Implementera inläsning av configobjekt för lager.
      // this.model.get('layerCollection').update(config.layers);
      //
      // Implementera inläsning av configobjekt för verktyg.
      // this.model.get('toolCollection').update(config.toolCollection);
    });

  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var views = this.state.views
    ,   scale
    ,   popup
    ,   searchbar
    ,   logo;

    if (views.length === 3) {
      if (this.model.get('map').get('logo')) {
        logo = (
          <div className="map-logo">
            <img src={this.model.get('map').get('logo')}></img>
          </div>
        );
      }

      scale = (
        <div id="map-scale" className="map-scale">
          <div id="map-scale-bar"></div>
          <div className="map-scale-text">1:{this.state.scale}</div>
        </div>
      )

      popup = (
        <div id="popup" className="ol-popup">
          <a href="#" id="popup-closer" className="ol-popup-closer"></a>
          <div id="popup-content"></div>
        </div>
      )

      var searchTool = this.model.get('toolCollection').find(tool => tool.get('type') === 'search');
      if (searchTool && searchTool.get('onMap')) {
        searchbar = (
          <div className="search-bar-holder">
            <SearchBar model={this.model.get('toolCollection').find(tool => tool.get('type') === 'search')}></SearchBar>
          </div>
        )
      }
    }

    return (
      <div className="shell">
        {logo}
        {scale}
        {popup}
        {searchbar}
        {views}
      </div>
    );
  }
};

/**
 * ShellView module.<br>
 * Use <code>require('views/shell')</code> for instantiation.
 * @module ShellView-module
 * @returns {ShellView}
 */
module.exports = React.createClass(ShellView);
