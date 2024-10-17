import React from "react";
import { createPortal } from "react-dom";
import { withTheme } from "@emotion/react";

import {
  Hidden,
  Icon,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import Card from "../components/Card";
import Dialog from "../components/Dialog/Dialog";
import PluginControlButton from "../components/PluginControlButton";

class DialogWindowPlugin extends React.PureComponent {
  state = {
    dialogOpen: false, // Will be taken care of in componentDidMount
  };

  constructor(props) {
    super(props);

    // Merge options with defaults
    this.opts = { ...props.defaults, ...props.options };

    // Many plugins may use this class. Each plugin will have it's unique "type".
    // Some plugins, such as InfoDialog, will also provide a "name" property as
    // an option, to further identify its different instances.
    // We use this information to create a (hopefully) truly unique key, used
    // for local storage settings.
    this.uniqueIdentifier = `${props.type.toLowerCase()}${
      this.opts.name ? "." + this.opts.name : ""
    }`;

    this.title = this.opts.title || "Unnamed plugin";
    this.description = this.opts.description || "No description provided";

    // Allow Admin UI to provide an icon (as a string that will be turned to
    // a ligature by the MUI Icon component), or fall back to the default icon
    // provided by the creator of the plugin that's using DialogWindowPlugin.
    this.icon =
      typeof this.opts.icon === "string" ? (
        <Icon>{this.opts.icon}</Icon>
      ) : (
        this.opts.icon
      );
  }

  componentDidMount() {
    let dialogOpen = this.opts.visibleAtStart;
    const localStorageKey = `plugin.${this.uniqueIdentifier}.alreadyShown`;
    const clean = this.props.app.config.mapConfig.map.clean;

    // TODO: Use LocalStorageHelper so we have a per-map-setting here…
    // No need to continue if we're in clean mode.
    if (clean === false && this.opts.visibleAtStart === true) {
      // If clean mode is false and visibleAtStart is true, however,
      // check if showOnlyOnce is true.
      if (
        this.opts.showOnlyOnce === true &&
        parseInt(window.localStorage.getItem(localStorageKey)) === 1
      ) {
        // If yes - don't show the dialog on load anymore.
        dialogOpen = false;
      } else {
        // If not - check if showOnlyOnce is true and…
        if (this.opts.showOnlyOnce === true) {
          // if yes, store the setting in local storage.
          window.localStorage.setItem(localStorageKey, 1);
        }
        dialogOpen = true;
      }
    } else {
      dialogOpen = false;
    }

    this.setState({
      dialogOpen,
    });

    // If plugin is shown at start, we want to register it as shown in the Analytics module too.
    // Normally, the event would be sent when user clicks on the button that activates the plugin,
    // but in this case there won't be any click as the window will be visible at start.
    if (dialogOpen) {
      // Tell the Analytics model about this
      this.props.app.globalObserver.publish("analytics.trackEvent", {
        eventName: "pluginShown",
        pluginName: this.uniqueIdentifier,
        activeMap: this.props.app.config.activeMap,
      });
    }

    // Subscribe to a global event that makes it possible to show this dialog.
    // First we prepare a unique event name for each plugin so it looks like '{pluginName}.showWindow'.
    const eventName = `${this.uniqueIdentifier}.showWindow`;
    // Next, subscribe to that event, expect 'opts' array.
    // To find all places where this event is publish, search for 'globalObserver.publish("show'
    this.props.app.globalObserver.subscribe(eventName, (opts = {}) => {
      this.setState({ dialogOpen: true });
    });
  }

  #pluginIsWidget = (target) => {
    return ["left", "right"].includes(target);
  };

  #handleButtonClick = (e) => {
    this.setState({
      dialogOpen: true,
    });

    // Tell the Analytics model about this
    this.props.app.globalObserver.publish("analytics.trackEvent", {
      eventName: "pluginShown",
      pluginName: this.uniqueIdentifier,
      activeMap: this.props.app.config.activeMap,
    });

    // AppModel keeps track of recently shown plugins.
    this.props.app.pushPluginIntoHistory({
      type: this.uniqueIdentifier,
      icon: this.icon,
      title: this.title,
      description: this.description,
    });
  };

  #onClose = () => {
    typeof this.opts.onClose === "function" && this.opts.onAClose();
    this.setState({
      dialogOpen: false,
    });
  };

  #onAbort = () => {
    typeof this.opts.onAbort === "function" && this.opts.onAbort();
    this.setState({
      dialogOpen: false,
    });
  };

  renderDialog() {
    return createPortal(
      <Dialog
        options={this.opts}
        open={this.state.dialogOpen}
        onClose={this.#onClose}
        onAbort={this.#onAbort}
      >
        {this.props.children}
      </Dialog>,
      document.getElementById("windows-container")
    );
  }

  /**
   * This is a bit of a special case. This method will render
   * not only plugins specified as Drawer plugins (target===toolbar),
   * but it will also render Widget and Control plugins - given some special condition.
   *
   * Those special conditions are small screens, where there's no screen
   * estate to render the Widget button in Map Overlay.
   */
  renderDrawerButton() {
    return createPortal(
      <Hidden
        mdUp={
          this.#pluginIsWidget(this.opts.target) ||
          this.opts.target === "control"
        }
      >
        <ListItem
          button
          divider={true}
          selected={this.state.dialogOpen}
          onClick={this.#handleButtonClick}
        >
          <ListItemIcon>{this.icon}</ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
      </Hidden>,
      document.getElementById("plugin-buttons")
    );
  }

  renderWidgetButton(id) {
    return createPortal(
      // Hide Widget button on small screens, see renderDrawerButton too
      <Hidden mdDown>
        <Card
          icon={this.icon}
          onClick={this.#handleButtonClick}
          title={this.title}
          abstract={this.description}
        />
      </Hidden>,
      document.getElementById(id)
    );
  }

  renderControlButton() {
    return createPortal(
      // Hide Control button on small screens, see renderDrawerButton too
      <Hidden mdDown>
        <PluginControlButton
          icon={this.icon}
          onClick={this.#handleButtonClick}
          title={this.title}
          abstract={this.description}
        />
      </Hidden>,
      document.getElementById("plugin-control-buttons")
    );
  }

  render() {
    const { target } = this.opts;
    return (
      // Don't render if "clean" query param is specified, otherwise go on
      this.props.app.config.mapConfig.map.clean !== true && (
        <>
          {this.renderDialog()}
          {/* Always render a Drawer button unless its target is "hidden". 
              It's a backup for plugins render elsewhere: we hide 
              Widget and Control buttons on small screens and fall 
              back to Drawer button). */}
          {target !== "hidden" && this.renderDrawerButton()}
          {/* Widget buttons must also render a Widget */}
          {this.#pluginIsWidget(target) &&
            this.renderWidgetButton(`${target}-column`)}
          {/* Finally, render a Control button if target has that value */}
          {target === "control" && this.renderControlButton()}
        </>
      )
    );
  }
}

export default withTheme(DialogWindowPlugin);
