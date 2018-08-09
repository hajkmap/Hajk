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
  }

  renderLayerGroups() {
    return this.state.groups.map((group, i) => {
      return <LayerGroup key={i} group={group} model={this.model} />;
    });
  }

  toggleExpanded() {
    this.setState({ expanded: !this.state.expanded });
  }

  getExpandedClass() {
    return this.state.expanded
      ? "layer-group-items visible"
      : "layer-group-items hidden";
  }

  getArrowClass() {
    return this.state.expanded
      ? "fa fa-angle-up arrow"
      : "fa fa-angle-right arrow";
  }

  render() {
    return (
      <div className="layer-group">
        <h1
          onClick={() => {
            this.toggleExpanded();
          }}
          className="clickable"
        >
          <i className={this.getArrowClass()} />
          {this.state.name}
        </h1>
        <div className={this.getExpandedClass()}>
          {this.state.layers.map((layer, i) => {
            var mapLayer = this.model.layerMap[Number(layer.id)];
            if (mapLayer) {
              return <LayerItem key={i} layer={mapLayer} />;
            } else {
              return null;
            }
          })}
          {this.renderLayerGroups()}
        </div>
      </div>
    );
  }
}

export default LayerGroup;
