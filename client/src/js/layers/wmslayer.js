var LayerModel = require('layers/layer');

/**
 * @typedef {Object} WmsLayer~WmsLayerProperties
 * @property {string} url
 * @property {string} projection - Default: EPSG:3007
 * @property {string} serverType - argis | geoserver. Default: geoserver
 * @property {number} opacity - Default: 1
 * @property {string} status - Load status for layer. Default: ok
 * @property {object} params
 */
var WmsLayerProperties = {
  url: "",
  projection: "EPSG:3007",
  serverType: 'geoserver',
  opacity: 1,
  status: "ok",
  params: {}
};

/**
 * @description
 *
 * Layer to be used as a display layer wich loads its content WMS-service.
 * This layer type is supported for both geoserver and ArcGIS for Server.
 *
 * @class WmsLayer
 * @param {WmsLayer~WmsLayerProperties} options
 * @param {string} type
 */
var WmsLayer = {

  /**
   * @property {WmsLayer~WmsLayerProperties} defaults - Default properties
   * @instance
   */
  defaults: WmsLayerProperties,

  /**
   * @property {bool} validInfo - Default: true
   * @instance
   */
  validInfo: true,

  initialize: function () {
    LayerModel.prototype.initialize.call(this);

    var source = {
      url: this.get('url'),
      params: this.get('params'),
      projection: this.get('projection'),
      serverType: this.get('serverType'),
      imageFormat: this.get('imageFormat'),
      attributions: this.getAttributions(),
    };

    if (this.get('resolutions') &&
      this.get('resolutions').length > 0 &&
      this.get('origin') &&
      this.get('origin').length > 0) {
        source.tileGrid = new ol.tilegrid.TileGrid({
          resolutions: this.get('resolutions'),
          origin: this.get('origin')
        });
        source.extent = this.get('extent')
    }

    if (this.get('singleTile')) {
      this.layer = new ol.layer.Image({
        name: this.get('name'),
        visible: this.get('visible'),
        queryable: this.get('queryable'),
        caption: this.get('caption'),
        opacity: this.get("opacity"),
        source: new ol.source.ImageWMS(source)
      });
    } else {
      this.layer = new ol.layer.Tile({
        name: this.get('name'),
        visible: this.get('visible'),
        queryable: this.get('queryable'),
        caption: this.get('caption'),
        opacity: this.get("opacity"),
        source: new ol.source.TileWMS(source)
      });
    }

    this.set("wmsCallbackName", "wmscallback" + Math.floor(Math.random() * 1000) + 1);
    global.window[this.get("wmsCallbackName")] = _.bind(this.getFeatureInformationReponse, this);

    this.layer.getSource().on('tileloaderror', e => {
      this.tileLoadError();
    });

    this.layer.getSource().on('tileloadend', e => {
      this.tileLoadOk();
    });

    this.layer.on('change:visible', (e) => {
      if (!this.get('visible')) {
        this.tileLoadOk();
      }
    });

    this.layer.getSource().set('url', this.get('url'));
    this.set("type", "wms");
  },

  removeProxyFromURLIfPresent : function(url){

    var http = url.lastIndexOf("http://");
    var https = url.lastIndexOf("https://");

    if(http > https){
      index = http;
    }
    else {
      index = https;
    }
   
    if(index != -1){
      return url.substr(index);
    }
    else {
      return url;
    }
  },

  /**
   * Load feature information.
   * @instance
   * @param {external:"ol.feature"} feature
   * @return {external:"ol.style"} style
   */
  getFeatureInformation: function (params) {
    var url;
    try {

      this.validInfo = true;
      this.featureInformationCallback = params.success;

      url = this.getLayer()
      .getSource()
      .getGetFeatureInfoUrl(
        params.coordinate,
        params.resolution,
        params.projection,
        {
          'INFO_FORMAT': this.get('serverType') === "arcgis" ? 'application/geojson' : 'application/json',
          'feature_count': 100
        }
      );

      if (url) {
        url = this.removeProxyFromURLIfPresent(url);

        if (HAJK2.searchProxy) {
          url = encodeURIComponent(url);
        }

        var request = $.ajax({
          url: HAJK2.searchProxy + url,
          success: (data) => {
            var features = new ol.format.GeoJSON().readFeatures(data);
            this.featureInformationCallback(features, this.getLayer());
          }
        });
        
        request.fail(params.error);
      }
    } catch (e) {
      params.error(e);
    }
  },

  /**
   * Triggers when a tile fails to load.
   * @instance
   */
  tileLoadError: function () {
    this.set("status", "loaderror");
  },

  /**
   * Triggers when a tile loads.
   * @instance
   */
  tileLoadOk: function () {
    this.set("status", "ok");
  },

  /**
   * Parse response and trigger registred feature information callback.
   * @param {XMLDocument} respose
   * @instance
   */
  getFeatureInformationReponse: function (response) {
    try {
        var features = new ol.format.GeoJSON().readFeatures(response);
      this.featureInformationCallback(features, this.getLayer());
      } catch (e) {
        console.error(e);
    }
  }
};

/**
 * WmsLayer module.<br>
 * Use <code>require('layer/wmslayer')</code> for instantiation.
 * @module WmsLayer-module
 * @returns {WmsLayer}
 */
module.exports = LayerModel.extend(WmsLayer);
