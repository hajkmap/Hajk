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
      map: this.props.tool.map,
      app: this.props.tool.app,
      observer: this.observer
    });
    this.props.tool.instance = this;
    this.options = this.props.tool.app.config.mapConfig.tools.find(
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
    const customClass = "layerswitcher-";
    var activeClass = "tool-toggle-button active";
    var inactiveClass = "tool-toggle-button active";  
    if (this.props.tool.target !== "toolbar") {
      activeClass = customClass + activeClass;
      inactiveClass = customClass + inactiveClass;
    }
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
      <BreadCrumbs map={this.props.tool.map}></BreadCrumbs>,
      document.getElementById("map")
    );
  }

  renderPanel() {
    return createPortal(
      <div className={this.getVisibilityClass()}>
        <PanelHeader
          title="Innehåll"
          hideAllLayersButton={this.options.toggleAllButton}
          hideAllLayers={this.hideAllLayers}
          toggle={this.toggle}
        />
        <div className="tool-panel-content">          
          <div className={this.getLayerGroupsClass()}>
            {this.renderLayerGroups()}
          </div>
        </div>
      </div>,
      document.getElementById("map")
    );
  }

  render() {
    return (
      <div>
        <div className={this.getActiveClass()} onClick={this.toggle}>
          <i className="material-icons">layers</i>&nbsp;
          <i className="tool-text">Visa innehåll</i>
        </div>
        {this.renderPanel()}
        {this.renderBreadCrumbs()}
      </div>
    );
  }
}

export default LayersSwitcher;