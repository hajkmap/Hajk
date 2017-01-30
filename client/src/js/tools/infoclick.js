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
var HighlightLayer = require('layers/highlightlayer');

var FeatureModel = Backbone.Model.extend({
  defaults:{
    feature: undefined,
    information: undefined,
    layer: undefined
  },

  initialize: function () {
    this.id = this.cid;
  }
});

var FeatureCollection = Backbone.Collection.extend({
  model: FeatureModel
});

/**
 * @typedef {Object} InfoClickModel~InfoClickModelProperties
 * @property {string} type - Default: infoclick
 * @property {string} panel - Default: InfoPanel
 * @property {boolean} visible - Default: false
 * @property {external:"ol.map"} map
 * @property {string} wmsCallbackName - Default: LoadWmsFeatureInfo
 * @property {external:"ol.feature"[]} features
 * @property {external:"ol.feature"} selectedFeature
 * @property {external:"ol.layer"} highlightLayer
 * @property {external:"ol.interaction.Select"} selectInteraction
 * @property {string} markerImg - Default: "assets/icons/marker.png"
 */
var InfoClickModelProperties = {
  type: 'infoclick',
  panel: 'InfoPanel',
  visible: false,
  map: undefined,
  wmsCallbackName: "LoadWmsFeatureInfo",
  features: undefined,
  selectedFeature: undefined,
  highlightLayer: undefined,
  selectInteraction: undefined,
  markerImg: "assets/icons/marker.png"
};

/**
 * Prototype for creating an infoclick model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {InfoClickModel~InfoClickModelProperties} options - Default options
 */
