import React from "react";

import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import cslx from "clsx";
import { SnackbarProvider } from "notistack";
import Observer from "react-event-observer";
import { isMobile } from "../utils/IsMobile";
import SrShortcuts from "../components/SrShortcuts/SrShortcuts";
import AppModel from "../models/AppModel.js";
import {
  setConfig as setCookieConfig,
  functionalOk as functionalCookieOk,
} from "models/Cookie";

import Window from "./Window.js";
import CookieNotice from "./CookieNotice";
import Introduction from "./Introduction";
import Announcement from "./Announcement/Announcement";
import Alert from "./Alert";
import PluginWindows from "./PluginWindows";

import Search from "./Search/Search.js";

import Zoom from "../controls/Zoom";
import User from "../controls/User";
import Rotate from "../controls/Rotate";
import ScaleLine from "../controls/ScaleLine";
import Attribution from "../controls/Attribution.js";
import MapCleaner from "../controls/MapCleaner";
import MapResetter from "../controls/MapResetter";
import MapSwitcher from "../controls/MapSwitcher";
import Information from "../controls/Information";
import PresetLinks from "../controls/PresetLinks";

import DrawerToggleButtons from "../components/Drawer/DrawerToggleButtons";

import {
  Box,
  Divider,
  Drawer,
  Grid,
  Hidden,
  IconButton,
  Tooltip,
  Typography,
} from "@material-ui/core";

import LockIcon from "@material-ui/icons/Lock";
import LockOpenIcon from "@material-ui/icons/LockOpen";
import MapIcon from "@material-ui/icons/Map";
import ThemeToggler from "../controls/ThemeToggler";

// A global that holds our windows, for use see components/Window.js
document.windows = [];

const DRAWER_WIDTH = 250;

const styles = (theme) => {
  return {
    map: {
      zIndex: 1,
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
      border: "2px solid transparent",
      "&:focus-visible": {
        border: "2px solid black",
      },
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
      pointerEvents: "none",
    },
    windowsContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
    },
    pointerEventsOnChildren: {
      "& > *": {
        pointerEvents: "auto",
      },
    },
    drawerContent: {
      height: "inherit",
    },
    header: {
      zIndex: theme.zIndex.appBar,
      maxHeight: theme.spacing(8),
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      "& > *": {
        marginBottom: theme.spacing(2),
      },
      [theme.breakpoints.down("xs")]: {
        zIndex: 3,
        marginLeft: -theme.spacing(2),
        marginRight: -theme.spacing(2),
        marginTop: -theme.spacing(2),
        maxHeight: theme.spacing(6),
        boxShadow: theme.shadows[3],
        backgroundColor: theme.palette.background.paper,
      },
    },
    main: {
      zIndex: 2,
      flex: 1,
      display: "flex",
    },
    leftColumn: {
      flex: 1,
    },
    rightColumn: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
    controlsColumn: {
      display: "flex",
      flexDirection: "column",
      [theme.breakpoints.down("xs")]: {
        marginTop: theme.spacing(2),
      },
    },
    footer: {
      zIndex: 3,
      display: "flex",
      justifyContent: "flex-end",
      height: 25,
      "& > *": {
        marginLeft: theme.spacing(1),
      },
    },
    drawerBackground: {
      width: DRAWER_WIDTH,
      backgroundColor: theme.palette.background.default,
    },
    drawerHeader: {
      display: "flex",
      alignItems: "center",
      padding: theme.spacing(0, 2),
      ...theme.mixins.toolbar,
      justifyContent: "space-between",
      backgroundColor: theme.palette.background.paper,
    },
    drawerContentContainer: {
      backgroundColor: theme.palette.background.paper,
      height: "100%",
      overflow: "auto",
    },
    drawerLockButton: {
      margin: -12,
    },
    logoBox: {
      padding: theme.spacing(1, 2),
      height: theme.spacing(6),
    },
    logo: {
      height: theme.spacing(4),
    },
    drawerGrid: {
      padding: theme.spacing(1, 2),
      backgroundColor: theme.palette.background.paper,
      minHeight: theme.spacing(6),
    },
    drawerTitle: {
      padding: theme.spacing(1, 0),
      lineHeight: 0,
    },
    drawerLiveContent: {
      backgroundColor: theme.palette.background.default,
    },
    widgetItem: {
      width: "220px",
    },
    snackBarContainerRoot: {
      [theme.breakpoints.down("xs")]: {
        pointerEvents: "none",
        // Getting around notistack bug, can't reach snackItem.
        "& div > div > div > div": {
          pointerEvents: "auto",
        },
      },
    },
    snackbarContainerBottom: {
      [theme.breakpoints.down("xs")]: {
        bottom: "35px",
      },
    },
    snackbarContainerTop: {
      [theme.breakpoints.down("xs")]: {
        top: "18px",
      },
    },
    // IMPORTANT: shiftedLeft definition must be the last one, as styles are applied in that order via JSS
    shiftedLeft: {
      left: DRAWER_WIDTH,
    },
  };
};

