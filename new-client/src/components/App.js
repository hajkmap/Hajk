import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Observer from "react-event-observer";
import AppModel from "./../models/AppModel.js";
// import Typography from "@material-ui/core/Typography";
// import AppBar from "@material-ui/core/AppBar";
// import { Toolbar as MUIToolbar } from "@material-ui/core";
import { SnackbarProvider } from "notistack";
import Window from "./Window.js";
import Alert from "./Alert";
import Loader from "./Loader";
// import Reparentable from "./Reparentable";
import Zoom from "../controls/Zoom";
import ScaleLine from "../controls/ScaleLine";
import Attribution from "../controls/Attribution.js";

import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import Hidden from "@material-ui/core/Hidden";
import cslx from "clsx";

import IconButton from "@material-ui/core/IconButton";
import LockIcon from "@material-ui/icons/Lock";
import LockOpenIcon from "@material-ui/icons/LockOpen";

import MapSwitcher from "./MapSwitcher";
import BackgroundCleaner from "./BackgroundCleaner";

// import SearchBox from "./SearchBox";
import { Tooltip, Backdrop } from "@material-ui/core";
import PluginsList from "./PluginsList";

// A global that holds our windows, for use see components/Window.js
document.windows = [];

const DRAWER_WIDTH = 250;

// Global customizations that previously went to custom.css
// should now go to public/customTheme.json. They are later
// merged when MUI Theme is created in index.js.
const styles = theme => {
  return {
    // We can also consult https://material-ui.com/customization/default-theme/ for available options

    map: {
      zIndex: 1,
      background: "aliceblue",
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
      zIndex: 2,
      flex: 0,
      height: theme.spacing(8)
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
      flex: 0,
      [theme.breakpoints.down("xs")]: {
        marginTop: 0
      }
    },
    controlsColumn: {
      flex: 0,
      display: "flex",
      flexDirection: "column",
      marginTop: theme.spacing(-7),
      [theme.breakpoints.down("xs")]: {
        marginTop: 0
      }
    },
    footer: {
      zIndex: 2,
      flex: 0,
      display: "flex",
      justifyContent: "end",
      "& div": {
        marginLeft: theme.spacing(1)
      },
      "& span": {
        lineHeight: "12px",
        padding: "0 10px"
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
    shiftedLeft: {
      // Must be the last, as styles are applied in that order via JSS
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
      visible: true,
      permanent: false,
      mouseOverLock: false
    };
    this.globalObserver = new Observer();
    this.appModel = new AppModel(props.config, this.globalObserver);
    // this.widgetsLeftContainer = document.createElement("div");
    // this.widgetsRightContainer = document.createElement("div");
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
            <div
              key={i}
              className={classes.widgetItem}
              // onClick={e => {
              //   this.globalObserver.publish("widgetItemClicked");
              // }}
            >
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

  renderPopup() {
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

    this.setState({ visible: open });
  };

  /**
   * Flip the @this.state.permanent switch, then preform some
   * more work to ensure the OpenLayers canvas has the correct
   * canvas size.
   *
   * @memberof App
   */
  togglePermanent = e => {
    this.setState({ permanent: !this.state.permanent }, () => {
      // Viewport size has changed, hence we must tell OL
      // to refresh canvas size.
      this.appModel.getMap().updateSize();

      // If user clicked on Toggle Permanent and the result is,
      // that this.state.permanent===false, this means that we
      // have exited the permanent mode. In this case, we also
      // want to ensure that Drawer is hidden (otherwise we would
      // just "unpermanent" the Drawer, but it would still be visible).
      this.state.permanent === false && this.setState({ visible: false });
    });
  };

  handleMouseEnter = e => {
    this.setState({ mouseOverLock: true });
  };

  handleMouseLeave = e => {
    this.setState({ mouseOverLock: false });
  };

  renderSearchPlugin() {
    const searchPlugin = this.appModel.plugins.search;
    if (searchPlugin) {
      return (
        <searchPlugin.component
          map={searchPlugin.map}
          app={searchPlugin.app}
          options={searchPlugin.options}
          onMenuClick={this.toggleDrawer(!this.state.visible)}
          menuButtonDisabled={this.state.permanent}
        />
      );
    } else {
      return null;
    }
  }

  handleClickInDrawer = e => {
    this.state.permanent === false && this.setState({ visible: false });
  };

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
            id="flexBox"
            className={cslx(classes.flexBox, {
              [classes.shiftedLeft]: this.state.permanent
            })}
          >
            <header
              className={cslx(classes.header, classes.pointerEventsOnChildren)}
            >
              {this.renderSearchPlugin()}
            </header>
            <main className={classes.main}>
              <div
                className={cslx(
                  classes.leftColumn,
                  classes.pointerEventsOnChildren
                )}
              >
                <Hidden xsDown>{this.renderWidgets("left")}</Hidden>
              </div>
              <div
                className={cslx(
                  classes.rightColumn,
                  classes.pointerEventsOnChildren
                )}
              >
                <Hidden xsDown>{this.renderWidgets("right")}</Hidden>
              </div>
              <div
                className={cslx(
                  classes.controlsColumn,
                  classes.pointerEventsOnChildren
                )}
              >
                <Zoom map={this.appModel.getMap()} />
                <MapSwitcher appModel={this.appModel} />{" "}
                <BackgroundCleaner appModel={this.appModel} />{" "}
              </div>
            </main>
            <footer
              className={cslx(classes.footer, classes.pointerEventsOnChildren)}
            >
              <Attribution map={this.appModel.getMap()} />
              <ScaleLine map={this.appModel.getMap()} />
            </footer>
          </div>
          <div
            id="map"
            className={cslx(classes.map, {
              [classes.shiftedLeft]: this.state.permanent
            })}
          ></div>
          <div
            id="windows-container"
            className={cslx(
              classes.pointerEventsOnChildren,
              classes.windowsContainer,
              {
                [classes.shiftedLeft]: this.state.permanent
              }
            )}
          >
            {this.renderPopup()}
          </div>
          <Drawer
            open={this.state.visible}
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
              <Hidden xsDown>
                <Tooltip
                  title={
                    (this.state.permanent ? "Lås upp" : "Lås fast") +
                    " verktygspanelen"
                  }
                >
                  <IconButton
                    aria-label="pin"
                    onClick={this.togglePermanent}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                  >
                    {this.state.permanent ? (
                      this.state.mouseOverLock ? (
                        <LockOpenIcon />
                      ) : (
                        <LockIcon />
                      )
                    ) : this.state.mouseOverLock ? (
                      <LockIcon />
                    ) : (
                      <LockOpenIcon />
                    )}
                  </IconButton>
                </Tooltip>
              </Hidden>
            </div>
            <Divider />
            <PluginsList
              onPluginClicked={this.handleClickInDrawer}
              plugins={this.appModel.getBothDrawerAndWidgetPlugins()}
              globalObserver={this.globalObserver}
            />
          </Drawer>
          <Backdrop
            open={this.state.visible && !this.state.permanent}
            className={classes.backdrop}
            onClick={this.toggleDrawer(!this.state.visible)}
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
