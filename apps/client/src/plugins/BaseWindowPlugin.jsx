import React from "react";
import propTypes from "prop-types";
import { isMobile } from "./../utils/IsMobile";
import { createPortal } from "react-dom";
import { Box, ListItemIcon, ListItemText } from "@mui/material";
import ListItemButton from "@mui/material/ListItemButton";

import Window from "../components/Window";
import WindowSheet from "../components/WindowSheet";
import Card from "../components/Card";
import PluginControlButton from "../components/PluginControlButton";

const SHEET_MIN_HEIGHT = 54;

class BaseWindowPlugin extends React.PureComponent {
  static propTypes = {
    app: propTypes.object.isRequired,
    children: propTypes.object.isRequired,
    custom: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    options: propTypes.object.isRequired,
    type: propTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    // 'type' is basically a unique identifier for each plugin
    this.type = props.type.toLowerCase() || undefined;

    // There will be defaults in props.custom, so that each plugin has own default title/description
    this.description = props.options.description || props.custom.description;

    // Should Window be visible at start?
    const visibleAtStart =
      (this.props.app.config.mapConfig.map.clean === false && // Never show in clean mode
        (isMobile
          ? props.options.visibleAtStartMobile
          : props.options.visibleAtStart)) ||
      false;

    // Title and Color are kept in state and not as class properties. Keeping them in state
    // ensures re-render when new props arrive and update the state variables (see componentDidUpdate() too).
    this.state = {
      title: props.options.title || props.custom.title || "Unnamed plugin",
      color: props.options.color || props.custom.color || null,
      windowVisible: visibleAtStart,
    };

    if (visibleAtStart) {
      // If plugin is shown at start, we want to register it as shown in the Analytics module too.
      // Normally, the event would be sent when user clicks on the button that activates the plugin,
      // but in this case there won't be any click as the window will be visible at start.
      this.props.app.globalObserver.publish("analytics.trackEvent", {
        eventName: "pluginShown",
        pluginName: this.type,
        pluginLocaleName: this.title,
        activeMap: this.props.app.config.activeMap,
      });

      // If plugin is shown at start, we want to run the onWindowShow callback.
      typeof this.props.custom.onWindowShow === "function" &&
        this.props.custom.onWindowShow();
    }

    // Title is a special case: we want to use the state.title and pass on to Window in order
    // to update Window's title dynamically. At the same time, we want all other occurrences,
    // e.g. Widget or Drawer button's label to remain the same.
    this.title = props.options.title || props.custom.title || "Unnamed plugin";

    // Try to get values from admin's option. Fallback to customs from Plugin defaults, or finally to hard-coded values.
    this.width = props.options.width || props.custom.width || 400;
    this.height = props.options.height || props.custom.height || "auto";
    this.position = props.options.position || props.custom.position || "left";

    // Register Window in our global register
    props.app.registerWindowPlugin(this);

    // Subscribe to a global event that makes it possible to show/hide Windows.
    // First we prepare a unique event name for each plugin so it looks like '{pluginName}.showWindow'.
    const eventName = `${this.type}.showWindow`;
    // Next, subscribe to that event, expect 'opts' array.
    // To find all places where this event is publish, search for 'globalObserver.publish("show'
    props.app.globalObserver.subscribe(eventName, (opts) => {
      this.showWindow(opts);
    });

    // Same as above, but to close the window.
    const closeEventName = `${this.type}.closeWindow`;

    props.app.globalObserver.subscribe(closeEventName, () => {
      this.closeWindow();
    });

    props.app.globalObserver.subscribe("core.pluginsRerender", () => {
      this.forceUpdate();
    });
  }

  // Does not run on initial render, but runs on subsequential re-renders.
  componentDidUpdate(prevProps) {
    // Window's title and color can be updated on-the-flight, so we keep them
    // in state and ensure that state is updated when new props arrive.
    prevProps.custom.title !== this.props.custom.title &&
      this.setState({ title: this.props.custom.title });

    prevProps.custom.color !== this.props.custom.color &&
      this.setState({ color: this.props.custom.color });
  }

  pluginIsWidget(target) {
    return ["left", "right"].includes(target);
  }

  pluginIsControlButton(target) {
    return target === "control";
  }

  handleButtonClick = (_e) => {
    this.showWindow({
      hideOtherPluginWindows: true,
      runCallback: true,
    });
    this.props.app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
    this.props.app.globalObserver.publish("core.focusWindow", this.type);
  };

  showWindow = (opts = {}) => {
    const hideOtherPluginWindows = opts.hideOtherPluginWindows || true,
      runCallback = opts.runCallback || true;
    // Let the App know which tool is currently active
    this.props.app.activeTool = this.type;

    // Tell the Analytics model about this
    this.props.app.globalObserver.publish("analytics.trackEvent", {
      eventName: "pluginShown",
      pluginName: this.type,
      pluginLocaleName: this.title,
      activeMap: this.props.app.config.activeMap,
    });

    // AppModel keeps track of recently shown plugins.
    this.props.app.pushPluginIntoHistory({
      type: this.type,
      icon: this.props.custom.icon,
      title: this.title,
      description: this.description,
    });

    // Don't continue if visibility hasn't changed
    if (this.state.windowVisible === true) {
      return null;
    }

    hideOtherPluginWindows === true && this.props.app.onWindowOpen(this);

    this.setState(
      {
        windowVisible: true,
      },
      () => {
        // Notify the app that a plugin's visibility has changed
        this.props.app.globalObserver.publish("core.pluginVisibilityChanged");

        // If there's a callback defined in custom, run it
        runCallback === true &&
          typeof this.props.custom.onWindowShow === "function" &&
          this.props.custom.onWindowShow();
      }
    );
  };

