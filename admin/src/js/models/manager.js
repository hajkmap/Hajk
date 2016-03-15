
var manager = Backbone.Model.extend({

  defaults: {
    layers: []
  },

  getConfig: function (url) {
    $.ajax(url, {
      success: data => {
        data.layers.sort((a, b) => {
          var d1 = parseInt(a.date)
          ,   d2 = parseInt(b.date);
          return d1 === d2 ? 0 : d1 < d2 ? 1 : -1;
        });
        this.set('layers', data.layers);
      }
    });
  },

  addLayer: function (layer, callback) {
    $.ajax({
      url: "/mapservice/settings/layer",
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
      url: "/mapservice/settings/layer",
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
      url: "/mapservice/settings/layer/" + layer.id,
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

  getLayerDescription: function(url, layer, callback) {
    var url = "/util/proxy/geturl/" + url;
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
    var url = "/util/proxy/geturl/" + url;
    $.ajax(url, {
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