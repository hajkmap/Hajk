var ToolModel = require('tools/tool');

var Edit = module.exports = ToolModel.extend({
  /*
   * Property: default settings
   *
   */
  defaults: {
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
    shell: undefined
  },
  /**
   *
   *
   */
  filty: false,
  /**
   *
   *
   */
  write: function (mode, features) {

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

    return mode === "insert" ? format.writeTransaction(features, null, null, gml) :
           mode === "update" ? format.writeTransaction(null, features, null, gml) :
           mode === "delete" ? format.writeTransaction(null, null, features, gml) :
           undefined;
  },
  /**
   *
   *
   */
  refreshLayer: function (layerName) {
    var source
    ,   foundLayer = this.get('layerCollection').find(layer => {
          if (layer.getLayer().getSource().getParams) {
            let p = layer.getLayer().getSource().getParams();
            if (typeof p === 'object') {
              return layerName === p['LAYERS']
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
   *
   *
   */
  parseWFSTresponse: function (response) {
    var str = (new XMLSerializer()).serializeToString(response);
    return (new X2JS()).xml2js(str);
  },
  /**
   *
   *
   */
  transact: function (features, mode, done) {

    var node = this.write(mode, features)
    ,   src = this.get('editSource')
    ,   serializer = new XMLSerializer()
    ,   payload    = node ? serializer.serializeToString(node) : undefined;

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
        done(data);
      }).error((data) => {
        var data = this.parseWFSTresponse(data);
        done(data);
      });
    }

  },
  /**
   *
   *
   */
  save: function (done) {
    var updated = this.get('vectorSource').getFeatures().filter(feature => feature.modification === 'updated')
    ,   added   = this.get('vectorSource').getFeatures().filter(feature => feature.modification === 'added')
    ,   deleted = this.get('vectorSource').getFeatures().filter(feature => feature.modification === 'removed');

    if (updated.length === 0 &&
        added.length === 0 &&
        deleted.length === 0)
      return done();

    if (updated.length > 0)
      this.transact(updated, 'update', done);

    if (added.length > 0)
      this.transact(added, 'insert', done);

    if (deleted.length > 0)
      this.transact(deleted, 'delete', done);

    this.get('vectorSource')
      .getFeatures()
      .filter(f => f.modification !== undefined)
      .forEach(f => f.modification = undefined);
  },
  /**
   *
   *
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
          width: 3
        }),
        radius: 5
      })
    })];
  },
  /**
   *
   *
   */
  getStyle: function (feature) {
    return [new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 1)',
        width: 1
      }),
      fill: new ol.style.Fill({
        color: 'rgba(50, 50, 50, 0.5)'
      }),
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'rgba(50, 50, 50, 0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 1)',
          width: 1
        }),
        radius: 5
      })
    })];
  },
  /**
   *
   *
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
        feature.on('propertychange', (e) => {
          feature.modification = 'updated';
        });
        feature.on('change', (e) => {
          feature.modification = 'updated';
        });
      });
      if (done) done();
    });
  },
  /**
   *
   *
   */
  editAttributes: function(feature) {
    this.set({editFeature: feature});
  },
  /**
   *
   *
   */
  featureSelected: function (event) {
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
   *
   *
   */
  setLayer: function (source, done) {
    this.filty = true;

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
      this.set('select', new ol.interaction.Select({ style: this.getSelectStyle() }));
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

    this.get('select').setActive(true);
    this.get('modify').setActive(true);
    this.get('layer').dragLocked = true;
  },
  /**
   *
   *
   */
  deactivate: function () {
    if (this.get('select')) {
      this.get('select').setActive(false);
      this.get('select').getFeatures().clear();
    }
    if (this.get('modify')) {
      this.get('modify').setActive(false);
    }
    if (this.get('layer')) {
      this.get('map').removeLayer(this.get('layer'));
      this.set('layer', undefined);
    }

    this.set({editSource: null});
    this.set({editFeature: null});

    this.filty = false;
  },
  /**
   * Configure the tool before first use.
   * @params {Backbone.Model} shell
   */
  configure: function (shell) {
    this.set('map', shell.getMap().getMap());
    this.set('layerCollection', shell.getLayerCollection());
    var navigation = shell.getNavigation();
    navigation.on('change:activePanel', (e) => {
      this.deactivate();
    });

  },
  /**
   * @desc Event handler triggered when the tool is clicked.
   * @return {undefined}
   */
  clicked: function () {
    this.set('visible', true);
  }
});
