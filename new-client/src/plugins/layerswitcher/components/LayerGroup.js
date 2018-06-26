import React, { Component } from "react";
import LayerItem from "./LayerItem.js";
import "./LayerGroup.css";

class LayerGroup extends Component {

  constructor() {
    super();
    this.state = {
      expanded: false,
      groups: [],
      layers: [],
      name: "",
      parent: "-1",
      toggled: false
    };
  }

  componentWillMount() {
    this.setState({
      ...this.state,
      ...this.props.group
    });
    this.model = this.props.model;
  };

  renderLayerGroups() {
    return this.state.groups.map((group, i) => {
      return (
        <LayerGroup key={i} group={group} model={this.model} />
      );
    });
  }

  render() {
    return (
      <div>
        <h1>{this.state.name}</h1>
        {this.state.layers.map((layer, i) => {
          var mapLayer = this.model.layerMap[Number(layer.id)];
          if (mapLayer) {
            return (<LayerItem key={i} layer={mapLayer} />);
          } else {
            return null;
          }
        })}
        {this.renderLayerGroups()}
      </div>
    )
  }
}

export default LayerGroup;
