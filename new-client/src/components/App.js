import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Observer from "react-event-observer";
import AppModel from "./../models/AppModel.js";
import Toolbar from "./Toolbar.js";
import Popup from "./Popup.js";
import AppBar from "@material-ui/core/AppBar";
import { Toolbar as MUIToolbar } from "@material-ui/core";
import classNames from "classnames";

import "./App.css";

// Global customizations that previously went to custom.css
// should now go to public/customTheme.json. They are later
// merged when MUI Theme is created in index.js.
const styles = theme => {
  return {
    // We can also consult https://material-ui.com/customization/default-theme/ for available options
    map: {
      flexGrow: 1,
      zIndex: 1,
      overflow: "hidden",
      position: "absolute",
      top: "64px",
      bottom: 0,
      left: 0,
      right: 0,
      [theme.breakpoints.down("xs")]: {
        top: "56px"
      }
    },
    toolbar: {
      position: "fixed",
      zIndex: 20000,
      top: 0
    },
    flex: {
      flexGrow: 1
    },
    overlay: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      top: "0",
      right: 0,
      left: 0,
      bottom: 0,
      [theme.breakpoints.down("xs")]: {
        display: "inherit",
        width: "100%",
        top: "0"
      },
      position: "absolute"
    },
    widgets: {
      position: "absolute",
      zIndex: theme.zIndex.drawer - 2,
      minHeight: "50px",
      margin: "5px",
      overflow: "visible",
      [theme.breakpoints.down("xs")]: {}
    },
    widgetsLeft: {
      left: "8px",
      top: "8px",
      [theme.breakpoints.down("xs")]: {
        left: "0px",
        top: "0px"
      }
    },
    widgetsRight: {
      right: "10px",
      top: "110px",
      [theme.breakpoints.down("xs")]: {
        right: "5px"
      }
    },
    button: {
      width: "50px",
      height: "50px",
      marginBottom: "10px",
      outline: "none"
    }
  };
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
            <div key={i} className={classes.widgets[target]}>
              <tool.component
                map={tool.map}
                app={tool.app}
                options={tool.options}
                type="widgetItem"
              />
            </div>
          );
        });
    } else {
      return null;
    }
  }

  renderSearchPlugin() {
    var searchPlugin = this.appModel.getSearchPlugin();
    if (searchPlugin) {
      return (
        <searchPlugin.component
          map={searchPlugin.map}
          app={searchPlugin.app}
          options={searchPlugin.options}
        />
      );
    } else {
      return null;
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <main className={classes.map} id="map">
          <AppBar position="fixed" className={classes.toolbar}>
            <MUIToolbar>
              <Toolbar
                tools={this.appModel.getToolbarPlugins()}
                parent={this}
              />
              {this.renderSearchPlugin()}
            </MUIToolbar>
          </AppBar>
          <div id="map-overlay" className={classes.overlay}>
            <div className={classNames(classes.widgets, classes.widgetsLeft)}>
              {this.renderWidgets("left")}
            </div>
            <div className={classNames(classes.widgets, classes.widgetsRight)}>
              {this.renderWidgets("right")}
            </div>
          </div>
          <Popup
            mapClickDataResult={this.state.mapClickDataResult}
            map={this.appModel.getMap()}
            onClose={() => {
              this.setState({
                mapClickDataResult: undefined
              });
            }}
          />
        </main>
      </div>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(App);
