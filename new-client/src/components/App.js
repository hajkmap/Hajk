import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import cslx from "clsx";
import { SnackbarProvider } from "notistack";
import Observer from "react-event-observer";

import AppModel from "./../models/AppModel.js";
import Window from "./Window.js";
import Alert from "./Alert";
import Loader from "./Loader";
import PluginWindows from "./PluginWindows";

import Zoom from "../controls/Zoom";
import ScaleLine from "../controls/ScaleLine";
import Attribution from "../controls/Attribution.js";
import MapSwitcher from "../controls/MapSwitcher";
import BackgroundCleaner from "../controls/BackgroundCleaner";

import {
  Backdrop,
  Divider,
  Drawer,
  Hidden,
  IconButton,
  Tooltip
} from "@material-ui/core";

import LockIcon from "@material-ui/icons/Lock";
import LockOpenIcon from "@material-ui/icons/LockOpen";

// A global that holds our windows, for use see components/Window.js
document.windows = [];

const DRAWER_WIDTH = 250;

const styles = theme => {
  return {
    map: {
      zIndex: 1,
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      top: 0
    },
    flexBox: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
      padding: theme.spacing(2),
      display: "flex",
      flexDirection: "column",
      pointerEvents: "none"
    },
    windowsContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      top: 0
    },
    pointerEventsOnChildren: {
      "& > *": {
        pointerEvents: "auto"
      }
    },
    header: {
      zIndex: 4,
      // flex: 0,
      height: theme.spacing(8),
      marginBottom: theme.spacing(1)
    },
    main: {
      zIndex: 2,
      flex: 1,
      display: "flex"
    },
    leftColumn: {
      flex: 1
    },
    rightColumn: {
      marginTop: theme.spacing(-7),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      flex: 0,
      [theme.breakpoints.down("xs")]: {
        marginTop: 0
      }
    },
    controlsColumn: {
      flex: 0,
      display: "flex",
      flexDirection: "column",
      marginTop: theme.spacing(-7) - 4, // Searchbox has 2+2px padding which we need to take care of here
      [theme.breakpoints.down("xs")]: {
        marginTop: 0
      }
    },
    footer: {
      zIndex: 3,
      // flex: 0,
      display: "flex",
      justifyContent: "flex-end",
      height: 25,
      "& > *": {
        marginLeft: theme.spacing(1)
      }
    },
    drawerHeader: {
      width: DRAWER_WIDTH,
      display: "flex",
      alignItems: "center",
      padding: theme.spacing(0, 2),
      ...theme.mixins.toolbar,
      justifyContent: "space-between"
    },
    logo: {
      maxHeight: 35
    },
    backdrop: {
      zIndex: theme.zIndex.drawer - 1 // Carefully selected to be above Window but below Drawer
    },
    widgetItem: {
      width: "220px"
    },
    // IMPORTANT: shiftedLeft definition must be the last one, as styles are applied in that order via JSS
    shiftedLeft: {
      left: DRAWER_WIDTH
    }
  };
};

