import React, { Component } from "react";
import Observer from "react-event-observer";
import LayerSwitcherModel from "./model.js";
import LayerItem from "./components/LayerItem.js";
import { createPortal } from "react-dom";
import "./style.css";

class LayersSwitcher extends Component {
  constructor() {
    super();
    this.toggle = this.toggle.bind(this);
    this.state = {
      toggled: false,
      layers: []
    };
  }

  componentDidMount() {
    this.observer = Observer();
    this.observer.subscribe("layerAdded", layer => {
      this.setState({
        layers: [...this.state.layers, layer]
      });
    });
    this.layerSwitcherModel = new LayerSwitcherModel({
      map: this.props.tool.map,
      app: this.props.tool.app,
      observer: this.observer
    });
    this.props.tool.instance = this;
  }

  open() {
    this.setState({
      toggled: true
    });
  }

  close() {
    this.setState({
      toggled: false
    });
  }

  minimize() {
    this.setState({
      toggled: false
    });
  }

  toggle() {
    this.setState({
      toggled: !this.state.toggled
    });
    this.props.tool.app.togglePlugin("layerswitcher");
  }

  getActiveClass() {
    return this.state.toggled
      ? "tool-toggle-button active"
      : "tool-toggle-button";
  }

  getVisibilityClass() {
    return this.state.toggled ? "tool-panel" : "tool-panel hidden";
  }

  renderLayers() {
    return this.state.layers.map((layer, i) => {
      return <LayerItem key={i} layer={layer} />;
    });
  }

  renderPanel() {
    return createPortal(
      <div className={this.getVisibilityClass()}>
        <div>{this.renderLayers()}</div>
      </div>,
      document.getElementById("map")
    );
  }

  render() {
    return (
      <div>
        <div className={this.getActiveClass()} onClick={this.toggle}>
          Lagermeny
        </div>
        {this.renderPanel()}
      </div>
    );
  }
}

export default LayersSwitcher;
