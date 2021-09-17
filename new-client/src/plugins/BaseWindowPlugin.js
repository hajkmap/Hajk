import React from "react";
import propTypes from "prop-types";
import { isMobile } from "./../utils/IsMobile";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { withTheme } from "@material-ui/styles";
import {
  Hidden,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";
import Window from "../components/Window.js";
import Card from "../components/Card.js";
import PluginControlButton from "../components/PluginControlButton";

const styles = (theme) => {
  return {};
};

class BaseWindowPlugin extends React.PureComponent {
  static propTypes = {
    app: propTypes.object.isRequired,
    children: propTypes.object.isRequired,
    classes: propTypes.object.isRequired,
    custom: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    options: propTypes.object.isRequired,
    theme: propTypes.object.isRequired,
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
      (isMobile
        ? props.options.visibleAtStartMobile
        : props.options.visibleAtStart) || false;

    // Title and Color are kept in state and not as class properties. Keeping them in state
    // ensures re-render when new props arrive and update the state variables (see componentDidUpdate() too).
    this.state = {
      title: props.options.title || props.custom.title || "Unnamed plugin",
      color: props.options.color || props.custom.color || null,
      windowVisible: visibleAtStart,
    };

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

  handleButtonClick = (e) => {
    this.showWindow({
      hideOtherPluginWindows: true,
      runCallback: true,
    });
    this.props.app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
  };

  showWindow = (opts) => {
    const hideOtherPluginWindows = opts.hideOtherPluginWindows || true,
      runCallback = opts.runCallback || true;

    // Let the App know which tool is currently active
    this.props.app.activeTool = this.type;

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
        // If there's a callback defined in custom, run it
        runCallback === true &&
          typeof this.props.custom.onWindowShow === "function" &&
          this.props.custom.onWindowShow();
      }
    );
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
        typeof this.props.custom.onWindowHide === "function" &&
          this.props.custom.onWindowHide();
      }
    );
  };
  /**
   * @summary Render the plugin and its buttons according to settings in admin.
   * @description See comments in code to follow the rendering logic.
   * @param {*} custom
   * @returns {object} React.Component
   * @memberof BaseWindowPlugin
   */
  renderWindow(custom) {
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
        <Window
          globalObserver={this.props.app.globalObserver}
          title={this.state.title}
          color={this.state.color}
          onClose={this.closeWindow}
          open={this.state.windowVisible}
          onResize={this.props.custom.onResize}
          onMaximize={this.props.custom.onMaximize}
          onMinimize={this.props.custom.onMinimize}
          draggingEnabled={this.props.custom.draggingEnabled}
          customPanelHeaderButtons={this.props.custom.customPanelHeaderButtons}
          resizingEnabled={this.props.custom.resizingEnabled}
          scrollable={this.props.custom.scrollable}
          allowMaximizedWindow={this.props.custom.allowMaximizedWindow}
          width={this.width}
          height={this.height}
          position={this.position}
          mode="window"
          layerswitcherConfig={this.props.app.config.mapConfig.tools.find(
            (t) => t.type === "layerswitcher"
          )}
        >
          {this.props.children}
        </Window>
        {/* Always render the Drawer button if we have a Window.
            See comment for renderDrawerButton() too. */}
        {this.renderDrawerButton()}
        {/* Depending on value of target, render a left or right Widget too */}
        {this.props.options.target === "left" &&
          this.renderWidgetButton("left-column")}
        {this.props.options.target === "right" &&
          this.renderWidgetButton("right-column")}
        {/* Finally, render a Control button if target has that value */}
        {this.props.options.target === "control" && this.renderControlButton()}
      </>
    );
  }

  /**
   * This is a bit of a special case. This method will render
   * not only plugins specified as Drawer plugins (target===toolbar),
   * but it will also render Widget plugins - given some special condition.
   *
   * Those special conditions are small screens, where there's no screen
   * estate to render the Widget button in Map Overlay.
   *
   * There is another special case needed to be taken care of: the "hidden"
   * value on target should not render any button at all, but still load the plugin.
   */
  renderDrawerButton() {
    return this.props.options.target === "hidden"
      ? null
      : createPortal(
          <Hidden
            mdUp={
              this.props.options.target !== "toolbar" &&
              this.props.options.target !== "control"
            }
          >
            <ListItem
              button
              divider={true}
              selected={this.state.windowVisible}
              onClick={this.handleButtonClick}
            >
              <ListItemIcon>{this.props.custom.icon}</ListItemIcon>
              <ListItemText primary={this.title} />
            </ListItem>
          </Hidden>,
          document.getElementById("plugin-buttons")
        );
  }

  renderWidgetButton(id) {
    return createPortal(
      // Hide Widget button on small screens, see renderDrawerButton too
      <Hidden smDown>
        <Card
          icon={this.props.custom.icon}
          onClick={this.handleButtonClick}
          title={this.title}
          abstract={this.description}
        />
      </Hidden>,
      document.getElementById(id)
    );
  }

  renderControlButton() {
    return createPortal(
      <PluginControlButton
        icon={this.props.custom.icon}
        onClick={this.handleButtonClick}
        title={this.title}
        abstract={this.description}
      />,
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

export default withStyles(styles)(withTheme(BaseWindowPlugin));