var InfoClickModel = {
  /**
   * @instance
   * @property {InfoClickModel~InfoClickModelProperties} defaults - Default settings
   */
  defaults: InfoClickModelProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
    this.initialState = options;
    this.set("features", new FeatureCollection());
    this.selectInteraction = new ol.interaction.Select({
      multi: false,
      active: false,
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.6)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0.6)',
          width: 4
        }),
        image: new ol.style.Icon({
          anchor: this.get('anchor') || [0.5, 32],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          src: this.get('markerImg'),
          imgSize: this.get('imgSize') || [32, 32]
        })
      })
    });

    this.set("selectInteraction", this.selectInteraction);
    this.set("highlightLayer", new HighlightLayer());
    this.selectInteraction.setActive(false);

    this.get("features").on("add", (feature, collection) => {
      if (collection.length === 1) {
        this.set('selectedFeature', feature);
      }
    });

    this.on("change:selectedFeature", (sender, feature) => {
      setTimeout(() => {
        if (this.get('visible')) {
          this.highlightFeature(feature);
        }
      }, 0);
    });
  },

  configure: function (shell) {
    var map = shell.getMap().getMap()
    ,   selectInteraction = this.get('selectInteraction');

    map.addInteraction(this.selectInteraction);
    this.layerCollection = shell.getLayerCollection();
    this.map = map;
    this.map.on('singleclick', (event) => {
      try {
        setTimeout(a => {
          if (!map.get('clickLock') && !event.filty) {
            this.onMapPointer(event);
          }
        }, 0);
      } catch (e) {}
    });
    this.set('map', this.map);
  },

  /**
   * Handle when users clicks anywhere in the map.
   * Support for WMS layers and vector layers.
   * @instance
   * @param {object} event - Mouse event
   */
  onMapPointer: function (event) {
    var wmsLayers = this.layerCollection.filter((layer) => {
          return (layer.get("type") === "wms" || layer.get("type") === "arcgis") &&
                 layer.get("queryable") &&
                 layer.getVisible();
        })
    ,   projection = this.map.getView().getProjection().getCode()
    ,   resolution = this.map.getView().getResolution()
    ,   infos = []
    ,   promises = []
    ;

    $('body').css({cursor: 'wait'});
    this.layerOrder = {};
    this.get("features").reset();

    this.map.getLayers().forEach((layer, i) => {
      this.layerOrder[layer.get('name')] = i;
    });

    this.map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
      if (layer && layer.get('name')) {
        if (
          layer.get('name') !== 'preview-layer' &&
          layer.get('name') !== 'highlight-wms'
        ) {
          promises.push(new Promise((resolve, reject) => {
              features = [feature];
              _.each(features, (feature) => {
                  this.addInformation(feature, layer, (featureInfo) => {
                    if (featureInfo) {
                      infos.push(featureInfo);
                    }
                    resolve();
                  });
              });
          }));
        }
      }
    });

    wmsLayers.forEach((wmsLayer, index) => {
      wmsLayer.index = index;
      promises.push(new Promise((resolve, reject) => {
        wmsLayer.getFeatureInformation({
          coordinate: event.coordinate,
          resolution: resolution,
          projection: projection,
          error: message => {
            resolve();
          },
          success: features => {
            if (Array.isArray(features) && features.length > 0) {

              features.forEach(feature => {
                this.addInformation(feature, wmsLayer, (featureInfo) => {
                  infos.push(featureInfo);
                });
              });

            }
            resolve();
          }
        });
      }));
    });

    this.set('loadFinished', false);

    Promise.all(promises).then(() => {
      $('body').css({cursor: 'default'});

      infos.sort((a, b) => {
        var s1 = this.layerOrder[a.layer.id]
        ,   s2 = this.layerOrder[b.layer.id]
        ;
        return s1 === s2 ? 0 : s1 < s2 ? 1 : -1;
      });

      infos.forEach(info => {
        this.get('features').add(info);
      });

      this.set('loadFinished', true);
      this.togglePanel();

      if (infos.length === 0) {
        this.set('selectedFeature', undefined);
      }
    });
  },

  /**
   * Add feature to hit list.
   * @instance
   * @param {external:"ol.feature"} feature
   * @param {external:"ol.layer"} layer
   * @param {function} callback to invoke when information is added
   */
  addInformation: function (feature, layer, callback) {

    if (layer.get('name') === 'draw-layer') {
      callback(false);
      return;
    }

    var layerModel = this.layerCollection.findWhere({ name: layer.get("name") })
    ,   layerindex = -1
    ,   properties
    ,   information
    ,   iconUrl = feature.get('iconUrl') || ''
    ;

    properties = feature.getProperties();
    information = layerModel && layerModel.get("information") || "";

    if (information && typeof information === "string") {
      (information.match(/\{.*?\}\s?/g) || []).forEach(property => {
          function lookup(o, s) {
            s = s.replace('{', '')
                 .replace('}', '')
                 .trim()
                 .split('.');

            switch (s.length) {
              case 1: return o[s[0]] || "";
              case 2: return o[s[0]][s[1]] || "";
              case 3: return o[s[0]][s[1]][s[2]] || "";
            }
          }
          information = information.replace(property, lookup(properties, property));
      });
    }
        
    if (!layerModel) {
      layerIndex = 999;
    } else {
      layerindex = this.layerOrder.hasOwnProperty(layerModel.getName())
        ? this.layerOrder[layerModel.getName()]
        : 999;
    }

    callback({
      feature: feature,
      layer: layer,
      information: {
          caption: layerModel && layerModel.getCaption() || "Sökträff",
          layerindex: layerindex,
          information: information || properties,
          iconUrl: iconUrl,
      }
    });
  },

  /**
   * Toggle the panel
   * @instance
   */
  togglePanel: function () {
    if (this.get("features").length > 0) {
      this.set('visible', true);
    } else if (this.get("navigation").get("activePanelType") === this.get("panel")) {
      this.set('visible', false);
    }
  },

  /**
   * Create and add feature to highlight layer.
   * @instance
   * @param {external:"ol.feature"} feature
   */
  createHighlightFeature: function (feature) {
    var layer = this.get('highlightLayer');
    layer.clearHighlight();
    this.reorderLayers(feature);
    layer.addHighlight(feature.get('feature'));
    layer.setSelectedLayer(feature.get('layer'));
  },

  /**
   * Adds the highlight layer at correct draw order in the map.
   * @instance
   * @param {external:"ol.feature"}
   */
  reorderLayers: function (feature) {

    var layerCollection = this.get('map').getLayers()
    ,   featureInfo = feature.get('information')
    ,   selectedLayer = feature.get('layer')
    ,   insertIndex;

    layerCollection.getArray().forEach((layer, index) => {
      if (layer.getProperties().name !== "highlight-wms") {
        if (layer.get('name') === selectedLayer.get('name')) {
          insertIndex = index + 1;
        }
      }
      if (insertIndex) {

        layerCollection.remove(this.get('highlightLayer').getLayer());
        layerCollection.insertAt(insertIndex, this.get('highlightLayer').getLayer());
        insertIndex = undefined;

      }
    });
  },

  /**
   * Highlight feature.
   * @instance
   * @param {external:"ol.feature"} feature
   */
  highlightFeature: function (feature) {
      var highlightLayer = this.get('highlightLayer');

      if (this.selectInteraction.getFeatures().getLength() > 0) {
        this.selectInteraction.getFeatures().removeAt(0);
      }

      if (feature) {
        if (feature.get("feature").getGeometry() &&
            feature.get("feature").getGeometry().getType() === "Point") {
          highlightLayer.clearHighlight();
          this.selectInteraction.getFeatures().push(feature.get("feature"));
        } else {
          this.createHighlightFeature(feature);
        }
      } else {
        highlightLayer.clearHighlight();
      }
  },

  /**
   * Highlight feature.
   * @instance
   * @param {external:"ol.feature"} feature
   */
  clearHighlight: function () {
      var features = this.selectInteraction.getFeatures(),
          highlightLayer = this.get('highlightLayer');

      if (features.getLength() > 0) {
        this.selectInteraction.getFeatures().removeAt(0);
      }
      highlightLayer.clearHighlight();
  }

};

/**
 * InfoClick model module.<br>s
 * Use <code>require('models/infoclick')</code> for instantiation.
 * @module InfoClickModel-module
 * @returns {InfoClickModel}
 */
module.exports = ToolModel.extend(InfoClickModel);