class App extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      alert: false,
      loading: false,
      mapClickDataResult: {},

      // Drawer-related states
      drawerVisible: false,
      drawerPermanent: false,
      drawerMouseOverLock: false
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
      this.globalObserver.publish("appLoaded"); // Window.js subscribes to this event
    });
    this.bindHandlers();
  }

  componentDidCatch(error) {
    console.error(error);
  }

  bindHandlers() {
    this.globalObserver.subscribe("mapClick", mapClickDataResult => {
      this.appModel.highlight(false);
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

    this.globalObserver.subscribe("hideDrawer", () => {
      this.state.drawerVisible &&
        !this.state.drawerPermanent &&
        this.setState({ drawerVisible: false });
    });

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

  renderSearchResultsWindow() {
    const open =
      this.state.mapClickDataResult &&
      this.state.mapClickDataResult.features &&
      this.state.mapClickDataResult.features.length > 0;
    const features =
      this.state.mapClickDataResult && this.state.mapClickDataResult.features;

    return (
      <Window
        globalObserver={this.globalObserver}
        title="Sökresultat"
        open={open}
        position="right"
        mode="window"
        width={400}
        top={0}
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
  }

  toggleDrawer = open => event => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    this.setState({ drawerVisible: open });
  };

  /**
   * Flip the @this.state.drawerPermanent switch, then preform some
   * more work to ensure the OpenLayers canvas has the correct
   * canvas size.
   *
   * @memberof App
   */
  togglePermanent = e => {
    this.setState({ drawerPermanent: !this.state.drawerPermanent }, () => {
      // Viewport size has changed, hence we must tell OL
      // to refresh canvas size.
      this.appModel.getMap().updateSize();

      // If user clicked on Toggle Permanent and the result is,
      // that this.state.drawerPermanent===false, this means that we
      // have exited the permanent mode. In this case, we also
      // want to ensure that Drawer is hidden (otherwise we would
      // just "unpermanent" the Drawer, but it would still be visible).
      this.state.drawerPermanent === false &&
        this.setState({ drawerVisible: false });
    });
  };

  handleMouseEnter = e => {
    this.setState({ drawerMouseOverLock: true });
  };

  handleMouseLeave = e => {
    this.setState({ drawerMouseOverLock: false });
  };

  renderSearchPlugin() {
    const searchPlugin = this.appModel.plugins.search;
    if (searchPlugin) {
      return (
        <searchPlugin.component
          map={searchPlugin.map}
          app={searchPlugin.app}
          options={searchPlugin.options}
          onMenuClick={this.toggleDrawer(!this.state.drawerVisible)}
          menuButtonDisabled={this.state.drawerPermanent}
        />
      );
    } else {
      return null;
    }
  }

  render() {
    const { classes, config } = this.props;

    return (
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center"
        }}
      >
        <>
          <Alert
            open={this.state.alert}
            message={this.state.alertMessage}
            parent={this}
            title="Meddelande"
          />
          <Loader visible={this.state.loading} />
          <div
            className={cslx(classes.flexBox, {
              [classes.shiftedLeft]: this.state.drawerPermanent
            })}
          >
            <header
              className={cslx(classes.header, classes.pointerEventsOnChildren)}
            >
              {this.renderSearchPlugin()}
            </header>
            <main className={classes.main}>
              <div
                id="left-column"
                className={cslx(
                  classes.leftColumn,
                  classes.pointerEventsOnChildren
                )}
              ></div>
              <div
                id="right-column"
                className={cslx(
                  classes.rightColumn,
                  classes.pointerEventsOnChildren
                )}
              ></div>

              <div
                id="controls-column"
                className={cslx(
                  classes.controlsColumn,
                  classes.pointerEventsOnChildren
                )}
              >
                <Zoom map={this.appModel.getMap()} />
                <MapSwitcher appModel={this.appModel} />
                <BackgroundCleaner appModel={this.appModel} />
              </div>
            </main>
            <footer
              className={cslx(classes.footer, classes.pointerEventsOnChildren)}
            >
              <ScaleLine map={this.appModel.getMap()} />
              <Attribution map={this.appModel.getMap()} />
            </footer>
          </div>
          <div
            id="map"
            className={cslx(classes.map, {
              [classes.shiftedLeft]: this.state.drawerPermanent
            })}
          ></div>
          <div
            id="windows-container"
            className={cslx(
              classes.pointerEventsOnChildren,
              classes.windowsContainer,
              {
                [classes.shiftedLeft]: this.state.drawerPermanent
              }
            )}
          >
            {this.renderSearchResultsWindow()}
            <PluginWindows
              plugins={this.appModel.getBothDrawerAndWidgetPlugins()}
            />
          </div>
          <Drawer
            open={this.state.drawerVisible}
            // NB: we can't simply toggle between permanent|temporary,
            // as the temporary mode unmounts element from DOM and
            // re-mounts it the next time, so we would re-rendering
            // our plugins all the time.
            variant="persistent"
          >
            <div className={classes.drawerHeader}>
              <img
                alt="Logo"
                className={classes.logo}
                src={config.mapConfig.map.logo}
              />
              {/** Hide Lock button in mobile mode - there's not screen estate to permanently lock Drawer on mobile viewports*/}
              <Hidden smDown>
                <Tooltip
                  title={
                    (this.state.drawerPermanent ? "Lås upp" : "Lås fast") +
                    " verktygspanelen"
                  }
                >
                  <IconButton
                    aria-label="pin"
                    onClick={this.togglePermanent}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                  >
                    {this.state.drawerPermanent ? (
                      this.state.drawerMouseOverLock ? (
                        <LockOpenIcon />
                      ) : (
                        <LockIcon />
                      )
                    ) : this.state.drawerMouseOverLock ? (
                      <LockIcon />
                    ) : (
                      <LockOpenIcon />
                    )}
                  </IconButton>
                </Tooltip>
              </Hidden>
            </div>
            <Divider />
            <div id="plugin-buttons" />
          </Drawer>
          <Backdrop
            open={this.state.drawerVisible && !this.state.drawerPermanent}
            className={classes.backdrop}
            onClick={this.toggleDrawer(!this.state.drawerVisible)}
          />
        </>
      </SnackbarProvider>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(App);
