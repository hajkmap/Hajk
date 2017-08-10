/**
 * Created by hiwe001 on 2017-07-04.
 */
/**
 * Created by hiwe001 on 2017-05-24.
 */
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
var RoutingModelProperties = {
  type: 'routing',
  panel: 'routingpanel',
  toolbar: 'bottom',
  icon: 'fa fa-level-up icon',
  title: 'Navigation',
  visible: false,
  Id: 'LocationB',
  state: 'choose_start', // will change to choose_end and choose_mode
  position: {
    latitude: undefined,
    longitude: undefined,
    latitudeEnd: undefined,
    longitudeEnd: undefined
  }
};

/**
 * Prototype for creating a search model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {LocationModel~LocationModelProperties} options - Default options
 */
startPoint = undefined;

var RoutingModel = {

  defaults: RoutingModelProperties,
  /**
   * @instance
   * @property {RoutingModel~RoutingModelProperties} defaults - Default settings
   */


  /* Starting Point */
  /* Get a current position from GPS(button right top)*/
  turnOnGPSClicked: function() {


    if (positioning == undefined || !positioning) {
      this.getLocation();
    } else{
      this.set({
        position:{
          latitude: latitude,
          longitude: longitude
        }
      });
      this.setPosition();
    }

  },

  getLocation: function(){
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(this.setPositionEvent.bind(this));
      positioning = true;
    }else{
      alert("kan inte få position. Skriv startposition i rutan eller tryck position på kartan.");
      positioning = false;
    }

  },


  positionError: function(error){
    /* reset this location setting */
    this.set({
      position: {
        latitude: undefined,
        longitude: undefined
      }
    });
    positioning = undefined;
  },

  /* Choose a starting location on the map manually. and drop a pin */
  startPointSelection: function(event){

    // Only update position if state is choose_start, otherwise nothing
    // if (this.get('state') == 'choose_start')....
    console.log('running startPointSelection');
    console.log(event.coordinate);
    var startPoint = new ol.Feature(); /* startPoint and point(below) must be the same l.134*/
    startPoint.setGeometry(new ol.geom.Point(event.coordinate));
  /* Convert Geometry to Coordinate */

  /* this is not the same this as in initStartPoint. Probably since it is an event handler. How to get the layer, make global variable*/
    console.log('Clearing the source');
    this.get('layer').getSource().clear();
    console.log('Source should be cleared');
    this.get('layer').getSource().addFeature(startPoint);
   },


  endPointSelection: function(event){
    var endPoint = new ol.Feature();
    endPoint.setGeometry(new ol.geom.Point(event.coordinate));

    this.get('layer').getSource().clear();
    this.get('layer').getSource().addFeature(endPoint);

  },


  activateStartMode: function(){
    this.set('state', 'choose_start');

  },

  activateEndMode: function(){
    this.set('state', 'choose_end');
  },

  activateTravelMode: function(){
    this.set('state', 'choose_mode');
  },

  initStartPoint: function() {
    console.log('Inside initStartPoint');
    console.log(this.get('map'));
    if(this.get('state') == 'choose_start'){
      this.get('map').on('singleclick', this.startPointSelection.bind(this));
    }else{
      this.get('map').on('singleclick', this.endPointSelection.bind(this));
    }


    var style = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        opacity: .8,
        src: 'assets/icons/flagpin_start.png',
        scale: (1)
      })
    });

    var style_end = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        opacity: .8,
        src: 'assets/icons/flagpin_end.png',
        scale: (1)
      })
    });

    // this.set('accuracyFeature', new ol.Feature());
    var source = new ol.source.Vector({});
    // source.addFeature(this.get('accuracyFeature'));

    if(this.get('state') == 'choose_start'){
      this.set("layer", new ol.layer.Vector({
        source: source,
        name: "routing",
        style: style
      }))
    }else{
      this.set("layer", new ol.layer.Vector({
        source: source,
        name: "routing",
        style: style_end
      }))
    }

    this.get('map').addLayer(this.get('layer'));
  },

  setPositionEvent: function(event){
    this.set("position", event.coords);
    this.setPosition();
  },

  setPosition: function(){

    console.log('Clearing the source');

    this.get('layer').getSource().clear();
    console.log('Source should be cleared');
    if (this.get('position').longitude && this.get('position').latitude) {
      var point = new ol.geom.Point([
        this.get('position').longitude,
        this.get('position').latitude
      ]);
      var transformed = ol.proj.transform(point.getCoordinates(), "EPSG:4326", this.get('map').getView().getProjection());
      point.setCoordinates(transformed);
      this.get('layer').getSource().addFeature(
        new ol.Feature({
          geometry: point
        })
      );
      this.get('map').getView().setCenter(point.getCoordinates());
    }
  },

  configure: function (shell) {
    console.log('Running configure for routing');
    this.set('map', shell.getMap().getMap());
  },


  getOptions: function () {
  },

  reset: function() {

  },

  removeLayer: function () {
    /*remove event listner from the map ne. the click event(map.un)*/


  },

  ConvertAddressToCoord: function(){
    /* need to create a box with suggestion */
    /* var searchStringStart = "<wfs:GetFeature\
     service = 'WFS'\
     version = '1.1.0'\
     xmlns:wfs = 'http://www.opengis.net/wfs'\
     xmlns:ogc = 'http://www.opengis.net/ogc'\
     xmlns:gml = 'http://www.opengis.net/gml'\
     xmlns:esri = 'http://www.esri.com'\
     xmlns:xsi = 'http://www.w3.org/2001/XMLSchema-instance'\
     xsi:schemaLocation='http://www.opengis.net/wfs ../wfs/1.1.0/WFS.xsd'\
     outputFormat="GML2"\
     maxFeatures="1000">\
     <wfs:Query typeName='feature:fastighetsytor' srsName='EPSG:3007'>\
     <ogc:Filter>\
     \
     <ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">\
     <ogc:PropertyName>text</ogc:PropertyName>\
     <ogc:Literal>";
     var searchStringEnd = "</ogc:Literal>\
     </ogc:PropertyIsLike>\
     </ogc:Filter>\
     </wfs:Query>\
     </wfs:GetFeature>";

     var value = ''; // TODO get value from box
     var forAjax = searchStringStart + value + '*' + searchStringEnd;
     */


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
    this.set('visible', true);
    this.set('toggled', !this.get('toggled'));
  },
};

/**
 * Location model module.<br>
 * Use <code>require('models/information')</code> for instantiation.
 * @module LocationModel-module
 * @returns {LocationModel}
 */
module.exports = ToolModel.extend(RoutingModel);
