import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";

import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Button
} from "@material-ui/core";
import NavigationIcon from "@material-ui/icons/Navigation";

import Window from "../../components/Window.js";
import { isMobile } from "../../utils/IsMobile.js";

import LocationView from "./LocationView";

const styles = theme => {
  return {};
};

class Location extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
  };

  // Called when plugin's <ListItem> or widget <Button> is clicked
  onClick = e => {
    // Callback that loops through app's panels and calls closePanel() on all except current
    this.props.app.onPanelOpen(this);

    // This state variable is being watched for in render() and decides whether MUI Component <Drawer> is open or not
    this.setState({
      panelOpen: true
    });
  };

  // Important, part of API for plugins that contain panels.
  closePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  constructor(props) {
    super(props);
    this.options = props.options;

    // Important, part of API. Must be a string. Could be fetched from config.
    this.title = this.options.title || "GPS";

    // Important, part of API for plugins that contain panels. Makes App aware of this panels existence.
    this.props.app.registerPanel(this);
  }

  // Note: as we experiment with PureComponents, this has been out-commented.
  // Important, part of API. Avoid re-rendering if current panel has not changed its state.
  // shouldComponentUpdate(nextProps, nextState) {
  //   return this.state.panelOpen !== nextState.panelOpen;
  // }

  // Not part of API but rather convention. If plugin has a panel, its render method should be called renderPanel().
  renderWindow(mode) {
    return createPortal(
      <Window
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        width="400px"
        height={window.innerHeight - 380 + "px"}
        top={210}
        left={5}
        mode={mode}
      >
        <LocationView parent={this} />
      </Window>,
      document.getElementById(isMobile ? "app" : "toolbar-panel")
    );
  }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <div>
        <Button
          variant="fab"
          color="default"
          aria-label="Location plugin"
          className={classes.button}
          onClick={this.onClick}
        >
          <NavigationIcon />
        </Button>
        {this.renderWindow("window")}
      </div>
    );
  }

  renderAsToolbarItem() {
    return (
      <div>
        <ListItem
          button
          divider={true}
          selected={this.state.panelOpen}
          onClick={this.onClick}
        >
          <ListItemIcon>
            <NavigationIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
        {this.renderWindow("panel")}
      </div>
    );
  }

  render() {
    if (this.props.type === "toolbarItem") {
      return this.renderAsToolbarItem();
    }

    if (this.props.type === "widgetItem") {
      return this.renderAsWidgetItem();
    }

    return null;
  }
}

export default withStyles(styles)(Location);