/**
 * The main React Component of Hajk. Rendered by index.js.
 *
 * @class App
 * @extends {React.PureComponent}
 */
class App extends React.PureComponent {
  static propTypes = {
    /** List of plugins that has been activated in this instance of Hajk */
    activeTools: PropTypes.array.isRequired,
    /** CSS class declarations used in this component */
    classes: PropTypes.object.isRequired,
    /** Contains activeMap, layersConfig as well as objects that hold appConfig and mapConfig*/
    config: PropTypes.object.isRequired,
  };

  canRenderCustomDrawer = (activeDrawerContentFromLocalStorage, tools) => {
    if (
      !activeDrawerContentFromLocalStorage ||
      activeDrawerContentFromLocalStorage === "plugins"
    ) {
      // If nothing was found in local storage, fall back to map config setting
      activeDrawerContentFromLocalStorage =
        this.props.config.mapConfig.map.activeDrawerOnStart;
    }

    const localStorageToolFoundInMapConfig = tools.some((tool) => {
      return (
        typeof activeDrawerContentFromLocalStorage === "string" &&
        tool.type.toLowerCase() ===
          activeDrawerContentFromLocalStorage.toLowerCase()
      );
    });

    return (
      localStorageToolFoundInMapConfig &&
      activeDrawerContentFromLocalStorage &&
      activeDrawerContentFromLocalStorage !== "plugins"
    );
  };

  getDrawerPermanentFromLocalStorage = () => {
    return window.localStorage.getItem("drawerPermanent") !== null
      ? window.localStorage.getItem("drawerPermanent") === "true"
        ? true
        : false
      : null;
  };

  getActiveDrawerContentFromLocalStorage = () => {
    return window.localStorage.getItem("activeDrawerContent") !== null
      ? window.localStorage.getItem("activeDrawerContent")
      : null;
  };

