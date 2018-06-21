import React, { Component } from "react";
import "./BackgroundSwitcher.css";

class BackgroundSwitcher extends Component {
  render() {
    return this.props.layers.map((layer, i) => {
      var mapLayer = {
        ...layer,
        ...this.props.layerMap[Number(layer.id)]
      };
      return <div key={i}>{mapLayer.caption}</div>;
    });
  }
}

export default BackgroundSwitcher;
