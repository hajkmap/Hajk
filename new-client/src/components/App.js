import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Observer from "react-event-observer";
import AppModel from "./../models/AppModel.js";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import { Toolbar as MUIToolbar } from "@material-ui/core";
import { SnackbarProvider, withSnackbar } from "notistack";

import Toolbar from "./Toolbar.js";
import Popup from "./Popup.js";
import MapSwitcher from "./MapSwitcher";

import classNames from "classnames";

// Global customizations that previously went to custom.css
// should now go to public/customTheme.json. They are later
// merged when MUI Theme is created in index.js.
const styles = theme => {
  return {
    // We can also consult https://material-ui.com/customization/default-theme/ for available options
    map: {
      flexGrow: 1,
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
      zIndex: 1100,
      top: 0,
      boxShadow: "none"
    },
    center: {
      zIndex: 1000,
      position: "fixed",
      background: theme.palette.secondary.mainLight,
      left: 0,
      right: 0,
      margin: "auto",
      width: "600px",
      height: "80px",
      borderBottomLeftRadius: "10px",
      borderBottomRightRadius: "10px",
      border: "1px solid " + theme.palette.secondary.main,
      [theme.breakpoints.down("xs")]: {
        display: "none"
      }
    },
    appBar: {
      zIndex: 1200,
      background: "white",
      color: "black"
    },
    logo: {
      height: "40px",
      marginRight: "20px",
      "& img": {
        height: "100%"
      },
      [theme.breakpoints.down("xs")]: {
        marginRight: "0"
      }
    },
    title: {},
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
      position: "absolute",
      [theme.breakpoints.down("xs")]: {
        flexDirection: "column"
      }
    },
    widgets: {
      position: "absolute",
      zIndex: theme.zIndex.drawer - 2,
      minHeight: "50px",
      margin: "5px",
      overflow: "visible",
      [theme.breakpoints.down("xs")]: {
        display: "none"
      }
    },
    widgetsVisible: {
      display: "block",
      margin: 0,
      padding: 0
    },
    widgetsLeft: {
      left: "8px",
      top: "8px",
      [theme.breakpoints.down("xs")]: {
        right: "inherit",
        left: "inherit",
        position: "static"
      }
    },
    widgetsRight: {
      right: "10px",
      top: "110px",
      [theme.breakpoints.down("xs")]: {
        right: "inherit",
        left: "inherit",
        position: "static",
        marginTop: "-10px"
      }
    },
    widgetMenuIcon: {
      [theme.breakpoints.up("xs")]: {
        display: "none"
      },
      [theme.breakpoints.down("xs")]: {
        display: "inline-block"
      }
    },
    button: {
      width: "50px",
      height: "50px",
      marginBottom: "10px",
      outline: "none"
    },
    visible: {
      display: "block"
    }
  };
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mapClickDataResult: {}
    };
    this.globalObserver = new Observer();
    this.appModel = new AppModel(props.config, this.globalObserver);
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

    this.globalObserver.subscribe("panelOpened", () => {
      this.setState({
        widgetsVisible: false
      });
    });

    this.globalObserver.subscribe("mapClick", mapClickDataResult => {
      this.setState({
        mapClickDataResult: mapClickDataResult
      });
    });
  }

  // Catches exceptions generated in descendant components. Unhandled exceptions will cause the entire component tree to unmount.
  componentDidCatch(error) {
    console.error(error);
    this.props.enqueueSnackbar("Åh nej! Ett fel har inträffat.", {
      variant: "error"
    });
  }

  onWidgetMenuIconClick = () => {
    this.setState({
      widgetsVisible: !this.state.widgetsVisible
    });
  };

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

  renderMapSwitcher = () => {
    if (this.appModel.config.mapConfig.map.mapselector)
      return <MapSwitcher appModel={this.appModel} />;
    else {
      return null;
    }
  };

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

  renderWidgetMenuIcon() {
    const { classes } = this.props;
    return (
      <IconButton
        className={classes.widgetMenuIcon}
        onClick={this.onWidgetMenuIconClick}
      >
        <MenuIcon />
      </IconButton>
    );
  }

  render() {
    const { classes } = this.props;
    const { widgetsVisible } = this.state;

    var widgetClassesLeft = classNames(classes.widgets, classes.widgetsLeft);
    var widgetClassesRight = classNames(classes.widgets, classes.widgetsRight);
    var overlayClasses = classes.overlay;
    if (widgetsVisible) {
      widgetClassesLeft = classNames(
        classes.widgets,
        classes.widgetsLeft,
        classes.widgetsVisible
      );
      widgetClassesRight = classNames(
        classes.widgets,
        classes.widgetsRight,
        classes.widgetsVisible
      );
      overlayClasses = classNames(classes.overlay, classes.overlayVisible);
    }

    return (
      <SnackbarProvider
        maxSnack={3}
        classes
        anchorOrigin={{
          vertical: "top",
          horizontal: "center"
        }}
      >
        <>
          <AppBar position="absolute" className={classes.appBar}>
            <MUIToolbar>
              <span className={classes.logo}>
                <img
                  src="https://www.uddevalla.se/images/18.115b2371518ed66b79ad45/1450096919434/Uddevalla-Kommun.png"
                  alt="logo"
                />
              </span>
              {this.renderWidgetMenuIcon()}
              <span className={classes.title}>
                <Typography variant="h6">ÖVERSIKTSPLAN</Typography>
              </span>
              <Toolbar
                tools={this.appModel.getToolbarPlugins()}
                parent={this}
              />
              {this.renderMapSwitcher()}
            </MUIToolbar>
          </AppBar>
          <main className={classes.map} id="map">
            <Popup
              mapClickDataResult={this.state.mapClickDataResult}
              map={this.appModel.getMap()}
              onClose={() => {
                this.setState({
                  mapClickDataResult: undefined
                });
              }}
            />
            <div className={classes.center}>{this.renderSearchPlugin()}</div>
            <div id="map-overlay" className={overlayClasses}>
              <div className={widgetClassesLeft}>
                {this.renderWidgets("left")}
              </div>
              <div className={widgetClassesRight}>
                {this.renderWidgets("right")}
              </div>
            </div>
          </main>
        </>
      </SnackbarProvider>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withSnackbar(App));