  constructor(props) {
    super(props);

    const drawerPermanentFromLocalStorage =
      this.getDrawerPermanentFromLocalStorage();
    const activeDrawerContentFromLocalStorage =
      this.getActiveDrawerContentFromLocalStorage();
    const canRenderDefaultDrawer = this.hasAnyToolbarTools();

    const canRenderCustomDrawer = this.canRenderCustomDrawer(
      activeDrawerContentFromLocalStorage,
      props.config.mapConfig.tools
    );

    //Check if we have customContent to render in drawer
    //if we can render customContent, use it set the drawer content.
    //if we cant render customContent fall back to mapconfig
    //Finally, fall back to 'plugins', the standard tools panel.
    //This fall back avoids rendering an empty drawer in the case that draw is set to visible but there is no drawer content in local storage.

    const activeDrawerContentState = canRenderCustomDrawer
      ? activeDrawerContentFromLocalStorage !== null &&
        activeDrawerContentFromLocalStorage !== "plugins"
        ? activeDrawerContentFromLocalStorage
        : this.props.config.mapConfig.map.activeDrawerOnStart
      : canRenderDefaultDrawer
      ? "plugins"
      : null;

    // First check if we have anything to render at all and in case we haven't -> do not show drawer
    // If on a mobile device, the drawer should never be permanent.
    // If not on mobile, if cookie is not null, use it to show/hide Drawer.
    // If cookie is not null, use it to show/hide Drawer.
    // If cookie however is null, fall back to the values from config.
    // Finally, fall back to "false" if no cookie or config is found.
    const drawerPermanent =
      activeDrawerContentState === null
        ? false
        : isMobile
        ? false
        : drawerPermanentFromLocalStorage !== null
        ? drawerPermanentFromLocalStorage
        : (props.config.mapConfig.map.drawerVisible &&
            props.config.mapConfig.map.drawerPermanent) ||
          false;

    // First check if we have anything to render at all and in case we haven't -> do not show drawer
    // If on a mobile device, and a config property for if the drawer should initially be open is set, base the drawer state on this.
    // Otherwise if cookie for "drawerPermanent" is not null, use it to control Drawer visibility,
    // If there a no cookie settings, use the config drawVisible setting.
    // Finally, don't show the drawer.
    const drawerVisible =
      activeDrawerContentState === null
        ? false
        : isMobile &&
          props.config.mapConfig.map.drawerVisibleMobile !== undefined
        ? props.config.mapConfig.map.drawerVisibleMobile
        : drawerPermanentFromLocalStorage !== null
        ? drawerPermanentFromLocalStorage
        : props.config.mapConfig.map.drawerVisible || false;

    this.state = {
      alert: false,
      drawerButtons: [],
      loading: false,
      mapClickDataResult: {},
      drawerVisible: drawerVisible,
      drawerPermanent: drawerPermanent,
      activeDrawerContent: activeDrawerContentState,
      drawerMouseOverLock: false,
    };

    // If the drawer is set to be visible at start - ensure the activeDrawerContent
    // is set to current content. If we don't allow functional cookies, we cannot do that obviously.
    if (drawerVisible && drawerPermanent && activeDrawerContentState !== null) {
      if (functionalCookieOk()) {
        window.localStorage.setItem(
          "activeDrawerContent",
          activeDrawerContentState
        );
      }
    }

    this.globalObserver = new Observer();

    // We have to initialize the cookie-manager so we know how cookies should be managed.
    // The manager should ideally only be initialized once, since the initialization determines
    // wether the cookie-notice has to be shown or not. Running setConfig() again will not lead
    // to a new prompt.
    setCookieConfig({
      showCookieNotice: props.config.mapConfig.map.showCookieNotice,
      globalObserver: this.globalObserver,
    });

    this.appModel = new AppModel({
      config: props.config,
      globalObserver: this.globalObserver,
      refreshMUITheme: props.refreshMUITheme,
    });
  }

  hasAnyToolbarTools = () => {
    const { config, activeTools } = this.props;
    return config.mapConfig.tools.some((tool) => {
      return (
        tool.options.target === "toolbar" &&
        activeTools
          .map((activeTool) => activeTool.toLowerCase())
          .includes(tool.type.toLowerCase())
      );
    });
  };

  componentDidMount() {
    var promises = this.appModel
      .createMap()
      .addSearchModel()
      .addLayers()
      .loadPlugins(this.props.activeTools);
    Promise.all(promises).then(() => {
      this.setState(
        {
          tools: this.appModel.getPlugins(),
        },
        () => {
          // If there's at least one plugin that renders in the Drawer Map Tools List,
          // tell the Drawer to add a toggle button for the map tools
          this.appModel.getDrawerPlugins().length > 0 &&
            this.globalObserver.publish("core.addDrawerToggleButton", {
              value: "plugins",
              ButtonIcon: MapIcon,
              caption: "Kartverktyg",
              drawerTitle: "Kartverktyg",
              order: 0,
              renderDrawerContent: function () {
                return null; // Nothing specific should be rendered - this is a special case!
              },
            });

          // Tell everyone that we're done loading (in case someone listens)
          this.globalObserver.publish("core.appLoaded");
        }
      );
    });
    this.bindHandlers();
  }

