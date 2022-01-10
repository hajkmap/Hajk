import React from "react";
import { createPortal } from "react-dom";
import { withTheme } from "@material-ui/styles";

import {
  Hidden,
  Icon,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";

import Card from "components/Card";
import Dialog from "components/Dialog/Dialog";
import PluginControlButton from "components/PluginControlButton";

class DialogWindowPlugin extends React.PureComponent {
  state = {
    dialogOpen: false, // Will be taken care of in componentDidMount
  };

  constructor(props) {
    super(props);

    // Many plugins may use this class. Each plugin will have it's unique "type".
    // Some plugins, such as InfoDialog, will also provide a "name" property as
    // an option, to further identify its different instances.
    // We use this information to create a (hopefully) truly unique key, used
    // for local storage settings.
    this.uniqueIdentifier = `${props.type.toLowerCase()}${
      props.options.name ? "." + props.options.name : ""
    }`;

    this.title =
      props.options.title || props.defaults.title || "Unnamed plugin";
    this.description =
      props.options.description ||
      props.defaults.description ||
      "No description provided";

    // Allow Admin UI to provide an icon (as a string that will be turned to
    // a ligature by the MUI Icon component), or fall back to the default icon
    // provided by the creator of the plugin that's using DialogWindowPlugin.
    this.icon = props.options.icon ? (
      <Icon>{props.options.icon}</Icon>
    ) : (
      props.defaults.icon
    );
  }

  componentDidMount() {
    let dialogOpen = this.props.options.visibleAtStart;
    const localStorageKey = `plugin.${this.uniqueIdentifier}.alreadyShown`;

    // TODO: Use LocalStorageHelper so we have a per-map-setting here…
    if (this.props.options.visibleAtStart === true) {
      if (
        this.props.options.showOnlyOnce === true &&
        parseInt(window.localStorage.getItem(localStorageKey)) === 1
      ) {
        dialogOpen = false;
      } else {
        if (this.props.options.showOnlyOnce === true) {
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
    this.setState({
      dialogOpen: false,
    });
  };

  renderDialog() {
    return createPortal(
      <Dialog
        options={this.props.options}
        open={this.state.dialogOpen}
        onClose={this.#onClose}
      />,
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
      <Hidden mdUp={this.#pluginIsWidget(this.props.options.target)}>
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
    const { target } = this.props.options;
    return (
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
    );
  }
}

export default withTheme(DialogWindowPlugin);
