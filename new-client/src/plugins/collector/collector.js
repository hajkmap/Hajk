import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import RateReviewIcon from "@material-ui/icons/RateReview";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import Observer from "react-event-observer";
import Panel from "../../components/Panel.js";
import Tooltip from "@material-ui/core/Tooltip";

import CollectorView from "./CollectorView.js";
import CollectorModel from "./CollectorModel.js";

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

class Collector extends Component {
  constructor(props) {
    super(props);
    this.text = "Tyck till";
    this.position = "right";
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
  }

  componentWillMount() {}

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

  openPanel = () => {
    this.setState({
      panelOpen: true
    });
  };

  onClose = () => {};

  renderPanel() {
    return createPortal(
      <Panel
        title={this.text}
        onClose={this.closePanel}
        position={this.position}
        open={this.state.panelOpen}
      >
        <CollectorView
          onClose={this.onClose}
          model={this.collectorModel}
          dialogOpen={this.state.panelOpen}
          closePanel={this.closePanel}
          openPanel={this.openPanel}
        />
      </Panel>,
      document.getElementById("map-overlay")
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
    const { classes } = this.props;
    return (
      <div>
        <Tooltip title="Tyck till">
          <Button
            variant="fab"
            color="primary"
            aria-label="Infomation"
            className={classes.button}
            onClick={this.onClick}
          >
            <RateReviewIcon />
          </Button>
        </Tooltip>
        {this.renderPanel()}
      </div>
    );
  }

  renderAsToolbarItem() {
    return (
      <div>
        <ListItem button divider={true} selected={false} onClick={this.onClick}>
          <ListItemIcon>
            <RateReviewIcon />
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

export default withStyles(styles)(Collector);
