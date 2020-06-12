import React from "react";
import propTypes from "prop-types";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { withTheme } from "@material-ui/styles";
import {
  Hidden,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@material-ui/core";
import Window from "../components/Window.js";
import Card from "../components/Card.js";
import PluginControlButton from "../components/PluginControlButton";

const styles = theme => {
  return {};
};

class BaseWindowPlugin extends React.PureComponent {
  state = {
    windowVisible: false
  };

  static propTypes = {
    app: propTypes.object.isRequired,
    children: propTypes.object.isRequired,
    classes: propTypes.object.isRequired,
    custom: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    options: propTypes.object.isRequired,
    theme: propTypes.object.isRequired,
    type: propTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.type = props.type.toLowerCase() || undefined;
    // There will be defaults in props.custom, so that each plugin has own default title/description
    this.title = props.options.title || props.custom.title;
    this.description = props.options.description || props.custom.description;

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
    props.app.globalObserver.subscribe(eventName, opts => {
      this.showWindow(opts);
    });
  }

  componentDidMount() {
    // visibleAtStart is false by default. Change to true only if option really is 'true'.
    this.props.options.visibleAtStart === true &&
      this.setState({
        windowVisible: true
      });
  }

  handleButtonClick = e => {
    this.showWindow({
      hideOtherPluginWindows: true,
      runCallback: true
    });
    this.props.app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
  };

  showWindow = opts => {
    const hideOtherPluginWindows = opts.hideOtherPluginWindows || true,
      runCallback = opts.runCallback || true;

    // Don't continue if visibility hasn't changed
    if (this.state.windowVisible === true) {
      return null;
    }

    hideOtherPluginWindows === true && this.props.app.onWindowOpen(this);

    this.setState(
      {
        windowVisible: true
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
    this.setState(
      {
        windowVisible: false
      },
      () => {
        typeof this.props.custom.onWindowHide === "function" &&
          this.props.custom.onWindowHide();
      }
    );
  };

  renderWindow(mode = "window") {
    return (
      <>
        <Window
          globalObserver={this.props.app.globalObserver}
          title={this.title}
          onClose={this.closeWindow}
          open={this.state.windowVisible}
          onResize={this.props.custom.onResize}
          onMaximize={this.props.custom.onMaximize}
          onMinimize={this.props.custom.onMinimize}
          draggingEnabled={this.props.custom.draggingEnabled}
          resizingEnabled={this.props.custom.resizingEnabled}
          scrollable={this.props.custom.scrollable}
          allowMaximizedWindow={this.props.custom.allowMaximizedWindow}
          width={this.width}
          height={this.height}
          position={this.position}
          mode={mode}
          layerswitcherConfig={this.props.app.config.mapConfig.tools.find(
            t => t.type === "layerswitcher"
          )}
        >
          {this.props.children}
        </Window>
        {this.renderDrawerButton()}
        {this.props.options.target === "left" &&
          this.renderWidgetButton("left-column")}
        {this.props.options.target === "right" &&
          this.renderWidgetButton("right-column")}
        {this.props.options.target === "control" && this.renderControlButton()}
      </>
    );
  }

  /**
   * This is a bit of a special case. This method will render
   * not only plugins specified as Drawer plugins (target===toolbar),
   * but it will also render Widget plugins - given some special condition.
   *
   * Those special conditions are small screens, were there's no screen
   * estate to render the Widget button in Map Overlay.
   */
  renderDrawerButton() {
    return createPortal(
      <Hidden mdUp={this.props.options.target !== "toolbar"}>
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
    return (
      // Don't render if "clean" query param is specified, otherwise go on
      this.props.app.config.mapConfig.map.clean !== true && this.renderWindow()
    );
  }
}

export default withStyles(styles)(withTheme(BaseWindowPlugin));
