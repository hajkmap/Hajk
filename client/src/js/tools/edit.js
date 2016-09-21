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
    removeFeature: undefined,
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
   *
   *
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
   *
   *
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
   *
   *
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
   *
   *
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
   *
   *
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
   *
   *
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
   * @param {extern: ol.feature} - Drawn feature
   * @param {string} geometryType - Geometry type of feature
   */
  handleDrawEnd: function(feature, geometryType) {
    feature.setGeometryName('geom');
    feature.modification = 'added';
    this.editAttributes(feature);
  },
  /**
   *
   *
   */
  setRemovalToolMode: function (mode) {
    this.set('removalToolMode', mode);
  },
  /**
   * Create draw interaction and add to map.
   * @params: {string} type
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
    }

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
   *
   *
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
   *
   *
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
