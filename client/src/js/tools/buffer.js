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
  popupHighlight: undefined,
  instruction: '',
  varbergVer: false
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

  initialize: function () {
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

    if(!this.get('varbergVer')){
      this.set('layers', shell.getLayerCollection());

      this.set('bufferLayer', new ol.layer.Vector({
        source: new ol.source.Vector(),
        name: 'buffer-layer',
        style: this.getDefaultStyle()
      }));

      this.get('olMap').addLayer(this.get('bufferLayer'));
    }else {
      this.set('layersWithNames', shell.attributes.layers);
      this.set('layersCollection', shell.getLayerCollection());

      this.set('bufferLayer', new ol.layer.Vector({
        source: new ol.source.Vector(),
        name: 'buffer-layer',
        queryable: false,
        style: this.getDefaultStyle()
      }));

      this.set('style_marker', new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 0.5],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          opacity: .8,
          src: 'assets/icons/dot_marker_blue.png',
          scale: (0.5)
        })
      }));

      this.set('markerlayer', new ol.layer.Vector({
        source: new ol.source.Vector(),
        name: 'bufferMarkerLayer',
        queryable: false,
        style: this.get('style_marker')
      }));

      // popupHighlight style
      this.set('style_popup', new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 0.5],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          opacity: 1.0,
          src: 'assets/icons/Ikon_på_buffert.png',
          scale: (1.5)
        })
      }));

      this.set("layer_popup", new ol.layer.Vector({
          source: new ol.source.Vector(),
          name: "popupHighlight",
          queryable: false,
          style: this.get('style_popup')
        })
      );

      this.get('olMap').addLayer(this.get('bufferLayer'));
      this.get('olMap').addLayer(this.get('markerlayer'));
      this.get('olMap').addLayer(this.get('layer_popup'));
    }

    this.set('selectionModel', new SelectionModel({
      map: this.get('olMap'),
      layerCollection: shell.getLayerCollection()
    }));
  },

  activateBufferMarker: function(){
    if (this.get('bufferMarkKey') == undefined) {
      this.set('bufferMarkKey', this.get('olMap').on('singleclick', this.placeMarker.bind(this)));
    }
  },

  deActivateBufferMarker: function(){
    if(this.get('bufferMarkKey') !== undefined) {
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

    if (this.get('marker') === undefined){
      var ft =  new ol.Feature();
      this.set('marker', ft);
      this.get('markerlayer').getSource().addFeature(this.get('marker'));
      ft.setStyle(this.get('style_marker'));
    }

    this.get('marker').setGeometry(new ol.geom.Point(event.coordinate));

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
    if (!this.get('varbergVer')) {
      console.log('buffering');
      const parser = new jsts.io.OL3Parser();
      const features = this.get('selectionModel').features
      const dist = this.get('bufferDist');

      if (!this.isNumber(dist)) {
        return false;
      }

      var buffered = Object.keys(features).map(key => {

        var feature = features[key]
        , olf = new ol.Feature()
        , olGeom = feature.getGeometry()
        , jstsGeom
        , buff
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
    })
      ;

      if (buffered) {
        this.get('bufferLayer').getSource().addFeatures(buffered);
        return true;
      } else {
        return false;
      }
    } else {
      if (this.get('marker') === undefined) {
        return false;
      }

      this.deActivateBufferMarker();
// JSON?
      var notFeatureLayers = ['150', '160', '170', '410', '420', '430', '440', '260', '310', '350', '360', '250', '230', '340', '330', '270', '280', '320', '325', '140', '220', '210'];
      var activeLayers = [];
      for (var i = 0; i < this.get('layersCollection').length; i++) {
        if (this.get('layersCollection').models[i].getVisible() && notFeatureLayers.indexOf(this.get('layersCollection').models[i].id) != -1) {
          activeLayers.push(this.get('layersCollection').models[i]);
        }
      }

      var activeNames = [];
      for (var i = 0; i < activeLayers.length; i++) {
        for (var j = 0; j < this.get('layersWithNames').length; j++) {
          if (activeLayers[i].id == this.get('layersWithNames')[j].id) {
            activeNames.push(this.get('layersWithNames')[j].layers[0]);
          }
        }
      }


      var lonlat = ol.proj.transform(this.get('marker').getGeometry().getCoordinates(), 'EPSG:3007', 'EPSG:4326');
      var lon = lonlat[0];
      var lat = lonlat[1];

      var circle = new ol.geom.Circle(this.get('marker').getGeometry().getCoordinates(), Number(this.get('bufferDist')));

      var circleFeature = new ol.Feature(circle);

      this.get('bufferLayer').getSource().clear();
      this.get('bufferLayer').getSource().addFeature(circleFeature);
      circleFeature.setStyle(this.getDefaultStyle());


      document.getElementById('visibleLayerList').innerHTML = '';
      if (activeNames.length == 0) {
        return true;
      }


      this.getFeaturesWithinRadius(activeNames);

      return true;
    }
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

    var featureMembers = res.getElementsByTagName('gml:featureMember');

    var foundFeatures = {};
    var str = '';
    for(var i = 0; i < featureMembers.length; i++){
      var nameTag = featureMembers[i].getElementsByTagName('varberg:namn')[0];
      var name = nameTag.innerHTML;
      var categoryName = nameTag.parentElement.localName;

      var coordinate = featureMembers[i].getElementsByTagName('gml:coordinates')[0].innerHTML;
      if (!(categoryName in foundFeatures)){
        foundFeatures[categoryName] = [];
      }
      foundFeatures[categoryName].push([name, coordinate]);
    }
    var categories = Object.keys(foundFeatures);
    categories.sort();

    var categoryPrefix = '<div class="panel panel-default layer-item"><div class="panel-heading unselectable"><label class="layer-item-header-text">';
    var endCategoryToStartLayers = '</label></div><div class="panel-body"><div class="legend"><div>';
    var categorySuffix = '</div></div></div></div>';

    var geoserverNameToCategoryName = {
      'forskolor': 'Förskola',
      'grundskolor': 'Grundskola',
      'gymnasieskolor': 'Gymnasieskolor',
      'vardcentral': 'Vårdcentral',
      'vardcentral_privat': 'Privat vårdcentral',
      'sjukhus': 'Sjukhus',
      'folktandvard': 'Folktandvård',
      'badplatser': 'Badplatser',
      'bibliotek': 'Bibliotek',
      'hallplatser_for_bokbussen': 'Hållplatser bokbussen',
      'kultur_utf_8': 'Kultur och teater',
      'lekplatser': 'Lekplatser',
      'offentliga_toaletter': 'Offentliga toaletter',
      'off_konst': 'Offentliga konstverk',
      'turistbyran': 'Turistbyrå',
      'atervinningsstationer': 'Återvinningsstationer',
      'atervinningscentraler': 'Återvinningscentraler',
      'detaljplaner': 'Detljplaner',
      'fornybar_energi': 'Förnybar energi',
      'cykelservicestallen': 'Cykelservice',
      'laddplatser': 'Laddplatser',
      'parkering_punkt': 'Parkeringsplatser',
      'polisstationer': 'Polisstation'
    };


    var div = document.createElement('div');

    for(var i = 0; i < categories.length; i++){
      var outerDiv = document.createElement('div');
      outerDiv.className = 'panel panel-default layer-item';
      var headingDiv = document.createElement('div');
      headingDiv.className = 'panel-heading unselectable';
      outerDiv.appendChild(headingDiv);
      var label = document.createElement('label');
      label.className = 'layer-item-header-text';
      headingDiv.appendChild(label);

      label.innerHTML = geoserverNameToCategoryName[categories[i]];

      var bodyDiv = document.createElement('div');
      bodyDiv.className = 'panel-body';
      var legendDiv = document.createElement('div');
      legendDiv.className = 'legend';
      var tomten = document.createElement('div');
      outerDiv.appendChild(bodyDiv);
      bodyDiv.appendChild(legendDiv);
      legendDiv.appendChild(tomten);

      var features = foundFeatures[categories[i]];
      features.sort();
      var layer = this.get('layer_popup');
      for(var j = 0; j < features.length; j++){
        var tag = document.createElement('p'); // remember to convert coordinate to list of float
        tag.setAttribute('coord', features[j][1]);
        tag.onclick = this.popupIcons.bind(this);
        tag.innerHTML = features[j][0];
        tomten.appendChild(tag);
      }

      div.appendChild(outerDiv);
    }

    document.getElementById('visibleLayerList').appendChild(div);
    this.set('foundFeatures', foundFeatures);
  },

  popupIcons: function(event) {
    var coord = event.target.attributes.coord.value.split(',');
    coord = [parseFloat(coord[1]), parseFloat(coord[0])];
    var point = new ol.geom.Point([
      coord[1],
      coord[0]
    ]);
    // clear layer
    this.get('layer_popup').getSource().clear();

    // create feature
    var ft = new ol.Feature({geometry: point});
    this.get('layer_popup').getSource().addFeature(ft);
    ft.setStyle(this.get('style_popup'));

  },

  clearSelection: function() {
   this.get('selectionModel').clearSelection();
  },

  clearBuffer: function() {
    this.get('bufferLayer').getSource().clear();

    if(this.get('varbergVer')) {
      this.deActivateBufferMarker();
      this.get('markerlayer').getSource().clear();
      this.get('layer_popup').getSource().clear();
      this.set('marker', undefined);
      this.set('popupHighlight', undefined);
      document.getElementById('visibleLayerList').innerHTML = '';
    }
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
  clicked: function (arg) {
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
