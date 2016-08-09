
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

module.exports = ToolModel.extend({

  defaults: {
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
  },

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
                anchor: [0.5, 32],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                src: this.get('markerImg'),
                imgSize: [32, 32]
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
            this.highlightFeature(sender, feature);
          }
        }, 0);
      });
  },

  /**
    * Anropas när verktyget har kopplats till applikationen.
    * @param  {object} shell applikationens modell.
    */
  configure: function (shell) {
      var map = shell.getMap().getMap(),
          selectInteraction = this.get('selectInteraction');

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
    * Hantera musklick i karta.
    * Kontrollerar om en feature träffades i kartan.
    * Stödjer Vector lager samt WMS.
    * @param  {object} e Mus event objekt.
    */
  onMapPointer: function (event) {
      var wmsLayers = this.layerCollection.filter((layer) => {
            return layer.get("type") === "wms" &&
                   layer.get("queryable") &&
                   layer.getVisible();
          }),
          projection = this.map.getView().getProjection().getCode(),
          resolution = this.map.getView().getResolution(),
          infos = [],
          promises = [],
          infosLen = 0;

    wmsLayers.reverse();

    $('body').css({cursor: 'wait'});
    this.layerOrder = {};
    this.get("features").reset();
    this.map.getLayers().forEach((layer, i) => {
      this.layerOrder[layer.get('name')] = i;
    });

    this.map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
      if (layer && layer.get('name')) {
        promises.push(new Promise((resolve, reject) => {
            features = [feature];
            _.each(features, (feature) => {
                this.addInformation(feature, layer, (featureInfo) => {
                  if (featureInfo) {
                    infos.push(featureInfo);
                    infosLen = infos.length;
                  }
                  resolve();
                });
            });
        }));
      }
    });

    // Kontrollerar om någon wms feature träffades.
    // Lägg till resultat i lista av uppslag.
    _.each(wmsLayers, (wmsLayer, index) => {
      wmsLayer.index = index;
        if (wmsLayer.get('queryable')) {
          promises.push(new Promise((resolve, reject) => {
            wmsLayer.getFeatureInformation({
              coordinate: event.coordinate,
              resolution: resolution,
              projection: projection,
              error: (message) => {
                resolve();
              },
              success: (features, layer) => {
                  if (features instanceof Array && features.length > 0) {
                    this.addInformation(features[0], wmsLayer, (featureInfo) => {
                        infos[wmsLayer.index + infosLen] = featureInfo;
                    });
                  }
                  resolve();
              }
            });
          }));
        }
    });

    this.set('loadFishished', false);
    Promise.all(promises).then(() => {
        $('body').css({cursor: 'default'});
        _.each(infos, (info) => {
          this.get("features").add(info);
        });
        this.set("loadFishished", true);
        this.togglePanel();
        if (infos.length === 0) {
          this.set("selectedFeature", undefined);
        }
    });
  },

  /**
    * Lägg till träffad feature i resultatet.
    * @param {object} feature vector feature.
    * @param {object} layer   openlayers lager.
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



      if (information) {
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

        layerindex = this.layerOrder.hasOwnProperty(layerModel.getName()) ?
                     this.layerOrder[layerModel.getName()] : 999;
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
    * Visa/dölj panel
    */
  togglePanel: function () {
      if (this.get("features").length > 0) {
        this.set('visible', true);
      } else if (this.get("navigation").get("activePanelType") === this.get("panel")) {
        this.set('visible', false);
      }
  },

  /*
    * Lägger till den valda featuren i highlight-lagret.
  */
  createHighlightFeature: function (feature) {
      var layer = this.get('highlightLayer');
      layer.clearHighlight();
      this.reorderLayers(feature);
      layer.addHighlight(feature.get('feature'));
      layer.setSelectedLayer(feature.get('layer'));
  },

  /*
    * Lägger highlightlagret på rätt index i lagerordningen
  */
  reorderLayers: function (feature) {
      var layerCollection = this.get('map').getLayers(),
          featureInfo = feature.get('information'),
          selectedLayer = feature.get('layer'),
          insertIndex;

      _.each(layerCollection.getArray(), (layer, index) => {
        if (layer.getProperties().name!="highlight-wms") {
            if (layer.get('name') == selectedLayer.get('name')) {
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
    * Markera feature i kartan.
    * @param  {object} sender  infoclick model
    * @param  {object} feature feature som ska markeras.
    */
  highlightFeature: function (sender, feature) {
      var highlightLayer = this.get('highlightLayer');

      if (this.selectInteraction.getFeatures().getLength() > 0) {
        this.selectInteraction.getFeatures().removeAt(0);
      }

      if (feature) {
        if (feature.get("feature").getGeometry().getType() === "Point") {
          highlightLayer.clearHighlight();
          this.selectInteraction.getFeatures().push(feature.get("feature"));
        } else {
          this.createHighlightFeature(feature);
        }
      } else {
        highlightLayer.clearHighlight();
      }
  },

  clearHighlight: function () {
      var features = this.selectInteraction.getFeatures(),
          highlightLayer = this.get('highlightLayer');

      if (features.getLength() > 0) {
      this.selectInteraction.getFeatures().removeAt(0);
      }
      highlightLayer.clearHighlight();
  }

});