  componentDidCatch(error) {}

  bindHandlers() {
    // Register a handle to prevent pinch zoom on mobile devices.
    document.body.addEventListener(
      "touchmove",
      (event) => {
        // If this event would result in changing scale …
        // scale is always undefined on Android so we need to handle it, otherwise we loose the ability to scroll.
        // For the prevention pinch-zoom on Android. Check index.css
        if (event.scale !== undefined && event.scale !== 1) {
          // …cancel it.
          event.preventDefault();
        }
        // Else, allow all non-scale-changing touch events, e.g.
        // we still want scroll to work.
      },
      { passive: false } // Explicitly tell the browser that we will preventDefault inside this handler,
      // which is important for smooth scrolling to work correctly.
    );

    // Register various global listeners.
    this.globalObserver.subscribe("infoClick.mapClick", (results) => {
      this.setState({
        mapClickDataResult: results,
      });
    });

    this.globalObserver.subscribe("core.alert", (message) => {
      this.setState({
        alert: true,
        alertMessage: message,
      });
    });

    this.globalObserver.subscribe("core.hideDrawer", () => {
      // If Drawer is currently permanent,
      // flip the permanent toggle. Please note that
      // this will do some fixes, flip the state value
      // and, finally, invoke this function (core.hideDrawer) again
      // (but with new value for drawerPermanent this time!).
      if (this.state.drawerPermanent) {
        this.togglePermanent();
      } else {
        this.setState({ drawerVisible: false });

        // Also, tell the Drawer Buttons Component to unset active button
        this.globalObserver.publish("core.unsetActiveButton");
      }
    });

    this.globalObserver.subscribe("core.onlyHideDrawerIfNeeded", () => {
      // Invoked when user clicks any of the Plugin buttons in Drawer,
      // this is needed as we don't want to toggle the Drawer in this
      // case, but only hide it IF it's not permanent.
      // This differs from the "normal" hideDrawer event, that will
      // ensure that Drawer is hidden - no matter the permanent state -
      // as it will first flip the drawerPermanent value (if needed), prior
      // to closing.
      if (this.state.drawerPermanent === false) {
        this.setState({ drawerVisible: false });
        // Also, tell the Drawer Buttons Component to unset active button
        this.globalObserver.publish("core.unsetActiveButton");
      }
    });

    this.globalObserver.subscribe("core.drawerContentChanged", (v) => {
      if (v !== null) {
        this.setState({ drawerVisible: true, activeDrawerContent: v });
      } else {
        this.globalObserver.publish("core.hideDrawer");
      }
    });

    this.globalObserver.subscribe("core.addDrawerToggleButton", (button) => {
      const newState = [...this.state.drawerButtons, button];
      this.setState({ drawerButtons: newState });
    });

    /**
     * TODO: Implement correctly a way to remove features from map click
     * results when layer visibility is changed. The current implementation
     * has problems with group layers: if we have a group layer and toggle
     * its visibility, the features are not removed from infoclick window.
     */
    // this.appModel
    //   .getMap()
    //   .getLayers()
    //   .getArray()
    //   .forEach((layer) => {
    //     layer.on("change:visible", (e) => {
    //       const layer = e.target;
    //       if (Array.isArray(this.state.mapClickDataResult.features)) {
    //         this.state.mapClickDataResult.features.forEach((feature) => {
    //           if (feature.layer === layer) {
    //             const o = { ...this.state.mapClickDataResult };
    //             o.features = o.features.filter((f) => f !== feature);
    //             this.setState({
    //               mapClickDataResult: o,
    //             });
    //           }
    //         });
    //       }
    //     });
    //   });

    // TODO: More plugins could use this - currently only Snap helper registers though
    this.appModel
      .getMap()
      .getLayers()
      .getArray()
      .forEach((layer) => {
        layer.on("change:visible", (e) => {
          this.globalObserver.publish("core.layerVisibilityChanged", e);
        });
      });
  }

