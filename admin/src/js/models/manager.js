
var manager = Backbone.Model.extend({

  defaults: {
    layers: []
  },

  getConfig: function (url) {
    $.ajax(url, {
      success: data => {
        this.set('layers', data.layers);
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