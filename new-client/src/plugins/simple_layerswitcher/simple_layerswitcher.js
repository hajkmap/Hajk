import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import LayersIcon from "@material-ui/icons/Layers";
import Typography from "@material-ui/core/Typography";
import Panel from "../../components/Panel.js";
import SimpleLayerSwitcherView from "./SimpleLayerSwitcherView.js";
import SimpleLayerSwitcherModel from "./SimpleLayerSwitcherModel.js";
import Observer from "react-event-observer";

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
        justifyContent: "inherit",
        marginBottom: "20px"
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
      <>
        <div className={classes.card} onClick={this.onClick}>
          <div>
            <IconButton className={classes.button}>
              <LayersIcon />
            </IconButton>
          </div>
          <div>
            <Typography className={classes.title}>Innehåll</Typography>
            <Typography className={classes.text}>
              Välj vad du vill se i kartan
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
