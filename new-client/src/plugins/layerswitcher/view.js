import React, { Component } from "react";
import Observer from "react-event-observer";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";

import LayerSwitcherModel from "./model.js";
import BackgroundSwitcher from "./components/BackgroundSwitcher.js";
import MapSwitcher from "./components/MapSwitcher.js";
import LayerGroup from "./components/LayerGroup.js";
import PanelHeader from "../../components/PanelHeader.js";

import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer
} from "@material-ui/core";
import LayersIcon from "@material-ui/icons/Layers";
import "./style.css";

const styles = theme => ({
  drawerPaper: {
    left: "72px",
    width: "500px",
    zIndex: theme.zIndex.drawer - 1
  }
});
class LayersSwitcher extends Component {
  state = {
    toggled: false,
    layerGroupsExpanded: true
  };

  options = {
    baselayers: [],
    groups: []
  };

  componentWillMount() {
    this.observer = Observer();
    this.observer.subscribe("layerAdded", layer => {});
    this.layerSwitcherModel = new LayerSwitcherModel({
      map: this.props.tool.map,
      app: this.props.tool.app,
      observer: this.observer
    });
    this.props.tool.instance = this;
  }

  componentDidMount() {
    this.options = this.props.tool.options;
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

  toggle = () => {
    this.setState({
      toggled: !this.state.toggled
    });
    this.props.tool.app.togglePlugin("layerswitcher");
  };

  getActiveClass() {
    return this.state.toggled
      ? "tool-toggle-button active"
      : "tool-toggle-button";
  }

  getVisibilityClass() {
    return this.state.toggled
      ? "tool-panel layerswitcher-panel"
      : "tool-panel layerswitcher-panel hidden";
  }

  renderLayerGroups() {
    return this.options.groups.map((group, i) => {
      return (
        <LayerGroup key={i} group={group} model={this.layerSwitcherModel} />
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

  renderPanel() {
    const { toggled } = this.state;
    const { classes } = this.props;
    return createPortal(
      <Drawer
        variant="persistent"
        anchor="left"
        open={toggled}
        classes={{ paper: classes.drawerPaper }}
      >
        <PanelHeader
          title="Lagerhanterare"
          hideAllLayersButton={this.options.toggleAllButton}
          hideAllLayers={this.hideAllLayers}
          toggle={this.toggle}
        />
        <div className="tool-panel-content">
          <MapSwitcher
            options={this.options}
            observer={this.observer}
            appConfig={this.props.tool.app.config.appConfig}
          />
          <BackgroundSwitcher
            layers={this.options.baselayers}
            layerMap={this.layerSwitcherModel.layerMap}
          />
          <h1
            onClick={() => {
              this.toggleLayerGroups();
            }}
            className="clickable"
          >
            <i className="material-icons">{this.getArrowClass()}</i>
            Kartlager
          </h1>
          <div className={this.getLayerGroupsClass()}>
            {this.renderLayerGroups()}
          </div>
        </div>
      </Drawer>,
      document.getElementById("map")
    );
  }

  isToolActive = () => (this.state.toggled ? true : false);

  render() {
    return (
      <div>
        <ListItem button onClick={this.toggle} selected={this.isToolActive()}>
          <ListItemIcon>
            <LayersIcon />
          </ListItemIcon>
          <ListItemText primary="Lagerhanterare" />
        </ListItem>
        {this.renderPanel()}
      </div>
    );
  }
}

LayersSwitcher.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(LayersSwitcher);
