
var menu = Backbone.Model.extend({

  defaults: {
    layers: [],
    addedLayers: []
  },

  updateConfig: function(config, callback) {
    $.ajax({
      url: this.get('config').url_layermenu_settings,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(config),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  findLayerInConfig: function (id) {

    var layer = false;

    function findInGroups(groups, layerId) {
      groups.forEach(group => {
        var found = group.layers.find(l => l.id === layerId);
        if (found) {
          layer = found;
        }
        if (group.hasOwnProperty('groups')) {
          findInGroups(group.groups, layerId)
        }
      });
    }

    findInGroups(this.get('layerMenuConfig').groups, id);

    return layer;
  },

  getConfig: function (url, callback) {
    $.ajax(url, {
      success: data => {
        callback(data);
      }
    });
  }

});

module.exports = new menu();