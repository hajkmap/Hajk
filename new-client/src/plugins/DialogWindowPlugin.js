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

import Card from "components/Card";
import Dialog from "components/Dialog/Dialog";
import PluginControlButton from "components/PluginControlButton";

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

    // TODO: Use LocalStorageHelper so we have a per-map-setting here…
    if (this.opts.visibleAtStart === true) {
      if (
        this.opts.showOnlyOnce === true &&
        parseInt(window.localStorage.getItem(localStorageKey)) === 1
      ) {
        dialogOpen = false;
      } else {
        if (this.opts.showOnlyOnce === true) {
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
  }

  #pluginIsWidget = (target) => {
    return ["left", "right"].includes(target);
  };

  #handleButtonClick = (e) => {
    this.setState({
      dialogOpen: true,
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
   * but it will also render Widget plugins - given some special condition.
   *
   * Those special conditions are small screens, where there's no screen
   * estate to render the Widget button in Map Overlay.
   */
  renderDrawerButton() {
    return createPortal(
      <Hidden mdUp={this.#pluginIsWidget(this.opts.target)}>
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
      <Hidden smDown>
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
      <PluginControlButton
        icon={this.icon}
        onClick={this.#handleButtonClick}
        title={this.title}
        abstract={this.description}
      />,
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
          {/* Drawer buttons and Widget buttons should render a Drawer button. */}
          {(target === "toolbar" || this.#pluginIsWidget(target)) &&
            this.renderDrawerButton()}
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