  renderInfoclickWindow() {
    // Check if admin wants Infoclick to be active
    const infoclickOptions = this.props.config.mapConfig.tools.find(
      (t) => t.type === "infoclick"
    )?.options;

    // The 'open' prop, below, will control whether the Window is
    // currently visible or not. The 'open' property itself
    // depends on whether there are Features to display or not.
    //
    // That, in turn, depends on what's in the current state of 'mapClickDataResult'.
    //
    // It will be changed each time user clicks on map (as we have it registered
    // like that in Click.js), so we can be confident that __after each user
    // click we do have the most current results in our state__.
    //
    // Note however that which layers are included is controlled by
    // __layer visibility at the time the click event happens!__
    //
    // As soon as user starts to show/hide layers __after__ the click, our
    // 'mapClickDataResult' may contain results from hidden layers (or not
    // contain results from layers activated after the click occurred).
    //
    // This may or may not be a bug (depending on how we see it), and may
    // be fixed in the future.

    return (
      infoclickOptions !== undefined && (
        <Window
          open={this.state.mapClickDataResult?.features?.length > 0} // Will show window only if there are any features to show
          globalObserver={this.globalObserver}
          title={infoclickOptions.title || "Infoclick"}
          position={infoclickOptions.position || "right"}
          mode="window"
          width={infoclickOptions.width || 400}
          height={infoclickOptions.height || 300}
          features={this.state.mapClickDataResult?.features}
          options={
            this.appModel.config.mapConfig.tools.find(
              (t) => t.type === "infoclick"
            )?.options
          }
          map={this.appModel.getMap()}
          onDisplay={(feature) => {
            this.appModel.highlight(feature);
          }}
          onClose={() => {
            this.appModel.highlight(false);
            this.setState({
              mapClickDataResult: undefined,
            });
          }}
        />
      )
    );
  }

  /**
   * Flip the @this.state.drawerPermanent switch, then preform some
   * more work to ensure the OpenLayers canvas has the correct
   * canvas size.
   *
   * @memberof App
   */
  togglePermanent = (e) => {
    this.setState({ drawerPermanent: !this.state.drawerPermanent }, () => {
      // Viewport size has changed, hence we must tell OL
      // to refresh canvas size.
      this.appModel.getMap().updateSize();

      // If Drawer has been "(un)permanented", our #windows-container size has changed.
      // To ensure that our Windows still are inside the container, we dispach an
      // event that all Windows subscribe to.
      this.globalObserver.publish("core.drawerToggled");

      // If we allow functional cookies, let's save the current state of drawerPermanent
      // to LocalStorage, so that the application can reload to the same state.
      if (functionalCookieOk()) {
        window.localStorage.setItem(
          "drawerPermanent",
          this.state.drawerPermanent
        );
      }

      // If user clicked on Toggle Permanent and the result is,
      // that this.state.drawerPermanent===false, this means that we
      // have exited the permanent mode. In this case, we also
      // want to ensure that Drawer is hidden (otherwise we would
      // just "un-permanent" the Drawer, but it would still be visible).
      this.state.drawerPermanent === false &&
        this.globalObserver.publish("core.hideDrawer");
    });
  };

  handleMouseEnter = (e) => {
    this.setState({ drawerMouseOverLock: true });
  };

  handleMouseLeave = (e) => {
    this.setState({ drawerMouseOverLock: false });
  };

  renderSearchComponent() {
    // FIXME: We should get config from somewhere else now when Search is part of Core
    if (
      this.appModel.plugins.search &&
      this.appModel.plugins.search.options.renderElsewhere !== true
    ) {
      return (
        <Search
          map={this.appModel.getMap()}
          app={this}
          options={this.appModel.plugins.search.options} // FIXME: We should get config from somewhere else now when Search is part of Core
        />
      );
    } else {
      return null;
    }
  }

