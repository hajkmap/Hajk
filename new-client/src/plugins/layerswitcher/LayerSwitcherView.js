import React from "react";
import Observer from "react-event-observer";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";

import BackgroundSwitcher from "./components/BackgroundSwitcher.js";
import MapSwitcher from "./components/MapSwitcher.js";
import LayerGroup from "./components/LayerGroup.js";

import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";

import "./style.css";

const styles = theme => ({
  drawerPaper: {
    left: "72px",
    width: "500px",
    zIndex: theme.zIndex.drawer - 1
  }
});
class LayersSwitcherView extends React.PureComponent {
  state = {
    layerGroupsExpanded: true
  };

  options = {
    baselayers: [],
    groups: []
  };

  componentWillMount() {
    this.options = this.props.parent.props.options;
    this.observer = Observer();
    this.observer.subscribe("layerAdded", layer => {});
  }

  renderLayerGroups() {
    return this.options.groups.map((group, i) => {
      return (
        <LayerGroup
          key={i}
          group={group}
          model={this.props.parent.layerSwitcherModel}
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

  getToggleIcon() {
    return this.state.layerGroupsExpanded ? (
      <ExpandLessIcon />
    ) : (
      <ChevronRightIcon />
    );
  }

  hideAllLayers() {
    // FIXME: Implement
    console.log("Will hide all layers");
  }

  renderPanel() {
    return (
      <div className="tool-panel-content">
        <MapSwitcher
          options={this.options}
          observer={this.observer}
          appConfig={this.props.app.config.appConfig}
        />
        <BackgroundSwitcher
          layers={this.options.baselayers}
          layerMap={this.props.parent.layerSwitcherModel.layerMap}
        />
        <h1
          onClick={() => {
            this.toggleLayerGroups();
          }}
          className="clickable"
        >
          {this.getToggleIcon()}
          Kartlager
        </h1>
        <div className={this.getLayerGroupsClass()}>
          {this.renderLayerGroups()}
        </div>
      </div>
    );
  }

  render() {
    return this.renderPanel();
  }
}

LayersSwitcherView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(LayersSwitcherView);
