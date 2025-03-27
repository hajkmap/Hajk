import React from "react";
import { Component } from "react";

class Map extends Component {
  constructor() {
    super();
  }

  load() {
    if (!HAJK2) return;

    HAJK2.wmsProxy = "";
    HAJK2.searchProxy = "/postProxy.aspx?url=";

    HAJK2.start(
      {
        configPath: "/mapservice/settings/config/map_1",
        layersPath: "/mapservice/settings/config/layers",
      },
      function (status, message) {
        if (!status) {
          document.write(message);
        }
      }
    );
  }

  render() {
    return (
      <div>
        <div
          id="map"
          style={{ position: "absolute", height: "600px", width: "100%" }}
        />
        <div> {this.load()} </div>
      </div>
    );
  }
}

export default Map;
