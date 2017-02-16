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

const googleMapsLoader = require('google-maps');
const ToolModel = require('tools/tool');
var streetViewService;
var panorama;

/**
 * @typedef {Object} StreetViewModel~StreetViewModelProperties
 * @property {string} type -Default: streetview
 * @property {string} panel -Default: ''
 * @property {string} toolbar -Default: bottom
 * @property {string} icon -Default: fa fa-street-view icon
 * @property {string} title -Default: Google Street View
 * @property {boolean} visible - Default: false
 * @property {ShellModel} shell
 */
var StreetViewModelProperties = {
  type: 'streetview',
  panel: 'streetviewpanel',
  toolbar: 'bottom',
  icon: 'fa fa-street-view icon',
  title: 'Google Street View',
  visible: false,
  shell: undefined,
  google: undefined,
  apiKey: ''
}

/**
 * @description
 *
 *  Prototype for creating an streetview model.
 *
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {StreetViewModel~StreetViewModellProperties} options - Default options
 */
var StreetViewModel = {
  /**
   * @instance
   * @property {StreetViewModel~StreetViewModelProperties} defaults - Default settings
   */
  defaults: StreetViewModelProperties,

  /**
   * Create and add marker interaction to map.
   * @instance
   */
  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },

  /**
   * Set properties of panorama object witch controlls the street view window.
   * @instance
   * @param {object} data
   * @param {google.maps.StreetViewStatus} status
   */
  displayPanorama: function (data, status) {
    if (status === google.maps.StreetViewStatus.OK) {
      panorama.setPano(data.location.pano);
      panorama.setPov({ heading: 270, pitch: 0 });
      panorama.setVisible(true);
    }
  },

  /**
   * Create a street view window and show given location.
   * If the window in not yet initialized the bearing will be 0.
   * @instance
   * @param {array} coordinate
   */
  showLocation: function (e) {
        
    var coord  = ol.proj.transform(
      e.coordinate,
			this.get('olMap').getView().getProjection(),
			"EPSG:4326"
		)
	  ,	location = new google.maps.LatLng(coord[1], coord[0]);

    this.addMarker(e.coordinate, (panorama && panorama.getPov().heading) || 0);
    streetViewService = new google.maps.StreetViewService();
 		panorama = new google.maps.StreetViewPanorama(document.getElementById('street-view-window'));
    streetViewService.getPanoramaByLocation(location, 50, this.displayPanorama);

	  google.maps.event.addListener(panorama, 'position_changed', () => { this.onPositionChanged() });
	  google.maps.event.addListener(panorama, 'pov_changed', () => { this.onPositionChanged() });
  },

  /**
   * Create icon style based on rotation.
   * @instance
   */
  getIconStyle: function(rotation) {
    //
    // Find location in sprite of given rotation.
    //
    function position(r) {
      const w = 49;
      var i = 1;
      var n = 1;
      for (;i <= 16; i++) {
        let min = 22.5 * (i - 1);
        let max = 22.5 * i;
        if (r >= min && r <= max) {
          n = i;
        }
      }
      return (n * w) - w;
    }

    const p = position(rotation);
    const w = 48;
    const h = 55;

    return new ol.style.Style({
      image: new ol.style.Icon({
        offset: [p, 0],
        anchor: [(w / 2), (h / 2)],
        size: [w, h],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        opacity: 1,
        src: 'assets/icons/google_man.png'
      })
    });
  },

  /**
   * Create and add marker interaction to map.
   * @instance
   */
  addMarker: function (coordinate, rotation) {
    var feature = new ol.Feature({
      geometry: new ol.geom.Point(coordinate)
    });
    feature.setStyle(this.getIconStyle(rotation));
    this.set('marker', feature);
    this.get('streetViewMarkerLayer').getSource().clear();
    this.get('streetViewMarkerLayer').getSource().addFeature(this.get('marker'));
  },

  /**
   * Moves the marker in the map based on the state of the panorama object.
   * @instance
   */
  onPositionChanged: function () {

    if (!panorama.getPosition())
      return;

    var x = panorama.getPosition().lng()
    ,	  y = panorama.getPosition().lat()
    ,	  b = panorama.getPov().heading
    ,	  l = [x, y]
    ,   p = this.get('olMap').getView().getProjection()
    ,   c = ol.proj.transform(l, "EPSG:4326", p);

    this.addMarker(c, b);
  },

  /**
   * Initialize the model.
   * @instance
   */
  configure: function (shell) {

    this.set('map', shell.getMap());
    this.set('olMap', shell.getMap().getMap());

    googleMapsLoader.KEY = this.get('apiKey');
    googleMapsLoader.load(google => {
      this.set('google', google);
    });
    this.set('streetViewMarkerLayer', new ol.layer.Vector({
      source: new ol.source.Vector({}),
      name: 'streetViewMarkerLayer'
    }));
    this.get('olMap').addLayer(this.get('streetViewMarkerLayer'));
  },

  activate: function () {
    this.get('olMap').set('clickLock', true);
    this.eventKey = this.get('olMap').on('click', this.showLocation.bind(this));
  },

  deactivate: function () {
    this.get('olMap').set('clickLock', false);
    this.get('olMap').unByKey(this.eventKey);
    this.get('streetViewMarkerLayer').getSource().clear();
  },

  /**
   * @description
   *
   *   Handle click event on toolbar button.
   *   This handler sets the property visible,
   *   wich in turn will trigger the change event of navigation model.
   *   In pracice this will activate corresponding panel as
   *   "active panel" in the navigation panel.
   *
   * @instance
   */
  clicked: function () {
    this.set('visible', !this.get('visible'));
  }
};

/**
 * Street View model module.<br>
 * Use <code>require('models/streetview')</code> for instantiation.
 * @module StreetViewModel-module
 * @returns {StreetViewModel}
 */
module.exports = ToolModel.extend(StreetViewModel);
