import React from "react";

import { PLUGINS_TO_IGNORE_IN_HASH_APP_STATE } from "constants";

import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import Observer from "react-event-observer";
import { isMobile } from "../utils/IsMobile";
import { getMergedSearchAndHashParams } from "../utils/getMergedSearchAndHashParams";
import SrShortcuts from "../components/SrShortcuts/SrShortcuts";
import Analytics from "../models/Analytics";
import AppModel from "../models/AppModel.js";
import {
  setConfig as setCookieConfig,
  functionalOk as functionalCookieOk,
} from "../models/Cookie";

import Window from "./Window.js";
import CookieNotice from "./CookieNotice";
import Introduction from "./Introduction";
import Announcement from "./Announcement/Announcement";
import Alert from "./Alert";
import PluginWindows from "./PluginWindows";
import SimpleDialog from "./SimpleDialog";
import MapClickViewer from "./MapClickViewer/MapClickViewer";

import Search from "./Search/Search.js";

import CookieNoticeButton from "../controls/CookieNoticeButton";
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
import ExternalLinks from "../controls/ExternalLinks";
import RecentlyUsedPlugins from "../controls/RecentlyUsedPlugins";

import DrawerToggleButtons from "../components/Drawer/DrawerToggleButtons";

import {
  Box,
  Divider,
  Drawer,
  Grid,
  Hidden,
  IconButton,
  Link,
  Typography,
} from "@mui/material";

import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import MapIcon from "@mui/icons-material/Map";
import MenuIcon from "@mui/icons-material/Menu";
import ThemeToggler from "../controls/ThemeToggler";
import HajkToolTip from "components/HajkToolTip";

// A global that holds our windows, for use see components/Window.js
document.windows = [];

const DRAWER_WIDTH = 250;

// A bunch of styled components to get the Hajk feel! Remember that some
// components are styled with the sx-prop instead/as well.
const StyledHeader = styled("header")(({ theme }) => ({
  zIndex: theme.zIndex.appBar,
  maxHeight: theme.spacing(8),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  [theme.breakpoints.down("sm")]: {
    zIndex: 3,
    maxHeight: theme.spacing(6),
    boxShadow: theme.shadows[3],
    backgroundColor: theme.palette.background.paper,
  },
}));

const StyledMain = styled("main")(({ theme }) => ({
  zIndex: 2,
  flex: 1,
  display: "flex",
  paddingTop: theme.spacing(2), // we don't want the content of main box to "hit" header/footer
  paddingBottom: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2), // on small screen the inner padding of AppBox is unset, so we must add this
  },
}));

const StyledFooter = styled("footer")(({ theme }) => ({
  width: "100%",
  zIndex: 3,
  display: "flex",
  flexDirection: "row-reverse",
  justifyContent: "space-between",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}));

const MapContainer = styled("div")(() => ({
  zIndex: 1,
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
  "&:focus-visible": {
    border: "2px solid black",
  },
}));

const AppBox = styled("div")(({ theme }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
  padding: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  pointerEvents: "none",
  [theme.breakpoints.down("sm")]: {
    padding: 0,
  },
}));

const WindowsContainer = styled("div")(() => ({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
}));

const DrawerHeaderGrid = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.paper,
  minHeight: theme.spacing(6),
}));

const DrawerContentContainer = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  height: "100%",
  overflow: "auto",
}));

const FooterMapControlContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  "& > *": {
    marginLeft: theme.spacing(1),
  },
}));

const LogoImage = styled("img")(({ theme }) => ({
  height: theme.spacing(4),
}));

const DrawerTitle = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1, 0),
  lineHeight: 0,
}));

// TODO: The styles below are supposed to make the snackbars more usable
// on small view-ports. However, it seems the styles are not working.
// Must check with the implementer (jesade?) before migrating these.

