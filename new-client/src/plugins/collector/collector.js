import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import RateReviewIcon from "@material-ui/icons/RateReview";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import Observer from "react-event-observer";
import Panel from "../../components/Panel.js";
import Typography from "@material-ui/core/Typography";

import CollectorView from "./CollectorView.js";
import CollectorModel from "./CollectorModel.js";

const styles = theme => {
  return {
    button: {
      width: "50px",
      height: "50px",
      marginRight: "30px",
      outline: "none",
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      "&:hover": {
        background: theme.palette.primary.main
      }
    },
    card: {
      cursor: "pointer",
      width: "180px",
      borderRadius: "4px",
      background: "white",
      padding: "10px 20px",
      marginBottom: "10px",
      display: "flex",
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      boxShadow:
        "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
      "&:hover": {
        background: "#e9e9e9"
      },
      [theme.breakpoints.down("xs")]: {
        width: "auto",
        justifyContent: "inherit"
      }
    },
    title: {
      fontSize: "10pt",
      fontWeight: "bold",
      marginBottom: "5px"
    },
    text: {}
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
      <>
        <div className={classes.card} onClick={this.onClick}>
          <div>
            <IconButton className={classes.button}>
              <RateReviewIcon />
            </IconButton>
          </div>
          <div>
            <Typography className={classes.title}>Tyck till</Typography>
            <Typography className={classes.text}>
              Vi vill veta vad du tycker
            </Typography>
          </div>
        </div>
        {this.renderPanel()}
      </>
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
