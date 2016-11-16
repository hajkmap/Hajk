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

var helper = (function () {
  return {
    featureArrayToObject: function (a, k) {
      var o = {};
      _.each(a, (i) => {
        o[i.getProperties()[k]] = i
      });
      return o;
    },
    move: function (origin, updatee) {
      origin.getGeometry().setCoordinates(
        updatee.getGeometry().getCoordinates()
      );
    },
    updateProps: function (origin, updatee) {
      origin.setProperties(
        _.extend(updatee.getProperties(), { messages: origin.getProperties().messages })
      );
    }
  };
}());

var LayerModel = require('layers/layer');

/**
 * @typedef {Object} WfsLayer~WfsLayerPropertiesParams
 * @property {string} service - Type of service @default WFS.
 * @property {string} version - Version of the WFS-protocol.
 * @property {string} request - Type of request to perform.
 * @property {string} typename - Name of the featureclass to query.
 * @property {string} outputFormat - Version ov the output format eg: GML2, GML3.
 * @property {string} srsname - SRID of the coordinatesystem eg: EPSG:3007.
 * @property {Array} bbox - Bounding box of wich to restrict the query.
 */

/**
 * @typedef {Object} WfsLayer~WfsLayerProperties
 * @property {string} url
 * @property {external:"ol.source"} vectorSurce
 * @property {external:"ol.source"} imageSource
 * @property {Array} filterFeatures
 * @property {bool} filterApplied Default: false
 * @property {WfsLayer~WfsLayerPropertiesParams} params
 */
var DataLayerProperties = {
  url: "",
  caption: "",
  vectorSource: undefined,
  imageSource: undefined,
  filterFeatures: [],
  filterApplied: false,
  params: {
    service: "WFS",
    version: "",
    request: "",
    typename: "",
    outputFormat: "",
    srsname: "",
    bbox: []
  }
};

/**
 * @description
 *
 *   Layer to be used as a display layer wich loads its features from a WFS-service.
 *   Currently this is supported for both geoserver and ArcGIS for Server.
 *
 * @class WfsLayer
 * @todo Add this layertype in the admintool for creation.
 * @param {WfsLayer~WfsLayerProperties} options
 * @param {string} type
 */
var DataLayer = {
  /**
  * @property {WfsLayer~WfsLayerProperties} defaults - Default properties
  * @instance
  */
  defaults: DataLayerProperties,

  initialize: function () {
    LayerModel.prototype.initialize.call(this);

    this.vectorSource = new ol.source.Vector({
      loader: (extent) => {

        setInterval(() => {
          $.ajax({
            url: this.get('url'),
            success: (vehicleFeatureCollection) => {

              var source = this.getLayer().getSource().getSource()
              ,   format = new ol.format.GeoJSON()
              ,   projection = this.get('map').getCRS();

              vehicleFeatureCollection = JSON.stringify(vehicleFeatureCollection);
              vehicleFeatureCollection = format.readFeatures(vehicleFeatureCollection, {
                dataProjection: "EPSG:4326",
                featureProjection: projection
              });

              vehicleFeatureCollection = vehicleFeatureCollection.filter(feature => {
                var f = false;
                var p = feature.getProperties();

                if (p.destination !== "" || p.transportMode === 3) {
                  f = true;
                }

                return f;
              });

              if (this.initiallyLoaded) {
                this.update(vehicleFeatureCollection, source);
              } else {
                source.addFeatures(vehicleFeatureCollection);
                this.initiallyLoaded = true;
              }

            }
          });
        }, 1000)

      },
      strategy: ol.loadingstrategy.fixed
    });

    this.imageSource = new ol.source.ImageVector({
      source: this.vectorSource,
      style: feature => {
        var icon = mode => {
          switch (mode) {
            case 2: return "http://karta.varmlandstrafik.se/icons/bus-icon.png";
            case 3: return "assets/icons/taxi.png";
            case 5: return "http://karta.varmlandstrafik.se/icons/train-icon.png";
          }
        };
        return [
          new ol.style.Style({
            image: new ol.style.Icon({
              src: icon(feature.getProperties().transportMode)
            })
          })
        ]
      }
    });

    this.layer = new ol.layer.Image({
      caption: this.get('caption'),
      name: this.get('name'),
      visible: this.get("visible"),
      source: this.imageSource
    });

    this.set("type", "data");
  },

  /**
   * Update features in layer.
   * @param {Array<object>} vehicleFeatureCollection - Array of vechicles
   * @param {object} source - Layer source to update
   */
  update: function (vehicleFeatureCollection, source) {
    // Walk through the collection of new vechicles and update
    // the corresponding source vechicle if found.
    // If the vechicle is not found in the source, add it.
    // If the vechicle is found in the source but is not present collection, remove it.
    var features = source.getFeatures();
    var updates  = helper.featureArrayToObject(vehicleFeatureCollection, 'vehicleRef');
    var presents = helper.featureArrayToObject(features, 'vehicleRef');

    _.each(vehicleFeatureCollection, function (fromService) {
      var id = fromService.getProperties()['vehicleRef'];
      if (presents.hasOwnProperty(id)) {
        helper.move(presents[id], fromService); // Move
        helper.updateProps(presents[id], fromService);
      } else {
        source.addFeature(fromService); // Add
      }
    });

    _.each(features, (feature) => {
      var id = feature.getProperties()['vehicleRef'];
      if (!updates.hasOwnProperty(id)) {
        source.removeFeature(feature); // Remove
      }
    });
  },

 /**
  * getSource - Get the source of this laer
  * @instance
  * @return {external:"ol.source"} style
  */
  getSource: function () {
    return this.vectorSource;
  },

 /**
  * updateLayer - Add features to this layer source
  * @instance
  * @param {Array<{external:"ol.feature"}>} feature
  */
  updateLayer: function (features) {
    this.getSource().addFeatures(features);
  },

 /**
  * refresh - redraw the layer
  * @instance
  */
  refresh: function () {
    this.imageSource.setStyle(this.imageSource.getStyle());
  }

};

/**
 * WfsLayer module.<br>
 * Use <code>require('layer/wfslayer')</code> for instantiation.
 * @module WfsLayer-module
 * @returns {WfsLayer}
 */
module.exports = LayerModel.extend(DataLayer);
