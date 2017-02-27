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

var ToolModel = require('tools/tool');

/**
 * @typedef {Object} LocationModel~LocationModelProperties
 * @property {string} type - Default: search
 * @property {string} panel - Default: searchpanel
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-search icon
 * @property {string} title - Default: Sök i kartan
 * @property {string} visible - Default: false
 */
var LocationModelProperties = {
  type: 'location',
  panel: '',
  toolbar: 'top-right',
  icon: 'fa fa-location-arrow icon',
  title: 'Visa min position',
  active: false,
  visible: false,
  location: {
    lat: undefined,
    lng: undefined
  }
};

/**
 * Prototype for creating a search model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {LocationModel~LocationModelProperties} options - Default options
 */
var LocationModel = {
  /**
   * @instance
   * @property {LocationModel~LocationModelProperties} defaults - Default settings
   */
  defaults: LocationModelProperties,

  watchId: undefined,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);

    var style = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 32],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        opacity: .8,
        src: 'assets/icons/gps.png',
        scale: (1/2)
      })
    });

    var source = new ol.source.Vector({});

    this.set("layer", new ol.layer.Vector({
      source: source,
      name: "location",
      style: style
    }));
  },

  getOptions: function () {
    return {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };
  },

  configure: function (shell) {

    this.set('olMap', shell.getMap().getMap());
    this.get('olMap').addLayer(this.get('layer'));

    this.on('change:active', (e) => {
      if (!this.get('active') && this.watchId) {
        window.navigator.geolocation.clearWatch(this.watchId);
        this.reset();
      } else {
        this.watchId = window.navigator.geolocation.watchPosition(
          (e) => { this.onLocationSucess(e) },
          (e) => { this.onLocationError(e) },
          this.getOptions()
        );
      }
    });

    this.on('change:location', () => { this.setLocation() });

  },

  setLocation: function (coord) {
    this.get('layer').getSource().clear();
    if (this.get('location').lng && this.get('location').lat) {
      let point = new ol.geom.Point([
        this.get('location').lng,
        this.get('location').lat
      ]);
      let transformed = ol.proj.transform(point.getCoordinates(), "EPSG:4326", this.get('olMap').getView().getProjection());
      point.setCoordinates(transformed);
      this.get('layer').getSource().addFeature(
        new ol.Feature({
          geometry: point
        })
      );
      this.get('olMap').getView().setCenter(point.getCoordinates());
    }
  },

  reset: function() {
    this.set({
      location: {
        lat: undefined,
        lng: undefined
      }
    });
  },

  onLocationSucess: function(e) {
    this.set({
      location: {
        lat: e.coords.latitude,
        lng: e.coords.longitude
      }
    });
  },

  onLocationError: function(e) {
    alert("Din position kan inte fastställas.");
    this.reset();
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
    this.set({
      'visible': !this.get('visible'),
      'active': !this.get('active')
    });
  }
};

/**
 * Location model module.<br>
 * Use <code>require('models/information')</code> for instantiation.
 * @module LocationModel-module
 * @returns {LocationModel}
 */
module.exports = ToolModel.extend(LocationModel);
