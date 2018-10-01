import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import LayersIcon from "@material-ui/icons/Layers";

import Panel from "../../components/Panel.js";
import SimpleLayerSwitcherView from "./SimpleLayerSwitcherView.js";
import SimpleLayerSwitcherModel from "./SimpleLayerSwitcherModel.js";
import Observer from "react-event-observer";

const styles = theme => {
  return {
    button: {
      width: "50px",
      height: "50px",
      outline: "none",
      marginBottom: "10px"
    }
  };
};

class SimpleLayerSwitcher extends Component {
  state = {
    panelOpen: false
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    });
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  constructor(spec) {
    super(spec);
    this.text = "Innehåll";
    this.app = spec.app;
    this.observer = Observer();
    this.observer.subscribe("layerAdded", layer => {});
    this.simpleLayerSwitcherModel = new SimpleLayerSwitcherModel({
      map: spec.map,
      app: spec.app,
      observer: this.observer
    });
    this.app.registerPanel(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.panelOpen !== nextState.panelOpen;
  }

  componentWillMount() {
    this.setState({
      panelOpen: this.props.options.visibleAtStart
    });
  }

  renderPanel() {
    return createPortal(
      <Panel
        title={this.text}
        onClose={this.closePanel}
        position={this.position}
        open={this.state.panelOpen}
      >
        <SimpleLayerSwitcherView
          app={this.props.app}
          map={this.props.map}
          model={this.simpleLayerSwitcherModel}
          observer={this.observer}
        />
      </Panel>,
      document.getElementById("map-overlay")
    );
  }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <div>
        <Button
          variant="fab"
          color="default"
          aria-label="Översiktsplan"
          className={classes.button}
          onClick={this.onClick}
        >
          <LayersIcon />
        </Button>
        {this.renderPanel()}
      </div>
    );
  }

  renderAsToolbarItem() {
    return (
      <div>
        <ListItem
          button
          divider={true}
          selected={this.state.panelOpen}
          onClick={this.onClick}
        >
          <ListItemIcon>
            <LayersIcon />
          </ListItemIcon>
          <ListItemText primary={this.text} />
        </ListItem>
        {this.renderPanel()}
      </div>
    );
  }

  render() {
    if (this.props.type === "toolbarItem") {
      return this.renderAsToolbarItem();
    }

    if (this.props.type === "widgetItem") {
      return this.renderAsWidgetItem();
    }

    return null;
  }
}

export default withStyles(styles)(SimpleLayerSwitcher);
