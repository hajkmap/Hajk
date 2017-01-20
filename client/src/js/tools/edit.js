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
 * @typedef {Object} EditModel~EditModelProperties
 * @property {string} type - Default: edit
 * @property {string} panel - Default: editpanel
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-pencil-square-o icon
 * @property {string} title - Default: Editera
 * @property {boolean} visible - Default: false
 * @property {external:"ol.source"} vectorSource - Default: undefined
 * @property {external:"ol.source"} imageSource - Default: undefined
 * @property {external:"ol.layer"} layer - Default: undefined
 * @property {external:"ol.interaction.Select"} select - Default: undefined
 * @property {external:"ol.interaction.Modify"} modify - Default: undefined
 * @property {string} key - Default: undefined
 * @property {external:"ol.feature"} editFeature - Default: undefined
 * @property {external:"ol.source"} editSource - Default: undefined
 * @property {external:"ol.feature"} removeFeature - Default: undefined
 * @property {ShellModel} shell - Default: undefined
 */
var EditModelProperties = {
  type: 'edit',
  panel: 'editpanel',
  toolbar: 'bottom',
  icon: 'fa fa-pencil-square-o icon',
  title: 'Editera',
  visible: false,
  vectorSource: undefined,
  imageSource: undefined,
  layer: undefined,
  select: undefined,
  modify: undefined,
  key: undefined,
  editFeature: undefined,
  editSource: undefined,
  removeFeature: undefined,
  shell: undefined
};

/**
 * Prototype for creating an edit model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {EditModel~EditModelProperties} options - Default options
 */
