import React, { Component } from "react";
import Observer from "react-event-observer";
import { createPortal } from "react-dom";
import LayerSwitcherModel from "./model.js";
import LayerGroup from "./components/LayerGroup.js";
import BreadCrumbs from "./components/BreadCrumbs.js";
import PanelHeader from "../../components/PanelHeader.js";

import "./style.css";

class LayersSwitcher extends Component {
  constructor() {
    super();
    this.options = {
      baselayers: [],
      groups: []
    };
    this.toggle = this.toggle.bind(this);
    this.state = {
      toggled: false,
      layerGroupsExpanded: true
    };
  }

  componentWillMount() {
    this.observer = Observer();
    this.observer.subscribe("layerAdded", layer => {});
    this.layerSwitcherModel = new LayerSwitcherModel({
      map: this.props.map,
      app: this.props.app,
      observer: this.observer
    });
    this.options = this.props.app.config.mapConfig.tools.find(
      t => t.type === "layerswitcher"
    ).options;
  }

  componentDidMount() {}

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
  }

  getActiveClass() {
    var activeClass = "tool-toggle-button active";
    var inactiveClass = "tool-toggle-button";
    return this.state.toggled
      ? activeClass
      : inactiveClass;
  }

  getVisibilityClass() {
    return this.state.toggled
      ? "tool-panel layerswitcher-panel"
      : "tool-panel layerswitcher-panel hidden";
  }

  handleChange = panel => (event, expanded) => {
    this.setState({
      expanded: expanded ? panel : false,
    });
  };

  renderLayerGroups() {
    const { expanded } = this.state;
    return this.options.groups.map((group, i) => {
      return (
        <LayerGroup expanded={expanded === group.id} key={i} group={group} model={this.layerSwitcherModel}
          handleChange={this.handleChange}
        />
      );
    });
  }

  getLayerGroupsClass() {
    return this.state.layerGroupsExpanded
      ? "layer-groups visible"
      : "layer-groups hidden";
  }

  toggleLayerGroups() {
    this.setState({
      layerGroupsExpanded: !this.state.layerGroupsExpanded
    });
  }

  getArrowClass() {
    return this.state.layerGroupsExpanded ? "expand_less" : "chevron_right";
  }

  hideAllLayers() {
    console.log("will hide all layers");
  }

  renderBreadCrumbs() {
    return createPortal(
      <BreadCrumbs map={this.props.map}></BreadCrumbs>,
      document.getElementById("map")
    );
  }

  renderPanel() {
    return (
      <div className="tool-panel-content">
        <div className={this.getLayerGroupsClass()}>
          {this.renderLayerGroups()}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderPanel()}
        {this.renderBreadCrumbs()}
      </div>
    );
  }
}

export default LayersSwitcher;