import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import StreetviewIcon from "@material-ui/icons/Streetview";
import { IconButton } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import StreetViewView from "./StreetViewView";
import StreetViewModel from "./StreetViewModel";
import Observer from "react-event-observer";
import Window from "../../components/Window.js";

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

class StreetView extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart,
    top: 0
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState(
      {
        panelOpen: true
      },
      () => this.streetViewModel.activate()
    );
  };

  closePanel = () => {
    this.setState(
      {
        panelOpen: false,
        displayPanorama: false
      },
      () => this.streetViewModel.deactivate()
    );
  };

  constructor(props) {
    super(props);
    this.options = props.options;
    this.position = props.options.panel ? props.options.panel : undefined;
    this.title = this.options.title || "Gatuvy";
    this.abstract =
      this.options.abstract || "Titta hur området ser ut från gatan";
    this.app = props.app;

    this.localObserver = Observer();
    this.streetViewModel = new StreetViewModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver,
      apiKey: props.options.apiKey
    });
    this.app.registerPanel(this);
    this.localObserver.on("locationChanged", () => {
      this.setState({
        displayPanorama: true
      });
    });
  }
  renderWindow(mode) {
    let left = this.position === "right" ? (window.innerWidth - 410) / 2 : 5;

    return createPortal(
      <Window
        globalObserver={this.props.app.globalObserver}
        localObserver={this.localObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        maximized={this.state.windowMaximized}
        position={this.position}
        height={300}
        width={420}
        top={210}
        left={left}
        mode={mode}
        onResize={e => {
          this.streetViewModel.showLocation();
        }}
      >
        <StreetViewView
          localObserver={this.localObserver}
          model={this.streetViewModel}
          parent={this}
          displayPanorama={this.state.displayPanorama}
        />
      </Window>,
      document.getElementById("windows-container")
    );
  }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.card} onClick={this.onClick}>
          <div>
            <IconButton className={classes.button}>
              <StreetviewIcon />
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
    return (
      <div>
        <ListItem
          button
          divider={true}
          selected={this.state.panelOpen}
          onClick={e => {
            e.preventDefault();
            this.onClick(e);
          }}
        >
          <ListItemIcon>
            <StreetviewIcon />
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

export default withStyles(styles)(StreetView);
