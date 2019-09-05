import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import { IconButton } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import DrawIcon from "@material-ui/icons/Edit";
import DrawView from "./DrawView";
import DrawModel from "./DrawModel";
import Observer from "react-event-observer";
import Window from "../../components/Window.js";
import "./draw.css";

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

class Draw extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    });
    this.drawModel.setActive(true);
    this.drawModel.setDrawMethod();
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
    this.drawModel.setActive(false);
  };

  constructor(props) {
    super(props);
    this.options = props.options;
    this.title = this.options.title || "Rita";
    this.abstract =
      this.options.abstract || "Rita, mät, importera och exportera";
    this.app = props.app;
    this.localObserver = Observer();
    this.drawModel = new DrawModel({
      map: props.map,
      app: props.app,
      options: props.options,
      localObserver: this.localObserver
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
        height={window.innerHeight - 380 + "px"}
        width="400px"
        top={145}
        left={5}
        mode={mode}
      >
        <DrawView
          localObserver={this.localObserver}
          model={this.drawModel}
          parent={this}
          open={this.state.panelOpen}
        />
      </Window>,
      document.getElementById("windows-container")
    );
  }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <div>
        <div className={classes.card} onClick={this.onClick}>
          <div>
            <IconButton className={classes.button}>
              <DrawIcon />
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
          onClick={e => {
            e.preventDefault();
            this.onClick(e);
          }}
        >
          <ListItemIcon>
            <DrawIcon />
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

export default withStyles(styles)(Draw);