  renderInformationPlugin() {
    const c = this.appModel.config.mapConfig.tools.find(
      (t) => t.type === "information"
    );

    return (
      c !== undefined &&
      c.hasOwnProperty("options") && <Information options={c.options} />
    );
  }

  isString(s) {
    return s instanceof String || typeof s === "string";
  }

  renderDrawerHeader = () => {
    const { classes, config } = this.props;
    const drawerTitle = this.state.drawerButtons.find(
      (db) => db.value === this.state.activeDrawerContent
    )?.drawerTitle;

    // We need to be able to grab different logos depending
    // on light/dark mode theme
    const logoUrl =
      (this.props.theme.palette.type === "light" // If light theme active…
        ? config.mapConfig.map.logoLight // …grab light logo,
        : config.mapConfig.map.logoDark) || // …else grab dark logo.
      config.mapConfig.map.logo || // If neither was set, try to see if we have the legacy admin parameter.
      "logo.png"; // If we didn't have this either, fallback to hard-coded value.

    return (
      <>
        <Box className={classes.logoBox}>
          <img alt="" src={logoUrl} className={classes.logo} />
        </Box>
        <Divider />
        <Grid
          className={classes.drawerGrid}
          item
          container
          wrap="nowrap"
          direction="row"
          justify="space-between"
          alignItems="center"
        >
          <Grid item>
            <Typography variant="button" className={classes.drawerTitle}>
              {drawerTitle}
            </Typography>
          </Grid>
          {/** Hide Lock button in mobile mode - there's not screen estate to permanently lock Drawer on mobile viewports*/}
          <Grid item>
            <Hidden smDown>
              <Tooltip
                title={
                  (this.state.drawerPermanent ? "Lås upp" : "Lås fast") +
                  " verktygspanelen"
                }
              >
                <IconButton
                  className={classes.drawerLockButton}
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
          </Grid>
        </Grid>
      </>
    );
  };

  renderAllDrawerContent = () => {
    const { classes } = this.props;

    return (
      <div id="drawer-content" className={classes.drawerContentContainer}>
        <Box
          key="plugins"
          className={classes.drawerContent}
          display={
            this.state.activeDrawerContent === "plugins" ? "unset" : "none"
          }
        >
          <nav role="navigation" id="plugin-buttons" />
        </Box>
        {this.state.drawerButtons.map((db) => {
          return (
            <Box
              key={db.value}
              className={classes.drawerContent}
              display={
                this.state.activeDrawerContent === db.value ? "unset" : "none"
              }
            >
              {db.renderDrawerContent()}
            </Box>
          );
        })}
      </div>
    );
  };

