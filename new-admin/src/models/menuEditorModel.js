import { Model } from "backbone";

var menuEditorModel = Model.extend({
  constructor: function(settings) {
    this.config = settings.config;
  },

  loadMenuConfigForMap: function(map) {
    var url = this.config.url_map + "/" + map;
    return fetch(url, { credentials: "same-origin" }).then(response => {
      return response.json().then(data => {
        let documentHandler = data.tools.find(tool => {
          return tool.type === "documenthandler";
        });

        return documentHandler.options.menuConfig.menu;
      });
    });
  }
});

export default menuEditorModel;
