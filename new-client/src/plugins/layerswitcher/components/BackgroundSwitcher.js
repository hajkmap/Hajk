import React, { Component } from "react";
import "./BackgroundSwitcher.css";

class BackgroundSwitcher extends Component {
  
  renderBaseLayerComponents() {
    return this.props.layers.map((layerConfig, i) => {      
      var mapLayer = this.props.layerMap[Number(layerConfig.id)];
      if (mapLayer) {
        let caption = mapLayer.get('layerInfo').caption;
        return (
          <div key={i}>{caption}</div>
        );
      } else {
        return null;
      }
    });
  }

  render() {
  	return (
      <div>
    		<h1>Bakgrundskartor</h1>
        {this.renderBaseLayerComponents()}
      </div>
    );
  }
}

export default BackgroundSwitcher;
