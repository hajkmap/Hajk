import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Observer from "react-event-observer";
import AppModel from "./../models/AppModel.js";
import Toolbar from "./Toolbar.js";
import Popup from "./Popup.js";
import "./App.css";

import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";

const styles = theme => ({
  map: {
    flexGrow: 1,
    zIndex: 1,
    overflow: "hidden",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex"
  },
  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: 240,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  }
});

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
      .loadPlugins(this.props.activeTools, plugin => {});

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

  getTheme = () => {
    // primary: blue // <- Can be done like this (don't forget to import blue from "@material-ui/core/colors/blue"!)
    // secondary: { main: "#11cb5f" } // <- Or like this
    return createMuiTheme({
      palette: {
        primary: { main: this.props.config.mapConfig.map.colors.primaryColor },
        secondary: {
          main: this.props.config.mapConfig.map.colors.secondaryColor
        }
      },
      overrides: {
        MuiListItemIcon: {
          // Name of the component / style sheet
          root: {
            // Name of the rule
            color: { main: this.props.config.mapConfig.map.colors.primaryColor } // Some CSS
          }
        }
      }
    });
  };

  renderWidgets() {
    if (this.state.tools) {
      return this.state.tools
        .filter(tool => tool.options.target !== "toolbar")
        .map((tool, i) => {
          console.log("Will render this to Widgets:", tool);

          return <tool.component key={i} tool={tool} />;
        });
    } else {
      return null;
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <MuiThemeProvider theme={this.getTheme()}>
        <main className={classes.map} id="map">
          <Toolbar tools={this.appModel.getToolbarPlugins()} />
          <Popup
            mapClickDataResult={this.state.mapClickDataResult}
            map={this.appModel.getMap()}
          />
          <div id="widgets">{this.renderWidgets()}</div>
        </main>
      </MuiThemeProvider>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(App);
