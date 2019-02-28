import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import LayersIcon from "@material-ui/icons/Layers";
import Typography from "@material-ui/core/Typography";
import Window from "../../components/Window.js";
import SimpleLayerSwitcherView from "./SimpleLayerSwitcherView.js";
import SimpleLayerSwitcherModel from "./SimpleLayerSwitcherModel.js";
import Observer from "react-event-observer";
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
        width: "auto",
        justifyContent: "inherit",
        margin: "5px",
        marginBottom: "10px"
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

class SimpleLayerSwitcher extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
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
    this.app = spec.app;
    this.options = spec.options;
    this.title = this.options.title || "Innehåll";
    this.abstract = this.options.abstract || "Välj vad du vill se i kartan";
    this.observer = Observer();
    this.observer.subscribe("layerAdded", layer => {});
    this.simpleLayerSwitcherModel = new SimpleLayerSwitcherModel({
      map: spec.map,
      app: spec.app,
      observer: this.observer
    });
    this.app.registerPanel(this);
  }

  renderWindow(mode) {
    return createPortal(
      <Window
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        width="400px"
        height={window.innerHeight - 380 + "px"}
        top={210}
        left={5}
        mode={mode}
      >
        <SimpleLayerSwitcherView
          app={this.props.app}
          map={this.props.map}
          model={this.simpleLayerSwitcherModel}
          observer={this.observer}
          breadCrumbs={this.props.type === "widgetItem"}
        />
      </Window>,
      document.getElementById(isMobile ? "app" : "toolbar-panel")
    );
  }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <div>
        <div className={classes.card} onClick={this.onClick}>
          <div>
            <IconButton className={classes.button}>
              <LayersIcon />
            </IconButton>
          </div>
          <div>
            <Typography className={classes.title}>{this.title}</Typography>
            <Typography className={classes.text}>{this.abstract}</Typography>
          </div>
        </div>
        {this.renderWindow("window")}
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

export default withStyles(styles)(SimpleLayerSwitcher);
