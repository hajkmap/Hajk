import React, { Component } from "react";
import "./BackgroundSwitcher.css";

class BackgroundSwitcher extends Component {

  constructor() {
    super();
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    console.log("Change", e, this);
  }

  componentWillMount() {
    //var checkedLayer = -1;
    //console.log("Layers", this.props.layers);
    //var visibleLayers = this.props.layers.filter(layer => layer.get('visible'));
    //console.log("Visible layers", visibleLayers);
  }

  renderBaseLayerComponents() {
    return this.props.layers.map((layerConfig, i) => {
      var mapLayer = this.props.layerMap[Number(layerConfig.id)];
      if (mapLayer) {
        let caption = mapLayer.get('layerInfo').caption;
        return (
          <div key={i}>
            <input onChange={this.onChange} id={caption + "_" + i} type="radio" name="background"></input>
            <label htmlFor={caption + "_" + i}>{caption}</label>
          </div>
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
        <div>
          <input checked onChange={this.onChange} id="layer_-1" type="radio" name="background"></input>
          <label htmlFor="layer_-1">Ingen bakgrundkarta</label>
        </div>
        {this.renderBaseLayerComponents()}
      </div>
    );
  }
}

export default BackgroundSwitcher;
