
var menu = Backbone.Model.extend({

  defaults: {
    layers: []
  },

  updateConfig: function(config, callback) {
    $.ajax({
      url: "/mapservice/settings/layermenu",
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

  getConfig: function (url, callback) {
    $.ajax(url, {
      success: data => {
        callback(data);
      }
    });
  }

});

module.exports = new menu();