import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import SatelliteIcon from "@material-ui/icons/Satellite";

import Panel from "../../components/Panel.js";
import InformativeView from "./InformativeView.js";
import InformativeModel from "./InformativeModel.js";
import Observer from "react-event-observer";

const styles = theme => {
  return {
  }
};

class Informative extends Component {

  onClick = (e) => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    });
  };

  open = (chapter) => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    }, () => {
      this.observer.publish('changeChapter', chapter);
    });
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  constructor(spec) {
    super(spec);
    this.position = "right";
    this.type = "informative"
    this.text = "Översiktsplan";
    this.app = spec.app;
    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    this.informativeModel = new InformativeModel({
      map: spec.map,
      app: spec.app,
      observer: this.observer
    });
    this.state = {
      panelOpen: false
    };
    this.app.registerPanel(this);
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
        <InformativeView
          app={this.app}
          map={this.map}
          parent={this}
          observer={this.observer}
        />
      </Panel>,
      document.getElementById("map-overlay")
    );
  }

  renderAsWidgetItem() {
    const {classes} = this.props;
    return (
      <div>
        <Button
          variant="fab"
          color="default"
          aria-label="Översiktsplan"
          className={classes.button}
          onClick={this.onClick}
        >
          <SatelliteIcon />
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
            <SatelliteIcon />
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

export default withStyles(styles)(Informative);