// const styles = (theme) => {
//   return {
//     snackBarContainerRoot: {
//       [theme.breakpoints.down("sm")]: {
//         pointerEvents: "none",
//         // Getting around notistack bug, can't reach snackItem.
//         "& div > div > div > div": {
//           pointerEvents: "auto",
//         },
//       },
//     },
//     snackbarContainerBottom: {
//       [theme.breakpoints.down("sm")]: {
//         bottom: "35px",
//       },
//     },
//     snackbarContainerTop: {
//       [theme.breakpoints.down("sm")]: {
//         top: "18px",
//       },
//     },
//   };
// };

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

  isDrawerPermanent = (drawerProps) => {
    const { props, activeDrawerContentState, drawerPermanentFromLocalStorage } =
      drawerProps;
    const { map } = props.config.mapConfig;
    // First check if we have anything to render at all and in case we haven't -> do not show drawer
    // If on a mobile device, the drawer should never be permanent.
    if (activeDrawerContentState === null || isMobile) {
      return false;
    }
    // If drawer is set to static we want the the drawer to be set to permanent
    if (map.drawerStatic) {
      return true;
    }
    // If not on mobile, if cookie is not null, use it to show/hide Drawer.
    // If cookie is not null, use it to show/hide Drawer.
    // If cookie however is null, fall back to the values from config.
    if (drawerPermanentFromLocalStorage !== null) {
      return drawerPermanentFromLocalStorage;
    }
    // Finally, check if drawerVisible and drawerPermanent are both true, and return true if they are.
    return map.drawerVisible && map.drawerPermanent;
  };

  isDrawerVisible = (drawerProps) => {
    const { props, activeDrawerContentState, drawerPermanentFromLocalStorage } =
      drawerProps;
    const { map } = props.config.mapConfig;
    // First check if we have anything to render at all and in case we haven't -> do not show drawer
    if (activeDrawerContentState === null) {
      return false;
    }
    // If on a mobile device, the drawer should never be visible.
    if (isMobile && map.drawerVisibleMobile !== undefined) {
      return map.drawerVisibleMobile;
    }
    // If drawer is set to static we want the the drawer to be set to visible
    if (map.drawerStatic) {
      return true;
    }
    // If not on mobile, if cookie is not null, use it to show/hide Drawer.
    // If cookie is not null, use it to show/hide Drawer.
    // If cookie however is null, fall back to the values from config.
    if (drawerPermanentFromLocalStorage !== null) {
      return drawerPermanentFromLocalStorage;
    }
    // Finally, we return true if drawerVisible is set, otherwise false
    return map.drawerVisible || false;
  };

  isDrawerStatic = (drawerProps) => {
    const { drawerStatic } = drawerProps.props.config.mapConfig.map;
    // We check if we have something to render or if user is on mobile.
    if (drawerProps.activeDrawerContentState === null || isMobile) {
      return false;
    }
    // And if the drawerStatic is being used at all.
    if (drawerStatic !== undefined) {
      return drawerStatic;
    }
    return drawerStatic || false;
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

    const drawerProps = {
      props,
      activeDrawerContentState,
      drawerPermanentFromLocalStorage,
    };

    // We check if drawer is set to static
    const drawerStatic = this.isDrawerStatic(drawerProps);
    // We check if drawer is set to permanent
    // If drawerStatic is true, we do not need to check drawerPermanent
    const drawerPermanent = drawerStatic
      ? true
      : this.isDrawerPermanent(drawerProps);
    // We check if drawer is set to visible
    // If drawerStatic is true, we do not need to check drawerVisible
    const drawerVisible = drawerStatic
      ? true
      : this.isDrawerVisible(drawerProps);

    this.state = {
      alert: false,
      drawerButtons: [],
      loading: false,
      mapClickDataResult: {},
      drawerVisible: drawerVisible,
      drawerPermanent: drawerPermanent,
      drawerStatic: drawerStatic,
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

    // Initiate the Analytics model
    props.config.mapConfig.analytics && this.initiateAnalyticsModel();

    this.infoclickOptions = this.props.config.mapConfig.tools.find(
      (t) => t.type === "infoclick"
    )?.options;

    // We have to initialize the cookie-manager so we know how cookies should be managed.
    // The manager should ideally only be initialized once, since the initialization determines
    // wether the cookie-notice has to be shown or not. Running setConfig() again will not lead
    // to a new prompt.
    setCookieConfig({
      showCookieNotice: props.config.mapConfig.map.showCookieNotice,
      globalObserver: this.globalObserver,
    });

    AppModel.init({
      config: props.config,
      globalObserver: this.globalObserver,
      refreshMUITheme: props.refreshMUITheme,
    });

    this.appModel = AppModel;
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

  checkConfigForUnsupportedTools = () => {
    // The plugin names can be fancy, but are always lower case in mapConfig:
    const lowerCaseActiveTools = this.props.activeTools.map((t) =>
      t.toLowerCase()
    );

    // Let's push some built-in core elements, that previously were plugins
    // and that still have their config there.
    lowerCaseActiveTools.push("preset");
    lowerCaseActiveTools.push("externallinks");
    lowerCaseActiveTools.push("information");

    // Check which plugins defined in mapConfig don't exist in buildConfig
    const unsupportedToolsFoundInMapConfig = this.props.config.mapConfig.tools
      .map((t) => t.type.toLowerCase())
      .filter((e) => {
        // Special case: "infoclick" will never exist in activeTools (as it's core)
        // so we can assume it's supported even if it isn't found in activeTools.
        if (e === "infoclick") return false;

        // Check if activeTools contain the plugin supplied in this configuration.
        // If not, leave it in this array.
        return !lowerCaseActiveTools.includes(e);
      });

    // Display a silent info message in console
    unsupportedToolsFoundInMapConfig.length > 0 &&
      console.info(
        `The map configuration contains unavailable plugins: ${unsupportedToolsFoundInMapConfig.join(
          ", "
        )}. Please check your map config and buildConfig.json.  `
      );
  };
  /**
   * @summary Initiates the wanted analytics model (if any).
   * @description If Hajk is configured to track map usage, this method will
   * initialize the model and subscribe to two events ("analytics.trackPageView"
   * and "analytics.trackEvent").
   *
   * @memberof App
   */
  initiateAnalyticsModel() {
    this.analytics = new Analytics(
      this.props.config.mapConfig.analytics,
      this.globalObserver
    );
  }

  componentDidMount() {
    this.checkConfigForUnsupportedTools();

    const promises = this.appModel
      .createMap()
      .addSearchModel()
      .addLayers()
      .addAnchorModel() // Anchor model must be added after the layers
      .loadPlugins(this.props.activeTools);

    Promise.all(promises).then(() => {
      // Track the page view
      this.globalObserver.publish("analytics.trackPageView");

      // Track the mapLoaded event, distinguish between regular and
      // cleanMode loads. See #1077.
      this.globalObserver.publish("analytics.trackEvent", {
        eventName: "mapLoaded",
        activeMap: this.props.config.activeMap,
        cleanMode: this.props.config.mapConfig.map.clean,
      });

      // Determine the icon based on the config value
      const drawerButtonIcon =
        this.props.config.mapConfig.map?.drawerButtonIcon;

      // Mapping object for icons
      const iconMapping = {
        MapIcon: MapIcon,
        MenuIcon: MenuIcon,
      };

      // Return the mapped icon or a default one if not found
      const ButtonIcon = iconMapping[drawerButtonIcon] || MapIcon;

      this.setState(
        {
          tools: this.appModel.getPlugins(),
        },
        () => {
          // If there's at least one plugin that renders in the Drawer Map Tools List,
          // tell the Drawer to add a toggle button for the map tools
          this.appModel.getPluginsThatMightRenderInDrawer().length > 0 &&
            this.globalObserver.publish("core.addDrawerToggleButton", {
              value: "plugins",
              ButtonIcon: ButtonIcon,
              caption:
                this.props.config.mapConfig.map?.drawerButtonTitle ??
                "Kartverktyg",
              drawerTitle:
                this.props.config.mapConfig.map?.drawerTitle ?? "Kartverktyg",
              order: 0,
              // If no plugins render **directly** in Drawer, but some **might**
              // render there occasionally, let's ensure to hide the Tools button on
              // medium screens and above.
              hideOnMdScreensAndAbove:
                this.appModel.getDrawerPlugins().length === 0 &&
                this.appModel.getPluginsThatMightRenderInDrawer().length > 0,
              renderDrawerContent: function () {
                return null; // Nothing specific should be rendered - this is a special case!
              },
            });

          // Ensure to update the map canvas size. Otherwise we can run into #1058.
          this.appModel.getMap().updateSize();

          // Tell everyone that we're done loading (in case someone listens)
          this.globalObserver.publish("core.appLoaded");
        }
      );
    });
    this.bindHandlers();
  }

  componentDidCatch(error) {}

  bindHandlers() {
    // Extend the hajkPublicApi with a couple of things that are available now
    window.hajkPublicApi = {
      ...window.hajkPublicApi,
      olMap: this.appModel.map,
      dirtyLayers: {},
    };

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

    // Some tools (such as those that use the DrawModel) will tell
    // the Public API if user has made any changes that would be lost
    // on a window close/reload. We listen to the appropriate event
    // and check with the "dirtyLayers" object in order to determine
    // whether to show the confirmation dialog. See #1403.
    this.appModel.config.mapConfig.map.confirmOnWindowClose !== false &&
      window.addEventListener("beforeunload", function (event) {
        if (Object.keys(window.hajkPublicApi.dirtyLayers).length > 0) {
          event.preventDefault();
          return (event.returnValue = "");
        }
      });

    // This event is used to allow controlling Hajk programmatically, e.g in an embedded context, see #1252
    this.props.config.mapConfig.map.enableAppStateInHash === true &&
      window.addEventListener(
        "hashchange",
        () => {
          // Extract existing params. Using this helper we will take into account both
          // the query and the hash parameters.
          const mergedParams = getMergedSearchAndHashParams();

          // If map changed, do a full reload
          if (mergedParams.get("m") !== this.props.config.activeMap) {
            window.location.reload();
          }

          // Act when view's zoom changes
          if (mergedParams.get("z")) {
            // Since we're dealing with a string, we have to parse it to a float.
            // We must also round it to the nearest integer in order to avoid bouncing in View:
            // View's getZoom() returns a float, but our hash param is always an integer.
            // See also: #1422.
            const zoomInHash = Math.round(parseFloat(mergedParams.get("z")));
            if (
              Math.round(this.appModel.map.getView().getZoom()) !== zoomInHash
            ) {
              // …let's update our View's zoom.
              this.appModel.map.getView().animate({ zoom: zoomInHash });
            }
          }

          // Act when view's center coordinate changes
          if (mergedParams.get("x") || mergedParams.get("y")) {
            const [x, y] = this.appModel.map.getView().getCenter();

            if (
              mergedParams.get("x") !== x.toString() ||
              mergedParams.get("y") !== y.toString()
            ) {
              this.appModel.map.getView().animate({
                center: [mergedParams.get("x"), mergedParams.get("y")],
              });
            }
          }

          // Act when plugin window's visibility changes.
          // p contains the list of plugins to show. It's important to check
          // for null, as an empty string value is a valid value that indicates
          // that no plugin should be shown, while a null value indicates that
          // the parameter does not exist and default plugin visibility should
          // be respected.
          if (mergedParams.get("p") !== null) {
            const currentlyVisiblePlugins = this.appModel.windows
              .filter((w) => w.state.windowVisible)
              .map((p) => p.type);

            if (currentlyVisiblePlugins.join(",") !== mergedParams.get("p")) {
              const pInParams = mergedParams.get("p").split(",");

              // First hide if window not longer visible
              currentlyVisiblePlugins.forEach((p) => {
                if (
                  !pInParams.includes(p) &&
                  PLUGINS_TO_IGNORE_IN_HASH_APP_STATE.indexOf(p) === -1
                ) {
                  this.globalObserver.publish(`${p}.closeWindow`);
                }
              });

              // Next, show any windows that are still hidden
              mergedParams
                .get("p")
                .split(",")
                .forEach((p) => {
                  PLUGINS_TO_IGNORE_IN_HASH_APP_STATE.indexOf(p) === -1 &&
                    this.globalObserver.publish(`${p}.showWindow`);
                });
            }
          }

          // Act when search string changes.
          // Check if the q parameter exists and differs from
          // the most recent search. If so, let's publish an event that
          // the Search component listens to.
          // TODO: Also handle sources change, the s parameter
          if (
            mergedParams.get("q") !==
              this.appModel.searchModel.lastSearchPhrase &&
            mergedParams.get("q") !== null
          ) {
            this.globalObserver.publish(
              "search.setSearchPhrase",
              mergedParams.get("q")
            );
          }

          // Act when the l parameter changes
          if (mergedParams.get("l") || mergedParams.get("gl")) {
            this.appModel.setLayerVisibilityFromParams(
              mergedParams.get("l"),
              mergedParams.get("gl")
            );
          }
        },
        false
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
        if (!this.state.drawerStatic) {
          this.globalObserver.publish("core.hideDrawer");
        }
      }
    });

    this.globalObserver.subscribe("core.addDrawerToggleButton", (button) => {
      this.setState((prevState) => ({
        drawerButtons: [...prevState.drawerButtons, button],
      }));
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

    // Add some listeners to each layer's change event
    this.appModel
      .getMap()
      .getLayers()
      .getArray()
      .forEach((layer) => {
        layer.on("change:visible", (e) => {
          // If the Analytics object exists, let's track layer visibility
          if (this.analytics && e.target.get("visible") === true) {
            const opts = {
              eventName: "layerShown",
              activeMap: this.props.config.activeMap,
              layerId: e.target.get("name"),
              layerName: e.target.get("caption"),
            };
            // Send a custom event to the Analytics model
            this.globalObserver.publish("analytics.trackEvent", opts);
          }

          // Not related to Analytics: send an event on the global observer
          // to anyone wanting to act on layer visibility change.
          this.globalObserver.publish("core.layerVisibilityChanged", e);
        });
      });
  }

  renderInfoclickWindow() {
    // Check if admin wants Infoclick to be active
    const { infoclickOptions } = this;

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
   * Flip the @this.state.drawerPermanent switch, then perform some
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

  drawerIsLocked() {
    const { config } = this.props;
    const clean = config.mapConfig.map.clean;

    // The user might have locked the drawer while in regular mode,
    // hence we must make sure we're not in clean mode, because
    // if we are, the drawer cannot be locked, and we should return false.
    return this.state.drawerPermanent && clean === false;
  }

  renderDrawerHeader = () => {
    const { config } = this.props;
    const drawerTitle = this.state.drawerButtons.find(
      (db) => db.value === this.state.activeDrawerContent
    )?.drawerTitle;

    // We need to be able to grab different logos depending
    // on light/dark mode theme
    const logoUrl =
      (this.props.theme.palette.mode === "light" // If light theme active…
        ? config.mapConfig.map.logoLight // …grab light logo,
        : config.mapConfig.map.logoDark) || // …else grab dark logo.
      config.mapConfig.map.logo || // If neither was set, try to see if we have the legacy admin parameter.
      "logo.png"; // If we didn't have this either, fallback to hard-coded value.

    const logoAltText = config.mapConfig.map.logoAltText || "Logotype";

    return (
      <>
        <Box
          sx={{
            padding: (theme) => theme.spacing(1, 2),
            height: (theme) => theme.spacing(6),
          }}
        >
          <LogoImage alt={logoAltText} src={logoUrl} />
        </Box>
        <Divider />
        <DrawerHeaderGrid
          item
          container
          wrap="nowrap"
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Grid item>
            <DrawerTitle variant="button">{drawerTitle}</DrawerTitle>
          </Grid>
          {/** Hide Lock button in mobile mode - there's not screen estate to permanently lock Drawer on mobile viewports*/}
          {/** Hide Lock button if user has chosen static drawer*/}
          {!this.state.drawerStatic && (
            <Grid item>
              <Hidden mdDown>
                <HajkToolTip
                  title={
                    (this.state.drawerPermanent ? "Lås upp" : "Lås fast") +
                    " verktygspanelen"
                  }
                >
                  <IconButton
                    sx={{ margin: "-12px" }} // Ugh... However, it tightens everything up
                    onClick={this.togglePermanent}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                    size="large"
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
                </HajkToolTip>
              </Hidden>
            </Grid>
          )}
        </DrawerHeaderGrid>
      </>
    );
  };

  renderAllDrawerContent = () => {
    return (
      <DrawerContentContainer id="drawer-content">
        <Box
          key="plugins"
          sx={{
            height: "inherit",
            display:
              this.state.activeDrawerContent === "plugins" ? "unset" : "none",
          }}
        >
          <nav role="navigation" id="plugin-buttons" />
        </Box>
        {this.state.drawerButtons.map((db) => {
          return (
            <Box
              key={db.value}
              sx={{
                height: "inherit",
                display:
                  this.state.activeDrawerContent === db.value
                    ? "unset"
                    : "none",
              }}
            >
              {db.renderDrawerContent()}
            </Box>
          );
        })}
      </DrawerContentContainer>
    );
  };

  showDrawerButtons() {
    const drawerButtons = this.state.drawerButtons;

    if (!drawerButtons) return false;

    // We check if the plugin button (or any button) is empty and then subsequently hidden
    const isHiddenPluginPresent = drawerButtons.some(
      (button) => button.hideOnMdScreensAndAbove
    );

    // We want to check if there's only one visible drawerButton
    const isOnlyOneButtonVisible =
      drawerButtons.length === 1 ||
      (drawerButtons.length === 2 && isHiddenPluginPresent);

    // And then check if drawer is static AND has a single visible button
    return this.state.drawerStatic && isOnlyOneButtonVisible ? false : true;
  }

  render() {
    const { config } = this.props;

    // If clean===true, some components won't be rendered below
    const clean = config.mapConfig.map.clean;

    // Let admin decide whether MapResetter should be shown, but show it
    // always on clean mode maps.
    const showMapResetter = clean === true || config.mapConfig.map.mapresetter;

    const showMapSwitcher =
      clean === false && config.activeMap !== "simpleMapConfig";

    const useNewInfoclick = this.infoclickOptions?.useNewInfoclick === true;

    return (
      <SnackbarProvider
        maxSnack={3}
        // classes={{
        //   anchorOriginBottomCenter: classes.snackbarContainerBottom,
        //   anchorOriginTopCenter: classes.snackbarContainerTop,
        //   containerRoot: classes.snackBarContainerRoot,
        // }}
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
          <AppBox
            id="appBox"
            sx={{
              left: this.drawerIsLocked() ? DRAWER_WIDTH : 0,
            }}
          >
            <StyledHeader
              id="header"
              sx={{
                justifyContent: this.showDrawerButtons()
                  ? "space-between"
                  : "end",
                "& > *": {
                  pointerEvents: "auto",
                },
              }}
            >
              {clean === false && this.showDrawerButtons() && (
                <DrawerToggleButtons
                  drawerButtons={this.state.drawerButtons}
                  globalObserver={this.globalObserver}
                  initialActiveButton={
                    this.state.drawerVisible
                      ? this.state.activeDrawerContent
                      : null
                  }
                  drawerStatic={this.state.drawerStatic}
                />
              )}
              {/* Render Search even if clean === false: Search contains logic to handle clean inside the component. */}
              {this.renderSearchComponent()}
            </StyledHeader>
            <StyledMain>
              <Box
                id="left-column"
                sx={{
                  flex: 1,
                  "& > *": {
                    pointerEvents: "auto",
                  },
                }}
              ></Box>
              <Box
                id="right-column"
                sx={{
                  paddingLeft: 2,
                  paddingRight: 2,
                  "& > *": {
                    pointerEvents: "auto",
                  },
                }}
              ></Box>

              <Box
                id="controls-column"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  "& > *": {
                    pointerEvents: "auto",
                  },
                }}
              >
                <Zoom
                  map={this.appModel.getMap()}
                  mapConfig={this.appModel.config.mapConfig.map}
                />
                {clean === false && (
                  <CookieNoticeButton appModel={this.appModel} />
                )}
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
                {clean === false && <ExternalLinks appModel={this.appModel} />}
                {clean === false && (
                  <ThemeToggler
                    showThemeToggler={
                      this.appModel.config.mapConfig.map.showThemeToggler
                    }
                    toggleMUITheme={this.props.toggleMUITheme}
                  />
                )}
                {clean === false && this.renderInformationPlugin()}
                {clean === false && (
                  <RecentlyUsedPlugins
                    globalObserver={this.globalObserver}
                    showRecentlyUsedPlugins={
                      this.appModel.config.mapConfig.map.showRecentlyUsedPlugins
                    }
                  />
                )}
              </Box>
            </StyledMain>
            <StyledFooter
              sx={{
                "& > *": {
                  pointerEvents: "auto",
                },
              }}
            >
              <FooterMapControlContainer>
                <ScaleLine map={this.appModel.getMap()} />
                <Attribution map={this.appModel.getMap()} />
              </FooterMapControlContainer>
              <div id="breadcrumbs-container" />
            </StyledFooter>
          </AppBox>
          <MapContainer
            id="map"
            tabIndex="0"
            role="application"
            sx={{
              left: this.drawerIsLocked() ? DRAWER_WIDTH : 0,
            }}
          ></MapContainer>
          <WindowsContainer
            id="windows-container"
            sx={{
              left: this.drawerIsLocked() ? DRAWER_WIDTH : 0,
              "& > *": {
                pointerEvents: "auto",
              },
            }}
          >
            {useNewInfoclick === false && this.renderInfoclickWindow()}
            {useNewInfoclick && (
              <MapClickViewer
                appModel={this.appModel}
                globalObserver={this.globalObserver}
                infoclickOptions={this.infoclickOptions}
              />
            )}
            <PluginWindows
              plugins={this.appModel.getBothDrawerAndWidgetPlugins()}
            />
            <SimpleDialog globalObserver={this.globalObserver} />
          </WindowsContainer>
          {clean !== true && ( // NB: Special case here, important with !== true, because there is an edge-case where clean===undefined, and we don't want to match on that!
            <Drawer
              open={this.state.drawerVisible}
              ModalProps={{
                hideBackdrop: this.state.drawerPermanent, //Don't show backdrop if drawer is permanent
                disableEnforceFocus: true, //Dont enforce focus to be able to handle elements underneath modal
                onClose: () => {
                  this.globalObserver.publish("core.hideDrawer");
                },
                style: {
                  //Needs to be set to be able to handle elements underneath modal
                  position: this.state.drawerPermanent ? "initial" : "fixed",
                },
                keepMounted: true, //Ensure we dont have to render plugins more than once - UnMounting every time is slow
              }}
              variant="temporary"
              sx={{
                "& .MuiPaper-root": {
                  width: DRAWER_WIDTH,
                  backgroundColor: (theme) => theme.palette.background.default,
                  backgroundImage: "unset", // To match the new (darker) black theme.
                },
              }}
            >
              {this.renderDrawerHeader()}
              <Divider />
              {this.renderAllDrawerContent()}
              {
                // See #1336
                config.mapConfig.map.linkInDrawer &&
                  typeof config.mapConfig.map.linkInDrawer?.text === "string" &&
                  typeof config.mapConfig.map.linkInDrawer?.href ===
                    "string" && (
                    <>
                      <Divider />
                      <Link
                        align="center"
                        variant="button"
                        href={config.mapConfig.map.linkInDrawer.href}
                        target={
                          config.mapConfig.map.linkInDrawer.newWindow === true
                            ? "_blank"
                            : "_self"
                        }
                        sx={{
                          p: 1,
                        }}
                      >
                        {config.mapConfig.map.linkInDrawer.text}
                      </Link>
                    </>
                  )
              }
            </Drawer>
          )}
          {clean === false && (
            <Introduction
              introductionEnabled={
                this.appModel.config.mapConfig.map.introductionEnabled
              }
              introductionShowControlButton={
                this.appModel.config.mapConfig.map.introductionShowControlButton
              }
              introductionSteps={
                this.appModel.config.mapConfig.map.introductionSteps
              }
              globalObserver={this.globalObserver}
            />
          )}
        </>
      </SnackbarProvider>
    );
  }
}

export default App;
