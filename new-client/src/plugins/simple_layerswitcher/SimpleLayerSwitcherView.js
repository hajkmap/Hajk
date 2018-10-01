import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import LayerGroup from "./components/LayerGroup.js";
import BreadCrumbs from "./components/BreadCrumbs.js";
import "./style.css";

const styles = theme => ({
  button: {
    margin: theme.spacing.unit
  },
  leftIcon: {
    marginRight: theme.spacing.unit
  },
  rightIcon: {
    marginLeft: theme.spacing.unit
  },
  iconSmall: {
    fontSize: 20
  }
});

class SimpleLayersSwitcherView extends Component {
  constructor(props) {
    super(props);
    this.options = this.props.app.config.mapConfig.tools.find(
      t => t.type === "layerswitcher"
    ).options;
    this.state = {
      layerGroupsExpanded: true
    };
  }

  componentDidMount() {}

  componentWillMount() {}

  handleChange = panel => (event, expanded) => {
    this.setState({
      expanded: expanded ? panel : false
    });
  };

  renderLayerGroups() {
    const { expanded } = this.state;
    return this.options.groups.map((group, i) => {
      return (
        <LayerGroup
          expanded={expanded === group.id}
          key={i}
          group={group}
          model={this.props.model}
          handleChange={this.handleChange}
          app={this.props.app}
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
      <BreadCrumbs map={this.props.map} />,
      document.getElementById("map")
    );
  }

  render() {
    return (
      <div>
        <div className="tool-panel-content">
          <div className={this.getLayerGroupsClass()}>
            {this.renderLayerGroups()}
          </div>
        </div>
        {this.renderBreadCrumbs()}
      </div>
    );
  }
}

export default withStyles(styles)(SimpleLayersSwitcherView);
