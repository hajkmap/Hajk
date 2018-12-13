import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import SatelliteIcon from "@material-ui/icons/Satellite";
import Typography from "@material-ui/core/Typography";

import Panel from "../../components/Panel.js";
import InformativeView from "./InformativeView.js";
import InformativeModel from "./InformativeModel.js";
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

class Informative extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    });
  };

  open = chapter => {
    this.app.onPanelOpen(this);
    this.setState(
      {
        panelOpen: true
      },
      () => {
        this.observer.publish("changeChapter", chapter);
      }
    );
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  constructor(spec) {
    super(spec);
    this.type = "informative";
    this.text = spec.options.caption;
    this.position = spec.options.panel || "right";
    this.app = spec.app;
    this.observer = Observer();
    this.informativeModel = new InformativeModel({
      map: spec.map,
      app: spec.app,
      observer: this.observer,
      url: spec.options.serviceUrl + "/" + spec.options.document
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
        <InformativeView
          app={this.app}
          map={this.map}
          parent={this}
          observer={this.observer}
          caption={this.props.options.caption}
          abstract={this.props.options.abstract}
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
              <SatelliteIcon />
            </IconButton>
          </div>
          <div>
            <Typography className={classes.title}>Översiktsplan</Typography>
            <Typography className={classes.text}>
              Läs om vad som planeras i kommunen
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