  closeWindowClick = () => {
    this.props.app.globalObserver.publish("analytics.trackEvent", {
      eventName: "pluginHides",
      pluginName: this.type,
      pluginLocaleName: this.title,
      activeMap: this.props.app.config.activeMap,
    });
    this.closeWindow();
  };

  closeWindow = () => {
    // If closeWindow was initiated by the tool that is currently
    // active, we should unset the activeTool property
    if (this.type === this.props.app.activeTool)
      this.props.app.activeTool = undefined;

    this.setState(
      {
        windowVisible: false,
      },
      () => {
        // Notify the app that a plugin's visibility has changed
        this.props.app.globalObserver.publish("core.pluginVisibilityChanged");

        typeof this.props.custom.onWindowHide === "function" &&
          this.props.custom.onWindowHide();
      }
    );
  };
  /**
   * @summary Render the plugin and its buttons according to settings in admin.
   * @description See comments in code to follow the rendering logic.
   * @param {*} custom
   * @returns {object} React.Component
   * @memberof BaseWindowPlugin
   */
  renderWindow(custom) {
    const { target } = this.props.options;
    // BaseWindowPlugin, which calls this method, will supply an object.
    // If that object contains a render() function, we want to call it
    // and bypass any other functionality from this method.
    return typeof custom?.render === "function" ? (
      custom.render()
    ) : (
      // If there was not custom render method, we do "normal" rendering.
      // That includes rendering the plugin Window itself, as well as a
      // button (that will trigger opening of the plugin Window).
      <>
        {isMobile ? (
          <WindowSheet
            isOpen={this.state.windowVisible}
            onClose={this.closeWindowClick}
            title={this.state.title}
            snapPoints={[0, SHEET_MIN_HEIGHT / window.innerHeight, 0.4, 0.7, 1]}
            initialSnap={2}
            globalObserver={this.props.app.globalObserver}
            minimizeOnFocusMapClick
            disablePadding={this.props.custom.disablePadding}
            persistent={this.props.custom.persistent}
          >
            <section id={this.type}>
              {React.cloneElement(this.props.children, {
                windowVisible: this.state.windowVisible,
              })}
            </section>
          </WindowSheet>
        ) : (
          <Window
            componentId={this.type}
            globalObserver={this.props.app.globalObserver}
            title={this.state.title}
            color={this.state.color}
            onClose={this.closeWindowClick}
            open={this.state.windowVisible}
            onResize={this.props.custom.onResize}
            onMaximize={this.props.custom.onMaximize}
            onMinimize={this.props.custom.onMinimize}
            draggingEnabled={this.props.custom.draggingEnabled}
            customPanelHeaderButtons={
              this.props.custom.customPanelHeaderButtons
            }
            resizingEnabled={this.props.custom.resizingEnabled}
            scrollable={this.props.custom.scrollable}
            allowMaximizedWindow={this.props.custom.allowMaximizedWindow}
            disablePadding={this.props.custom.disablePadding}
            width={this.width}
            height={this.height}
            position={this.position}
            mode="window"
            layerswitcherConfig={this.props.app.config.mapConfig.tools.find(
              (t) => t.type === "layerswitcher"
            )}
          >
            {React.cloneElement(this.props.children, {
              windowVisible: this.state.windowVisible,
            })}
          </Window>
        )}
        {target !== "hidden" && this.renderDrawerButton()}
        {this.pluginIsWidget(target) &&
          this.renderWidgetButton(`${target}-column`)}
        {target === "control" && this.renderControlButton()}
      </>
    );
  }

  /**
   * This is a bit of a special case. This method will render
   * not only plugins specified as Drawer plugins (target===toolbar),
   * but it will also render Widget and Control plugins - given some special condition.
   *
   * Those special conditions are small screens, where there's no screen
   * estate to render the Widget or Control button in Map Overlay.
   */
  renderDrawerButton() {
    return createPortal(
      <Box
        sx={{
          display:
            this.pluginIsWidget(this.props.options.target) ||
            this.pluginIsControlButton(this.props.options.target)
              ? { xs: "block", md: "none" }
              : "initial",
        }}
      >
        <ListItemButton
          divider={true}
          selected={this.state.windowVisible}
          onClick={this.handleButtonClick}
          alignItems="flex-start"
        >
          <ListItemIcon sx={{ mt: 0, alignSelf: "center" }}>
            {this.props.custom.icon}
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItemButton>
      </Box>,
      document.getElementById("plugin-buttons")
    );
  }

  renderWidgetButton(id) {
    return createPortal(
      // Hide Widget button on small screens, see renderDrawerButton too
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "fit-content",
        }}
      >
        <Card
          icon={this.props.custom.icon}
          onClick={this.handleButtonClick}
          title={this.title}
          abstract={this.description}
        />
      </Box>,
      document.getElementById(id)
    );
  }

  renderControlButton() {
    // Control buttons should only be rendered as control buttons on md+ screens.
    // On xs screens they should be rendered as drawer buttons (check renderDrawerButton for more details)
    return createPortal(
      <Box
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
        }}
      >
        <PluginControlButton
          icon={this.props.custom.icon}
          onClick={this.handleButtonClick}
          title={this.title}
          abstract={this.description}
        />
      </Box>,
      document.getElementById("plugin-control-buttons")
    );
  }

  render() {
    // Don't render if "clean" query param is specified, otherwise go on
    return (
      this.props.app.config.mapConfig.map.clean !== true &&
      this.renderWindow(this.props.custom)
    );
  }
}

export default BaseWindowPlugin;
