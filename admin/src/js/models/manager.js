
var manager = Backbone.Model.extend({

  defaults: {
    layers: []
  },

  getConfig: function (url) {
    $.ajax(url, {
      success: data => {
        data.wmslayers.sort((a, b) => {
          var d1 = parseInt(a.date)
          ,   d2 = parseInt(b.date);
          return d1 === d2 ? 0 : d1 < d2 ? 1 : -1;
        });
        this.set('layers', data.wmslayers);
      }
    });
  },  

  addLayer: function (layer, callback) {
    $.ajax({
      url: this.get('config').url_layer_settings,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(layer),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  updateLayer: function(layer, callback) {
    $.ajax({
      url: this.get('config').url_layer_settings,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(layer),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  removeLayer: function (layer, callback) {
    $.ajax({
      url: this.get('config').url_layer_settings + "/" + layer.id,
      method: 'DELETE',
      contentType: 'application/json',
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  prepareProxyUrl: function (url) {
    return this.get('config').url_proxy ?
      this.get('config').url_proxy + "/" + url.replace(/http[s]?:\/\//, '') :
      url;
  },

  getLayerDescription: function(url, layer, callback) {
    url = this.prepareProxyUrl(url);
    url = url.replace(/wms/, 'wfs');
    $.ajax(url, {
      data: {
        request: 'describeFeatureType',
        outputFormat: 'application/json',
        typename: layer
      },
      success: data => {
        if (data.featureTypes && data.featureTypes[0]) {
          callback(data.featureTypes[0].properties)
        } else {
          callback(false);
        }
      }
    });
  },

  getWMSCapabilities: function (url, callback) {
    $.ajax(this.prepareProxyUrl(url), {
      data: {
        service: 'WMS',
        request: 'GetCapabilities'
      },
      success: data => {
        var response = (new ol.format.WMSCapabilities()).read(data);
        callback(response);
      },
      error: data => {
        callback(false);
      }
    });
  }

});

module.exports = new manager();