import React, { Component } from "react";
import BreadCrumb from "./BreadCrumb.js";
import "./BreadCrumbs.css";

class BreadCrumbs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleLayers: []
    };
  }

  bindLayerEvents = (visibleLayers) => (layer) => {
    if (layer.get('visible')) {
      visibleLayers.push(layer);
    }
    this.setState({
      visibleLayers: visibleLayers
    });
    layer.on('change:visible', (e) => {
      let changedLayer = e.target;
      if (changedLayer.get("visible")) {
        setTimeout(() => this.setState({
          visibleLayers: [...this.state.visibleLayers, changedLayer]
        }), 0);
      } else {
        setTimeout(() => this.setState({
          visibleLayers: this.state.visibleLayers.filter(visibleLayer =>
            visibleLayer !== changedLayer)
        }), 0);
      }
    });
  };

  getVisibleLayers() {
    return this.props.map.getLayers().getArray().filter(layer =>
      layer.getVisible());
  }

  componentDidMount() {
    var visibleLayers = [];
    if (this.props.map) {
      this.props.map.getLayers().getArray().forEach(this.bindLayerEvents(visibleLayers));
    }
  }

  render() {
    return (
      <div className="bread-crumbs">
        <div className="bread-crumb-container">
          {this.state.visibleLayers
            .filter(layer =>
              layer.getProperties().layerInfo
              ? layer.getProperties().layerInfo.layerType !== "base"
              : false
            )
            .map((layer, i) =>
              <BreadCrumb key={i} title={layer.get("caption")} layer={layer}></BreadCrumb>
            )
          }
        </div>
      </div>
    );
  }
}

export default BreadCrumbs;