  render() {
    const { classes, config } = this.props;

    // If clean===true, some components won't be rendered below
    const clean = config.mapConfig.map.clean;

    // Let admin decide whether MapResetter should be shown, but show it
    // always on clean mode maps.
    const showMapResetter = clean === true || config.mapConfig.map.mapresetter;

    const showMapSwitcher =
      clean === false && config.activeMap !== "simpleMapConfig";

    return (
      <SnackbarProvider
        maxSnack={3}
        classes={{
          anchorOriginBottomCenter: classes.snackbarContainerBottom,
          anchorOriginTopCenter: classes.snackbarContainerTop,
          containerRoot: classes.snackBarContainerRoot,
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <>
          {this.props.config.appConfig?.announcements &&
            Array.isArray(this.props.config.appConfig.announcements) &&
            this.props.config.appConfig.announcements.length > 0 && (
              <Announcement
                announcements={this.props.config.appConfig.announcements}
                currentMap={this.props.config.activeMap}
              />
            )}
          {clean === false && (
            <CookieNotice
              globalObserver={this.globalObserver}
              appModel={this.appModel}
            />
          )}
          <Alert
            open={this.state.alert}
            message={this.state.alertMessage}
            parent={this}
            title="Meddelande"
          />
          <SrShortcuts globalObserver={this.globalObserver}></SrShortcuts>
          <div
            id="appBox"
            className={cslx(classes.flexBox, {
              [classes.shiftedLeft]:
                this.state.drawerPermanent && clean === false,
            })}
          >
            <header
              id="header"
              className={cslx(classes.header, classes.pointerEventsOnChildren)}
            >
              {clean === false && (
                <DrawerToggleButtons
                  drawerButtons={this.state.drawerButtons}
                  globalObserver={this.globalObserver}
                  initialActiveButton={
                    this.state.drawerVisible
                      ? this.state.activeDrawerContent
                      : null
                  }
                />
              )}
              {/* Render Search even if clean === false: Search contains logic to handle clean inside the component. */}
              {this.renderSearchComponent()}
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
                {clean === false &&
                  this.appModel.config.mapConfig.map.showUserAvatar ===
                    true && (
                    <User userDetails={this.appModel.config.userDetails} />
                  )}
                <div id="plugin-control-buttons"></div>
                {showMapResetter && (
                  <MapResetter
                    mapConfig={this.appModel.config.mapConfig}
                    map={this.appModel.getMap()}
                  />
                )}
                <Rotate map={this.appModel.getMap()} />
                {showMapSwitcher && <MapSwitcher appModel={this.appModel} />}
                {clean === false && <MapCleaner appModel={this.appModel} />}
                {clean === false && <PresetLinks appModel={this.appModel} />}
                {clean === false && (
                  <ThemeToggler
                    showThemeToggler={
                      this.appModel.config.mapConfig.map.showThemeToggler
                    }
                    toggleMUITheme={this.props.toggleMUITheme}
                  />
                )}
                {clean === false && this.renderInformationPlugin()}
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
            tabIndex="0"
            role="application"
            className={cslx(classes.map, {
              [classes.shiftedLeft]:
                this.state.drawerPermanent && clean === false,
            })}
          ></div>
          <div
            id="windows-container"
            className={cslx(
              classes.pointerEventsOnChildren,
              classes.windowsContainer,
              {
                [classes.shiftedLeft]:
                  this.state.drawerPermanent && clean === false,
              }
            )}
          >
            {this.renderInfoclickWindow()}
            <PluginWindows
              plugins={this.appModel.getBothDrawerAndWidgetPlugins()}
            />
          </div>
          {clean !== true && ( // NB: Special case here, important with !== true, because there is an edge-case where clean===undefined, and we don't want to match on that!
            <Drawer
              open={this.state.drawerVisible}
              ModalProps={{
                hideBackdrop: this.state.drawerPermanent, //Don't show backdrop if drawer is permanent
                disableEnforceFocus: true, //Dont enforce focus to be able to handle elements underneath modal
                onEscapeKeyDown: () => {
                  this.globalObserver.publish("core.hideDrawer");
                },
                style: {
                  //Needs to be set to be able to handle elements underneath modal
                  position: this.state.drawerPermanent ? "initial" : "fixed",
                },
                keepMounted: true, //Ensure we dont have to render plugins more than once - UnMounting every time is slow
                onBackdropClick: () => {
                  this.globalObserver.publish("core.hideDrawer");
                },
              }}
              variant="temporary"
              classes={{
                paper: classes.drawerBackground,
              }}
            >
              {this.renderDrawerHeader()}
              <Divider />
              {this.renderAllDrawerContent()}
            </Drawer>
          )}
          {clean === false && (
            <Introduction
              experimentalIntroductionEnabled={
                this.appModel.config.appConfig.experimentalIntroductionEnabled
              }
              experimentalIntroductionSteps={
                this.appModel.config.appConfig.experimentalIntroductionSteps
              }
              globalObserver={this.globalObserver}
            />
          )}
        </>
      </SnackbarProvider>
    );
  }
}

export default withStyles(styles)(App);
