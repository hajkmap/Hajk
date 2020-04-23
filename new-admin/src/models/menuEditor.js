import { Model } from "backbone";

var menuEditor = Model.extend({
  loadMapSettings: function(map, callback) {
    var url = this.get("config").url_map + "/" + map;
    fetch(url, { credentials: "same-origin" }).then(response => {
      response.json().then(data => {
        callback(data.map);
      });
    });
  }
});

export default menuEditor;
