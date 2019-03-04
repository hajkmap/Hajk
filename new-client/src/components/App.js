import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Observer from "react-event-observer";
import AppModel from "./../models/AppModel.js";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import SearchIcon from "@material-ui/icons/Search";
import { Toolbar as MUIToolbar } from "@material-ui/core";
import { SnackbarProvider, withSnackbar } from "notistack";
import classNames from "classnames";
import Toolbar from "./Toolbar.js";
import Popup from "./Popup.js";
import Window from "./Window.js";
import MapSwitcher from "./MapSwitcher";
import Alert from "./Alert";
import Loader from "./Loader";
import { isMobile } from "../utils/IsMobile.js";

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
      right: 0
    },
    toolbarRoot: {
      height: "64px",
      justifyContent: "space-between",
      [theme.breakpoints.down("xs")]: {
        justifyContent: "space-between"
      }
    },
    toolbar: {
      top: 0,
      color: "black",
      zIndex: 2,
      order: 0
    },
    toolbarContent: {
      display: "flex",
      alignItems: "center"
    },
    appBar: {
      zIndex: 2,
      background: "white",
      color: "black"
    },
    logo: {
      height: "40px",
      marginLeft: "20px",
      marginRight: "20px",
      "& img": {
        height: "100%"
      },
      [theme.breakpoints.down("xs")]: {
        marginLeft: "0",
        marginRight: "0"
      }
    },
    title: {
      marginLeft: "8px"
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
      position: "absolute",
      [theme.breakpoints.down("md")]: {
        flexDirection: "column"
      }
    },
    overlayVisible: {
      [theme.breakpoints.down("md")]: {
        zIndex: 1,
        background: "white"
      }
    },
    toolbarPanel: {
      order: 1,
      width: "100%",
      height: "100%"
    },
    widgets: {
      position: "absolute",
      zIndex: theme.zIndex.drawer - 2,
      minHeight: "50px",
      margin: "5px",
      overflow: "visible",
      [theme.breakpoints.down("md")]: {
        display: "none"
      }
    },
    widgetsVisible: {
      display: "block !important",
      margin: 0,
      padding: 0
    },
    widgetsLeft: {
      left: "8px",
      top: "8px",
      [theme.breakpoints.down("md")]: {
        right: "inherit",
        left: "inherit",
        position: "static"
      }
    },
    widgetsRight: {
      right: "45px",
      top: "8px",
      [theme.breakpoints.down("md")]: {
        right: "inherit",
        left: "inherit",
        position: "static",
        marginTop: "-10px"
      }
    },
    widgetsOther: {
      [theme.breakpoints.down("md")]: {
        display: "none"
      }
    },
    widgetMenuIcon: {
      [theme.breakpoints.up("md")]: {
        display: "none"
      },
      [theme.breakpoints.down("md")]: {
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
    },
    searchIcon: {
      display: "block",
      [theme.breakpoints.up("lg")]: {
        display: "none"
      }
    },
    footer: {
      position: "absolute",
      top: 0,
      bottom: isMobile ? -(window.innerHeight - 45) + "px" : 0
    },
    desktop: {
      minWidth: 1280
    }
  };
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      alert: false,
      loading: false,
      mapClickDataResult: {},
      searchVisible: window.innerWidth > 1280
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

    this.globalObserver.subscribe("hideSearchPanel", forced => {
      if (window.innerWidth < 1280 || forced) {
        this.setState({
          searchVisible: false,
          forced: false
        });
      }
    });

    this.globalObserver.subscribe("mapClick", mapClickDataResult => {
      this.setState({
        mapClickDataResult: mapClickDataResult
      });
    });

    this.globalObserver.subscribe("alert", message => {
      this.setState({
        alert: true,
        alertMessage: message
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1280) {
        this.setState({
          searchVisible: true
        });
      } else {
        this.setState({
          searchVisible: this.state.forced
        });
      }
    });

    // Add a listener to update the infoclick-information when a layer visibility changes.
    this.appModel
      .getMap()
      .getLayers()
      .getArray()
      .forEach(layer => {
        layer.on("change:visible", evt => {
          let layer = evt.target;
          if (
            this.state.mapClickDataResult &&
            Array.isArray(this.state.mapClickDataResult.features)
          ) {
            this.state.mapClickDataResult.features.forEach(feature => {
              if (feature.layer === layer) {
                let o = { ...this.state.mapClickDataResult };
                o.features = o.features.filter(f => f !== feature);
                this.setState({
                  mapClickDataResult: o
                });
              }
            });
          }
        });
      });
  }

  // Catches exceptions generated in descendant components. Unhandled exceptions will cause the entire component tree to unmount.
  componentDidCatch(error) {
    console.error(error);
    // this.props.enqueueSnackbar("Åh nej! Ett fel har inträffat.", {
    //   variant: "error"
    // });
  }

  onWidgetMenuIconClick = () => {
    this.setState({
      widgetsVisible: !this.state.widgetsVisible
    });
  };

  renderWidgets(target) {
    const { classes } = this.props;
    const { tools } = this.state;
    if (tools) {
      return tools
        .filter(tool => tool.options.target === target)
        .sort((a, b) =>
          a.sortOrder === b.sortOrder ? 0 : a.sortOrder > b.sortOrder ? 1 : -1
        )
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

  renderSearchPlugin(mobile) {
    var searchPlugin = this.appModel.getSearchPlugin();
    if (searchPlugin) {
      return (
        <searchPlugin.component
          map={searchPlugin.map}
          app={searchPlugin.app}
          options={searchPlugin.options}
          visible={this.state.searchVisible}
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

  renderPopup() {
    // TODO: Ensure that Popup mode for infoclick works.
    // I'm temporarily disabling that option and send all infoclicks to display as Window.

    // var config = this.props.config.mapConfig.tools.find(
    //   tool => tool.type === "infoclick"
    // );
    // if (config && config.options.displayPopup) {
    //   return (
    //     <Popup
    //       mapClickDataResult={this.state.mapClickDataResult}
    //       map={this.appModel.getMap()}
    //       onClose={() => {
    //         this.setState({
    //           mapClickDataResult: undefined
    //         });
    //       }}
    //     />
    //   );
    // } else {
    var open =
      this.state.mapClickDataResult &&
      this.state.mapClickDataResult.features &&
      this.state.mapClickDataResult.features.length > 0;
    var features =
      this.state.mapClickDataResult && this.state.mapClickDataResult.features;

    return (
      <Window
        globalObserver={this.globalObserver}
        title="Sökresultat"
        open={open}
        position="right"
        mode="window"
        width={350}
        top={200}
        features={features}
        map={this.appModel.getMap()}
        onDisplay={feature => {
          this.appModel.highlight(feature);
        }}
        onClose={() => {
          this.appModel.highlight(false);
          this.setState({
            mapClickDataResult: undefined
          });
        }}
      />
    );
    //}
  }

  renderMobile() {
    const { classes, config } = this.props;
    return (
      <div id="app">
        <AppBar position="absolute" className={classes.appBar}>
          <MUIToolbar className={classes.toolbarRoot}>
            <div id="toolbar-left" className={classes.toolbarContent}>
              <Toolbar
                tools={this.appModel.getToolbarPlugins()}
                parent={this}
                open={false}
                mobile={true}
                expanded={true}
              />
              <div className={classes.logo}>
                <img src={config.mapConfig.map.logo} alt="logo" />
              </div>
              <span className={classes.title}>
                <Typography variant="h6">
                  {config.mapConfig.map.title}
                </Typography>
              </span>
            </div>
            <div id="toolbar-right" className={classes.toolbarContent}>
              <SearchIcon
                className={classes.searchIcon}
                onClick={() => {
                  this.setState({
                    searchVisible: !this.state.searchVisible,
                    forced: true,
                    widgetsVisible: false
                  });
                }}
              />
            </div>
          </MUIToolbar>
        </AppBar>
        <main id="map" className={classes.map}>
          <div id="map-overlay" className={classes.overlay} />
        </main>
        <footer className={classes.footer} id="footer" />
      </div>
    );
  }

  renderDesktop() {
    const { classes, config } = this.props;
    const { widgetsVisible } = this.state;

    var widgetClassesLeft = classNames(classes.widgets, classes.widgetsLeft);
    var widgetClassesRight = classNames(classes.widgets, classes.widgetsRight);
    var widgetClassesOther = classNames(classes.widgetsOther);
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
      widgetClassesOther = classNames(
        classes.widgetsOther,
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
        <div className={classes.desktop}>
          <Alert
            open={this.state.alert}
            message={this.state.alertMessage}
            parent={this}
            title="Meddelande"
          />
          <Loader visible={this.state.loading} />
          <AppBar position="absolute" className={classes.appBar}>
            <MUIToolbar className={classes.toolbarRoot}>
              <div id="toolbar-left" className={classes.toolbarContent}>
                <div className={classes.logo}>
                  <img src={config.mapConfig.map.logo} alt="logo" />
                </div>
                <span className={classes.title}>
                  <Typography variant="h6">
                    {config.mapConfig.map.title}
                  </Typography>
                </span>
              </div>
              <div id="toolbar-right" className={classes.toolbarContent}>
                <SearchIcon
                  className={classes.searchIcon}
                  onClick={() => {
                    this.setState({
                      searchVisible: !this.state.searchVisible,
                      forced: true,
                      widgetsVisible: false
                    });
                  }}
                />
              </div>
              {this.renderMapSwitcher()}
            </MUIToolbar>
          </AppBar>
          <main className={classes.map} id="map">
            <div className={classes.searchPanel}>
              {this.renderSearchPlugin()}
            </div>
            <div id="map-overlay" className={overlayClasses}>
              <div id="toolbar" className={classes.toolbar}>
                <Toolbar
                  tools={this.appModel.getToolbarPlugins()}
                  parent={this}
                  globalObserver={this.globalObserver}
                />
              </div>
              <article id="toolbar-panel" className={classes.toolbarPanel}>
                {this.renderPopup()}
              </article>
              <div className={widgetClassesLeft}>
                {this.renderWidgets("left")}
              </div>
              <div className={widgetClassesRight} id="widgets-right">
                {this.renderWidgets("right")}
              </div>
              <div id="widgets-other" className={widgetClassesOther} />
            </div>
          </main>
          <footer className={classes.footer} id="footer" />
        </div>
      </SnackbarProvider>
    );
  }

  render() {
    return isMobile ? this.renderMobile() : this.renderDesktop();
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withSnackbar(App));
