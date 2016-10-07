
var manager = Backbone.Model.extend({

  defaults: {
    layers: []
  },

  getUrl: function (layer) {
    var t = layer['type'];
    delete layer['type'];
    return t === 'WMTS'
      ? this.get('config').url_wmtslayer_settings
      : this.get('config').url_layer_settings
  },

  getConfig: function (url) {
    $.ajax(url, {
      success: data => {
        var layers = [];
        data.wmslayers.forEach(l => { l.type = "WMS" });
        data.wmtslayers.forEach(l => { l.type = "WMTS" });
        layers = data.wmslayers.concat(data.wmtslayers);
        layers.sort((a, b) => {
          var d1 = parseInt(a.date)
          ,   d2 = parseInt(b.date);
          return d1 === d2 ? 0 : d1 < d2 ? 1 : -1;
        });

        this.set('layers', layers);
      }
    });
  },

  addLayer: function (layer, callback) {
    var url = this.getUrl(layer);
    $.ajax({
      url: url,
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
    var url = this.getUrl(layer);
    $.ajax({
      url: url,
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
    var url = this.getUrl(layer);
    $.ajax({
      url: url + "/" +layer.id,
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