var EditModel = {
  /*
   * @instance
   * @property defaults - Default settings
   * @{EditModel~EditModelProperties} defaults
   */
  defaults: EditModelProperties,

  /**
   * @instance
   * @property {boolean} filty - Default: false
   */
  filty: false,

  configure: function (shell) {
    this.set('map', shell.getMap().getMap());

    this.set('layerCollection', shell.getLayerCollection());
    var navigation = shell.getNavigation();
    navigation.on('change:activePanel', (e) => {
      this.deactivate();
    });
  },

  /**
   * Generate transaction XML-string to post
   * @instance
   * @param {Array<{external:"ol.feature"}>} features
   * @return {string} XML-string to post
   */
  write: function (features) {

    var format = new ol.format.WFS()
    ,   lr = this.get('editSource').layers[0].split(':')
    ,   ns = lr.length === 2 ? lr[0] : ""
    ,   ft = lr.length === 2 ? lr[1] : lr[0]
    ,   options = {
          featureNS: ns,
          featureType: ft,
          srsName: this.get('editSource').projection
        }
    ,   gml = new ol.format.GML(options);

    return format.writeTransaction(features.inserts, features.updates, features.deletes, gml);
  },

  /**
   * Try to find the corresponding WMS-layer in the map.
   * If found, refresh that layer.
   * @instance
   * @param {string} layerName
   */
  refreshLayer: function (layerName) {
    var source
    ,   foundLayer = this.get('layerCollection').find(layer => {
          if (layer.getLayer().getSource().getParams) {
            let p = layer.getLayer().getSource().getParams();
            if (typeof p === 'object') {

              let paramName = p['LAYERS'].split(':');
              let layerSplit = layerName.split(':');

              if (paramName.length === 2 && layerSplit.length === 2) {
                return layerName === p['LAYERS'];
              }
              if (paramName.length === 1) {
                return layerSplit[1] === p['LAYERS'];
              }

            }
          }
        });

    if (foundLayer) {
      source = foundLayer.getLayer().getSource();
      source.changed();
      source.updateParams({"time": Date.now()});
      this.get('map').updateSize();
    }
  },
  /**
   * @instance
   * @param {XMLDocument} response
   * @return {object} js-xml-translation-object
   */
  parseWFSTresponse: function (response) {
    var str = (new XMLSerializer()).serializeToString(response);
    return (new X2JS()).xml2js(str);
  },
  /**
   * Make transaction
   * @instance
   * @param {Array<{external:"ol.feature"}>} features
   * @param {function} done - Callback to invoke when the transaction is complete.
   */
  transact: function (features, done) {

    var node = this.write(features)
    ,   serializer = new XMLSerializer()
    ,   src = this.get('editSource')
    ,   payload = node ? serializer.serializeToString(node) : undefined;

    if (payload) {
      $.ajax(HAJK2.searchProxy + src.url, {
        type: 'POST',
        dataType: 'xml',
        processData: false,
        contentType: 'text/xml',
        data: payload
      }).done((data) => {

        this.refreshLayer(src.layers[0]);
        var data = this.parseWFSTresponse(data);

        this.get('vectorSource')
          .getFeatures()
          .filter(f => f.modification !== undefined)
          .forEach(f => f.modification = undefined);
        done(data);
      }).error((data) => {
        var data = this.parseWFSTresponse(data);
        done(data);
      });
    }
  },

  /**
   * Trigger transaction
   * @instance
   * @param {function} done - Callback to invoke when the transaction is complete.
   */
  save: function (done) {

    var find = mode =>
      this.get('vectorSource').getFeatures().filter(feature =>
        feature.modification === mode);

    var features = {
      updates: find('updated'),
      inserts: find('added'),
      deletes: find('removed')
    };

    if (features.updates.length === 0 &&
        features.inserts.length === 0 &&
        features.deletes.length === 0) {
      return done();
    }

    this.transact(features, done);
  },

  /**
   * Generate the select style.
   * @instance
   * @param {external:"ol.feature"} feature
   * @return {Array<{external:"ol.style"}>}
   */
  getSelectStyle: function (feature) {
    return [new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 255, 255, 1)',
        width: 3
      }),
      fill: new ol.style.Fill({
        color: 'rgba(0, 0, 0, 0.5)'
      }),
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 0, 0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 255, 255, 1)',
          width: 2
        }),
        radius: 3
      })
    }), new ol.style.Style({
      image: new ol.style.RegularShape({
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 0, 0.2)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 1)',
          width: 2
        }),
        points: 4,
        radius: 8,
        angle: Math.PI / 4
      }),
      geometry: function(feature) {
        coordinates = feature.getGeometry() instanceof ol.geom.Polygon ?
                      feature.getGeometry().getCoordinates()[0] :
                      feature.getGeometry().getCoordinates();
        return new ol.geom.MultiPoint(coordinates);
      }
    })];
  },

  /**
   * Generate the default display style.
   * @instance
   * @param {external:"ol.feature"} feature
   * @return {Array<{external:"ol.style"}>}
   */
  getStyle: function (feature) {
    return [new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 1)',
        width: 3
      }),
      fill: new ol.style.Fill({
        color: 'rgba(0, 0, 0, 0.5)'
      }),
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 0, 0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 1)',
          width: 3
        }),
        radius: 4
      })
    })];
  },

  /**
   * Generate the hidden style.
   * @instance
   * @param {external:"ol.feature"} feature
   * @return {Array<{external:"ol.style"}>}
   */
  getHiddenStyle : function (feature) {
    return [new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 0)',
        width: 0
      }),
      fill: new ol.style.Fill({
        color: 'rgba(1, 2, 3, 0)'
      }),
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 0, 0)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0)',
          width: 0
        }),
        radius: 0
      })
    })];
  },

  /**
   * Generate the scetch style.
   * @instance
   * @param {external:"ol.feature"} feature
   * @return {Array<{external:"ol.style"}>}
   */
  getScetchStyle: function () {
    return [
      new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0.5)',
          width: 4
        }),
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: 'rgba(0, 0, 0, 0.5)'
          }),
          stroke: new ol.style.Stroke({
            color: 'rgba(255, 255, 255, 0.5)',
            width: 2
          })
        })
      })
    ]
  },

  /**
   * Load data from WFS-service and att to the source.
   * @instance
   * @param {object} config
   * @param {number[]} extent
   * @param {function} done - Callback
   */
  loadData: function (config, extent, done) {
    var format = new ol.format.WFS();
    $.ajax(HAJK2.wfsProxy + config.url, {
        type: 'GET',
        data: {
          service: 'WFS',
          version: '1.1.0',
          request: 'GetFeature',
          typename: config.layers[0],
          srsname: config.projection
        }
    }).done(rsp => {
      this.get('vectorSource').addFeatures(format.readFeatures(rsp));
      this.get('vectorSource').getFeatures().forEach(feature => {

        //Property changed
        feature.on('propertychange', (e) => {
          if (feature.modification === 'removed')
            return;
          if (feature.modification === 'added')
            return;
          feature.modification = 'updated';
        });

        //Geometry changed.
        feature.on('change', (e) => {
          if (feature.modification === 'removed')
            return;
          if (feature.modification === 'added')
            return;
          feature.modification = 'updated';
        });

      });
      if (done) done();
    }).error(rsp => {
      alert("Fel: data kan inte hämtas. Försök igen senare.");
      if (done) done();
    });
  },

  /**
   * Trigger edit attribute session.
   * @instance
   * @param {external:"ol.feature"} feature
   */
  editAttributes: function(feature) {
    this.set({editFeature: feature});
  },

  /**
   * Event handler for feature selection.
   * @instance
   * @param {object} event
   */
  featureSelected: function (event) {
    if (this.get('removalToolMode') === 'on') {
      event.selected.forEach(feature => {
        this.set({removeFeature: feature});
      });
      return;
    }

    if (event.selected.length === 0) {
      this.editAttributes(null, null);
    }

    event.selected.forEach(feature => {
      if (!feature.getId() && feature.getProperties().user) {
        this.get('select').getFeatures().remove(feature);
      }
      event.mapBrowserEvent.filty = true;
      this.editAttributes(feature);
    });
  },

  /**
   * Set this models avtive layer.
   * @instance
   * @param {external:"ol.source"} source
   * @param {function} done - Callback
   */
  setLayer: function (source, done) {
    this.filty = true;

    this.get('map').set('clickLock', true);

    if (this.get('layer')) {
      this.get('map').removeLayer(this.get('layer'));
    }

    this.set('vectorSource', new ol.source.Vector({
      loader: (extent) => this.loadData(source, extent, done),
      strategy: ol.loadingstrategy.all,
      projection: source.projection
    }));

    this.set('imageSource', new ol.source.ImageVector({
       source: this.get('vectorSource'),
       style: this.getStyle()
    }));

    this.set('layer', new ol.layer.Image({source: this.get('imageSource')}));
    this.get('map').addLayer(this.get('layer'));

    if (!this.get('select')) {
      this.set('select', new ol.interaction.Select({
        style: this.getSelectStyle(),
        toggleCondition: ol.events.condition.never
      }));
      this.get('map').addInteraction(this.get('select'));
    } else {
      this.get('select').getFeatures().clear();
      this.get('select').unByKey(this.get('key'));
    }

    this.set('key', this.get('select').on('select', (event) => { this.featureSelected(event, source) }));

    if (!this.get('modify')) {
      this.set('modify', new ol.interaction.Modify({ features: this.get('select').getFeatures() }));
      this.get('map').addInteraction(this.get('modify'));
    }

    this.set({editSource: source});
    this.set({editFeature: null});
    this.get('select').setActive(true);
    this.get('modify').setActive(true);
    this.get('layer').dragLocked = true;
  },

  /**
   * Event handler for draw end.
   * @instance
   * @param {external:"ol.feature"} - Drawn feature
   * @param {string} geometryType - Geometry type of feature
   */
  handleDrawEnd: function(feature, geometryType) {
    feature.setGeometryName('geom');
    feature.modification = 'added';
    this.editAttributes(feature);
  },

  /**
   * Set the mode of the removal tool.
   * @instance
   * @param {string} mode
   */
  setRemovalToolMode: function (mode) {
    this.set('removalToolMode', mode);
  },

  /**
   * Activate the draw tool.
   * @instance
   * @param {string} geometryType
   */
  activateDrawTool: function(geometryType) {

    var add = () => {
      this.set('drawTool', new ol.interaction.Draw({
        source: this.get('vectorSource'),
        style: this.getScetchStyle(),
        type: geometryType,
        geometryName: 'geom'
      }));
      this.get("drawTool").on('drawend', (event) => {
        this.handleDrawEnd(event.feature, geometryType)
      });
      this.get('map').addInteraction(this.get('drawTool'));
    };

    var remove = () => {
      this.get('map').removeInteraction(this.get('drawTool'));
      this.set('drawTool', undefined);
    };

    this.get('map').set('clickLock', true);

    if (this.get('select')) {
      this.get('select').setActive(false);
    }

    if (this.get("drawTool")) {
      this.get('drawTool').setActive(true);
      if (this.set('geometryType', geometryType) !== geometryType) {
        remove();
        add();
      }
    } else {
      add();
    }
  },

  /**
   * Activate the draw tool.
   * @instance
   * @param {boolean} keepClickLock - Whether to keep the maps' clicklock or not.
   */
  deactivateDrawTool: function(keepClickLock) {
    if (!keepClickLock)
      this.get('map').set('clickLock', false);

    if (this.get('select')) {
      this.get('select').setActive(true);
    }

    if (this.get('drawTool')) {
      this.get('drawTool').setActive(false);
    }
  },

  /**
   * Deactivate all edit interactions.
   * @instance
   */
  deactivateTools: function() {
    if (this.get('select')) {
      this.get('select').setActive(false);
      this.get('select').getFeatures().clear();
    }

    if (this.get('modify')) {
      this.get('modify').setActive(false);
    }

    if (this.get('drawTool')) {
      this.get('drawTool').setActive(false);
    }
  },

  /**
   * Deactivate the edit tool
   * @instance
   */
  deactivate: function () {
    if (this.get('select')) {
      this.get('select').setActive(false);
      this.get('select').getFeatures().clear();
    }

    if (this.get('modify')) {
      this.get('modify').setActive(false);
    }

    if (this.get('drawTool')) {
      this.get('drawTool').setActive(false);
    }

    if (this.get('layer')) {
      this.get('map').removeLayer(this.get('layer'));
      this.set('layer', undefined);
    }

    this.set({
      editSource: undefined,
      editFeature: undefined,
      removeFeature: undefined,
      removalToolMode: undefined
    });

    this.filty = false;
    this.get('map').set('clickLock', false);
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
  }
};

/**
 * Edit model module.<br>
 * Use <code>require('models/edit')</code> for instantiation.
 * @module EditModel-module
 * @returns {EditModel}
 */
module.exports = ToolModel.extend(EditModel);
