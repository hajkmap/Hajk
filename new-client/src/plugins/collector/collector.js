import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import RateReviewIcon from "@material-ui/icons/RateReview";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import Observer from "react-event-observer";
import Window from "../../components/Window.js";
import Card from "../../components/Card.js";
import CollectorView from "./CollectorView.js";
import CollectorModel from "./CollectorModel.js";

const styles = theme => {
  return {};
};
class Collector extends Component {
  constructor(props) {
    super(props);
    this.position = "right";
    this.options = props.options;
    this.title = this.options.title || "Tyck till";
    this.abstract = this.options.abstract || "Vi vill veta vad du tycker!";
    this.state = {
      dialogOpen: false
    };
    this.observer = new Observer();
    this.collectorModel = new CollectorModel({
      map: props.map,
      app: props.app,
      observer: this.observer,
      options: props.options
    });
    this.app = props.app;
    this.app.registerPanel(this);
  }

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    });
  };

  minimizePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
    this.observer.publish("abort");
  };

  openPanel = () => {
    this.setState({
      panelOpen: true
    });
  };

  onClose = () => {};

  renderWindow(mode) {
    var left = this.position === "right" ? (window.innerWidth - 410) / 2 : 0;
    return createPortal(
      <Window
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        position={this.position}
        height={450}
        width={400}
        top={210}
        left={left}
        mode={mode}
      >
        <CollectorView
          onClose={this.onClose}
          model={this.collectorModel}
          dialogOpen={this.state.panelOpen}
          minimizePanel={this.minimizePanel}
          openPanel={this.openPanel}
        />
      </Window>,
      document.getElementById("toolbar-panel")
    );
  }

  renderDialog() {
    return createPortal(
      <CollectorView
        onClose={this.onClose}
        model={this.collectorModel}
        dialogOpen={this.state.panelOpen}
      />,
      document.getElementById("map")
    );
  }

  renderAsWidgetItem() {
    return (
      <div>
        <Card
          icon={<RateReviewIcon />}
          onClick={this.onClick}
          title={this.title}
          abstract={this.abstract}
        />
        {this.renderWindow("window")}
      </div>
    );
  }

  renderAsToolbarItem() {
    this.position = undefined;
    return (
      <div>
        <ListItem
          button
          divider={true}
          selected={this.state.panelOpen}
          onClick={this.onClick}
        >
          <ListItemIcon>
            <RateReviewIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
        {this.renderWindow("panel")}
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

export default withStyles(styles)(Collector);
