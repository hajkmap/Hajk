import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import RateReviewIcon from "@material-ui/icons/RateReview";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import Observer from "react-event-observer";
import Window from "../../components/Window.js";
import Typography from "@material-ui/core/Typography";
import CollectorView from "./CollectorView.js";
import CollectorModel from "./CollectorModel.js";
import { isMobile } from "../../utils/IsMobile.js";

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
      [theme.breakpoints.down("md")]: {
        margin: "5px",
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
      document.getElementById(isMobile ? "app" : "toolbar-panel")
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
            <Typography className={classes.title}>{this.title}</Typography>
            <Typography className={classes.text}>{this.abstract}</Typography>
          </div>
        </div>
        {this.renderWindow("window")}
      </>
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
