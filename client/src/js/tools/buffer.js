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
    const color = 'rgba(90, 100, 115, 1.5)';
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
    this.set('layersWithNames', shell.attributes.layers);
    this.set('layersCollection', shell.getLayerCollection());
    console.log('#################################### shell');
    console.log(shell);

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
        src: 'assets/icons/dot_marker_blue.png',
        scale: (0.5)
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
    //this.set('bufferMarkKey', this.get('olMap').on('singleclick', this.placeMarker.bind(this)));
    console.log('onclick added');
  },

  activateBufferMarker: function(){
    if (this.get('bufferMarkKey') == undefined) {
      console.log('activating');
      this.set('bufferMarkKey', this.get('olMap').on('singleclick', this.placeMarker.bind(this)));
    }
  },

  deActivateBufferMarker: function(){
    console.log('trying to deactivagte');
    if(this.get('bufferMarkKey') !== undefined) {
      console.log('deactivating');
      ol.Observable.unByKey(this.get('bufferMarkKey'));
      this.set('bufferMarkKey', undefined);
    }
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

    this.deActivateBufferMarker();

    var notFeatureLayers = ['150', '160', '170', '410', '420', '430', '440', '260', '310', '350', '360', '250', '230', '340', '330', '270', '280', '320', '325', '140', '220', '210'];
    var activeLayers = [];
    console.log(this.get('layersCollection'));
    console.log(this.get('layersCollection').length);
    for(var i = 0; i < this.get('layersCollection').length; i++){
      /*console.log('start of loop');
      console.log(this.get('layersCollection'));
      console.log(this.get('layersCollection').models[i]);
      console.log(this.get('layersCollection').models[i].getVisible());
      console.log('id');
      console.log(this.get('layersCollection').models[i].id);
      console.log(notFeatureLayers.indexOf(this.get('layersCollection').models[i].id)); */
      if(this.get('layersCollection').models[i].getVisible() && notFeatureLayers.indexOf(this.get('layersCollection').models[i].id) != -1){
        console.log('visible, real layer');
        activeLayers.push(this.get('layersCollection').models[i]);
      }
    }

    var activeNames = [];
    for(var i = 0; i < activeLayers.length; i++){
      for(var j = 0; j < this.get('layersWithNames').length; j++){
        if(activeLayers[i].id == this.get('layersWithNames')[j].id){
          activeNames.push(this.get('layersWithNames')[j].layers[0]);
        }
      }
    }

    console.log('activeNames');
    console.log(activeNames);

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

    document.getElementById('visibleLayerList').innerHTML = '';
    if(activeNames.length == 0){
      return true;
    }


    this.getFeaturesWithinRadius(activeNames);

    return true;
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

    // One query per layer
    for (var i = 0; i < layers.length; i++){
      queries += this.createWFSQuery(layers[i], this.get('bufferDist'), this.get('marker').getGeometry().getCoordinates());
    }

    var wfsRequset = requestPrefix + queries + requestSuffix;
    //console.log(wfsRequset);

    // Do Ajax call
    $.ajax({
      url: '/geoserver/varberg/wms',
      contentType: 'text/xml',
      crossDomain: true,
      type: 'post',
      data: wfsRequset,
      success: result => {
      this.putFeaturesInResult(result);
      },
      error: result => {
        alert('Något gick fel');
    }
  });
  },

  putFeaturesInResult: function(res){
    console.log('Inside putFeatuers');
    console.log(res);

    var featureMembers = res.getElementsByTagName('gml:featureMember');
    console.log(featureMembers);

    var foundFeatures = {};
    var str = '';
    console.log('tags');
    for(var i = 0; i < featureMembers.length; i++){
      var nameTag = featureMembers[i].getElementsByTagName('varberg:namn')[0];
      console.log(nameTag);
      var name = nameTag.innerHTML;
      console.log('1');
      var categoryName = nameTag.parentElement.localName;

      console.log('2');
      var coordinate = featureMembers[i].getElementsByTagName('gml:coordinates')[0].innerHTML;
      if (!(categoryName in foundFeatures)){
        foundFeatures[categoryName] = [];
      }
      foundFeatures[categoryName].push([name, coordinate]);
    }
    console.log('3');
    var categories = Object.keys(foundFeatures);
    categories.sort();

    console.log('4');
    var categoryPrefix = '<div class="panel panel-default layer-item"><div class="panel-heading unselectable"><label class="layer-item-header-text">';
    var endCategoryToStartLayers = '</label></div><div class="panel-body"><div class="legend"><div>';
    var categorySuffix = '</div></div></div></div>';

    var geoserverNameToCategoryName = {
      'forskolor': 'Förskola',
      'grundskolor': 'Grundskola',
    };

    for(var i = 0; i < categories.length; i++){
      str += categoryPrefix;
      str += categories[i];
      str += endCategoryToStartLayers;
      var features = foundFeatures[categories[i]];
      console.log('5');
      features.sort();
      for(var j=0; j < features.length; j++){
console.log('6');
        str += features[j][0] + '<br>';
      }
      str += categorySuffix;
    }

    console.log('7');
    document.getElementById('visibleLayerList').innerHTML = str;
    this.set('foundFeatures', foundFeatures);
  },

  clearBuffer: function() {
    this.deActivateBufferMarker();
    this.get('bufferLayer').getSource().clear();
    this.get('markerlayer').getSource().clear();
    this.set('marker', undefined);
    document.getElementById('visibleLayerList').innerHTML = '';
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
