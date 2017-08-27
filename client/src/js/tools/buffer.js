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

const ToolModel = require('tools/tool');
const SelectionModel = require('models/selection');

/**
 * @typedef {Object} BufferModel~BufferModelProperties
 * @property {string} type -Default: Buffer
 * @property {string} panel -Default: Bufferpanel
 * @property {string} toolbar -Default: bottom
 * @property {string} icon -Default: fa fa-link icon fa-flip-horizontal
 * @property {string} title -Default: Länk
 * @property {boolean} visible - Default: false
 * @property {ShellModel} shell
 */
var BufferModelProperties = {
  type: 'buffer',
  panel: 'bufferpanel',
  toolbar: 'bottom',
  icon: 'fa fa-bullseye icon',
  title: 'Skapa buffertzon',
  visible: false,
  shell: undefined,
  bufferDist: 1000,
  marker: undefined,
  markerPos: undefined,
}

/**
 * @description
 *
 *  Prototype for creating an Buffer model.
 *
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {BufferModel~BufferModelProperties} options - Default options
 */
var BufferModel = {
  /**
   * @instance
   * @property {BufferModel~BufferModelProperties} defaults - Default settings
   */
  defaults: BufferModelProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);


  },

  getDefaultStyle: function () {
    const color = 'rgba(255, 255, 0, 0.6)';
    const fill = 'rgba(255, 255, 255, 0.5)';
    return [
      new ol.style.Style({
        fill: new ol.style.Fill({
          color: fill
        }),
        stroke: new ol.style.Stroke({
          color: color,
          width: 4
        }),
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: fill
          }),
          stroke: new ol.style.Stroke({
            color: color,
            width: 2
          })
        })
      })
    ];
  },

  configure: function (shell) {

    this.set('map', shell.getMap());
    this.set('olMap', shell.getMap().getMap());
    this.set('layers', shell.getLayerCollection());

    this.set('bufferLayer', new ol.layer.Vector({
      source: new ol.source.Vector(),
      name: 'buffer-layer',
      queryable: false,
      style: this.getDefaultStyle()
    }));

    var style_marker = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        opacity: .8,
        src: 'assets/icons/routeguide_highlight.png',
        scale: (2)
      })
    });

    this.set('markerlayer', new ol.layer.Vector({
      source: new ol.source.Vector(),
      name: 'bufferMarkerLayer',
      queryable: false,
      style: style_marker
    }));

    this.get('olMap').addLayer(this.get('bufferLayer'));
    this.get('olMap').addLayer(this.get('markerlayer'));

    this.set('selectionModel', new SelectionModel({
      map: this.get('olMap'),
      layerCollection: shell.getLayerCollection()
    }));

    // Move to onclick on the + button should be in .jsx
    console.log('adding on klick');
    this.set('bufferMarkKey', this.get('olMap').on('singleclick', this.placeMarker.bind(this)));
    console.log('onclick added');
  },
  /**
   * @instance
   */
  getActiveTool: function () {
    return this.get('selectionModel').get('activeTool');
  },
  /**
   * @instance
   * @property {string} name
   */
  setActiveTool: function (name) {
    if (this.get('selectionModel').get('activeTool') === name) {
      this.get('selectionModel').setActiveTool(undefined);
    } else {
      this.get('selectionModel').setActiveTool(name);
    }
  },

  placeMarker: function(event){

    console.log('Running placeMarker');

    if (this.get('marker') === undefined){
      this.set('marker', new ol.Feature());
      this.get('markerlayer').getSource().addFeature(this.get('marker'));
    }

    this.get('marker').setGeometry(new ol.geom.Point(event.coordinate));


    //var test = ol.proj.transform(startPoint.getGeometry().getCoordinates(), 'EPSG:3007', 'EPSG:4326');
    //console.log(test);
    //var lonlat = startPoint.getGeometry().getCoordinates();
    console.log('correct pos?');
    console.log(this.get('marker').getGeometry().getCoordinates());
    var lonlat = ol.proj.transform(this.get('marker').getGeometry().getCoordinates(), 'EPSG:3007', 'EPSG:4326');
  },

  isNumber: function (obj) {

    if (typeof obj === "number") {
      return true;
    }

    if (typeof obj !== "string") {
      return false;
    }

    if (obj.trim() === "") {
      return false;
    }

    if (!isNaN(Number(obj))) {
      return true;
    }

    return false;
  },

  /**
   * @instance
   */
  buffer: function() {

    console.log('buffering');
    if (this.get('marker') === undefined){
      return false;
    }

    console.log('buffering2');
    var lonlat = ol.proj.transform(this.get('marker').getGeometry().getCoordinates(), 'EPSG:3007', 'EPSG:4326');
    console.log(lonlat);
    var lon = lonlat[0];
    var lat = lonlat[1];

    console.log(this.get('bufferDist'));
    var circle = new ol.geom.Circle(this.get('marker').getGeometry().getCoordinates(), Number(this.get('bufferDist')));

    console.log('buffering3');
    var circleFeature = new ol.Feature(circle);

    console.log('buffering4');
    this.get('bufferLayer').getSource().clear();
    console.log('buffering5');
    this.get('bufferLayer').getSource().addFeature(circleFeature);


    console.log('buffering6');
    return true;
    /*
    const parser = new jsts.io.OL3Parser();
    const features = this.get('selectionModel').features
    const dist = this.get('bufferDist');

    if (!this.isNumber(dist)) {
      return false;
    }

    // map.getLayersByClass("OpenLayers.Layer.Vector")
    // get all features
    // for loop, find features within distance
    // http://openlayers.org/en/master/examples/measure.html

    var buffered = Object.keys(features).map(key => {

        var feature = features[key]
        ,   olf = new ol.Feature()
        ,   olGeom = feature.getGeometry()
        ,   jstsGeom
        ,   buff
    ;

    if (olGeom instanceof ol.geom.Circle) {
      olGeom = ol.geom.Polygon.fromCircle(olGeom, 0b10000000);
    }

    jstsGeom = parser.read(olGeom);
    buff = jstsGeom.buffer(dist);
    olf.setGeometry(parser.write(buff));
    olf.setStyle(this.getDefaultStyle());
    olf.setId(Math.random() * 1E20);

    return olf;
  });

    olGeom = ol.geom.Polygon.fromCircle(olGeom, 0b10000000);

    if (buffered) {
      this.get('bufferLayer').getSource().addFeatures(buffered);

      return true;
    } else {
      return false;
    }
    */
  },

  createWFSQuery: function(typeName, radius, coordStr){
    var query = '<wfs:Query typeName=\'feature:' + typeName + '\' srsName=\'EPSG:3007\'>\n' +
      '          <ogc:Filter>\n' +
      '        \n' +
      '        \n' +
      '\t<ogc:DWithin>\n' +
      '                <ogc:PropertyName>geom</ogc:PropertyName>\n' +
      '                <gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#3007"\n' +
      '                    xmlns:gml="http://www.opengis.net/gml">\n' +
      '                            <gml:coordinates decimal="." cs="," ts=" "> ' + coordStr + '</gml:coordinates>\n' +
      '                </gml:Point>\n' +
      '                <ogc:Distance units="meter">' + radius + '</ogc:Distance>\n' +
      '            </ogc:DWithin>\n' +
      '\n' +
      '      \n' +
      '          </ogc:Filter>\n' +
      '         </wfs:Query>';
    console.log(query);
    return query;
  },

  getFeaturesWithinRadius: function(layers){

    var requestPrefix = '<wfs:GetFeature\n' +
    '         service = \'WFS\'\n' +
    '         version = \'1.1.0\'\n' +
    '         xmlns:wfs = \'http://www.opengis.net/wfs\'\n' +
    '         xmlns:ogc = \'http://www.opengis.net/ogc\'\n' +
    '         xmlns:gml = \'http://www.opengis.net/gml\'\n' +
    '         xmlns:esri = \'http://www.esri.com\'\n' +
    '         xmlns:xsi = \'http://www.w3.org/2001/XMLSchema-instance\'\n' +
    '         xsi:schemaLocation=\'http://www.opengis.net/wfs ../wfs/1.1.0/WFS.xsd\'\n' +
    '         outputFormat="GML2"\n' +
    '         maxFeatures="1000">\n';


    var requestSuffix = '\n      </wfs:GetFeature>'

    var queries = '';

    for (var i = 0; i < layers.length; i++){
      queries += this.createWFSQuery(layers[i], this.get('bufferDist'), coords);
    }

    var wfsRequset = requestPrefix + queries + requestSuffix;


    // Do Ajax call
  },

  clearSelection: function() {
    this.get('selectionModel').clearSelection();
  },

  clearBuffer: function() {
    this.get('bufferLayer').getSource().clear();
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
  }
};

/**
 * Buffer model module.<br>
 * Use <code>require('models/Buffer')</code> for instantiation.
 * @module BufferModel-module
 * @returns {BufferModel}
 */
module.exports = ToolModel.extend(BufferModel);
