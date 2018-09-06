import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";

import Observer from "react-event-observer";
import AppModel from "./../models/AppModel.js";
import Toolbar from "./Toolbar.js";
import Popup from "./Popup.js";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import { Toolbar as MUIToolbar } from "@material-ui/core";

import "./App.css";

// 'const styles' is to be seen as a replacement of App.css only.
// Global customizations that previously went to custom.css
// should now go to public/customTheme.json. They are later
// merged when MUI Theme is created in index.js.
const styles = theme =>
  console.log("Theme object:", theme) || {
    // We can also consult https://material-ui.com/customization/default-theme/ for available options
    map: {
      flexGrow: 1,
      zIndex: 1,
      overflow: "hidden",
      position: "absolute",
      top: 64,
      bottom: 0,
      left: 0,
      right: 0
    },
    flex: {
      flexGrow: 1
    },
    overlay: {
      position: 'absolute',
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      height: '100%'
    }
  };

class App extends Component {
  constructor() {
    super();
    this.state = {
      mapClickDataResult: {}
    };
  }

  componentWillMount() {
    this.observer = new Observer();
    this.appModel = new AppModel(this.props.config, this.observer);
  }

  componentDidMount() {
    var promises = this.appModel
      //.configureApplication() // TODO: Remove, along with dependencies (look inside to see which files can be removed)
      .createMap()
      .addLayers()
      .loadPlugins(this.props.activeTools);

    Promise.all(promises).then(() => {
      this.setState({
        tools: this.appModel.getPlugins()
      });
    });

    this.observer.subscribe("mapClick", mapClickDataResult => {
      this.setState({
        mapClickDataResult: mapClickDataResult
      });
    });
  }

  renderWidgets(target) {
    const { classes } = this.props;
    if (this.state.tools) {
      return this.state.tools
        .filter(tool => tool.options.target === target)
        .map((tool, i) => {
          if (tool.type === "layerswitcher" && !tool.options.active) {
            return null;
          }
          return (
            <div key={i}>
              <Button
                variant="fab"
                color="default"
                aria-label="Verktyg"
                className={classes.button}
                onClick={(e) => {
                  tool.onClick(e, this);
                }}>
                {tool.getButton()}
              </Button>
              {tool.getPanel(this.state.activePanel)}
            </div>
          );
        });
    } else {
      return null;
    }
  }

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <AppBar position="absolute">
          <MUIToolbar>
            <Toolbar tools={this.appModel.getToolbarPlugins()} parent={this} />
            <Typography
              variant="title"
              color="inherit"
              className={classes.flex}
            >
              Hajkmap 3.0
            </Typography>
            <Button color="inherit">Inloggad användare</Button>
          </MUIToolbar>
        </AppBar>
        <main className={classes.map} id="map">
          <Popup
            mapClickDataResult={this.state.mapClickDataResult}
            map={this.appModel.getMap()}
          />
          <div className="widgets left">{this.renderWidgets("left")}</div>
          <div className="widgets right">{this.renderWidgets("right")}</div>
          <div id="map-overlay" className={classes.overlay}></div>
        </main>
      </div>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(App);
