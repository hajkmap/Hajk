import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import SchoolIcon from "@material-ui/icons/Adjust";
import Panel from "../../components/Panel.js";
import BufferView from "./BufferView.js";
import BufferModel from "./BufferModel.js";
import Observer from "react-event-observer";

const styles = theme => {
  return {};
};

class buffer extends Component {
  // In native ES6 class we can set state like this, outside the constructor
  state = {
    panelOpen: false
  };

  // Called when plugin's <ListItem> or widget <Button> is clicked
  onClick = e => {
    // Callback that loops through app's panels and calls closePanel() on all except current
    this.app.onPanelOpen(this);

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

  constructor(spec) {
    super(spec);
    // Important, part of API. Must be a string. Could be fetched from config.
    this.text = "Skapa buffertzon";
    this.app = spec.app;

    // Optionally setup an observer to allow sending messages between here and model/view
    this.observer = Observer();
    // Example on how to make observer listen for "myEvent" event sent from elsewhere
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });

    // Initiate a model. Although optional, will probably be used for all except the most simple plugins.
    this.BufferModel = new BufferModel({
      map: spec.map,
      app: spec.app,
      observer: this.observer
    });

    // Important, part of API for plugins that contain panels. Makes App aware of this panels existance.
    this.app.registerPanel(this);
  }

  // Important, part of API. Avoid re-rendering if current panel has not changed its state.
  shouldComponentUpdate(nextProps, nextState) {
    return this.state.panelOpen !== nextState.panelOpen;
  }

  // Important, part of API. Make sure to respect panel visibility set in config.
  componentWillMount() {
    this.setState({
      panelOpen: this.props.options.visibleAtStart
    });
  }

  // Not part of API but rather convention. If plugin has a panel, its render method should be called renderPanel().
  renderPanel() {
    // Using Portals (see React docs) we render panel not in direct relation in DOM to the button, but rather in #map-overlay <div>.
    // We make use of <Panel>, a component that encapsulates MUI's Drawer, that we've written to reuse across Hajk's plugins.

    return createPortal(
      <Panel
        title={this.text}
        onClose={this.closePanel}
        position="left"
        open={this.state.panelOpen}
      >
        <BufferView
          app={this.app}
          map={this.map}
          parent={this}
          observer={this.observer}
        />
      </Panel>,
      document.getElementById("map-overlay")
    );
  }

  /* 
   * Important, part of plugins API.
   * Each plugin must present both renderAsWidgetItem and renderAsToolbarItem.
   * Depending on user's preferred location, App will render the plugin
   * using one of these two methods.
  */

  // Render as a FAB (floating action button, https://material-ui.com/demos/buttons/#floating-action-buttons)
  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <div>
        <Button
          variant="fab"
          color="default"
          aria-label="Skapa buffertzon"
          className={classes.button}
          onClick={this.onClick}
        >
          <SchoolIcon />
        </Button>
        {this.renderPanel()}
      </div>
    );
  }

  // Render as a toolbar item, https://material-ui.com/demos/lists/
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
            <SchoolIcon />
          </ListItemIcon>
          <ListItemText primary={this.text} />
        </ListItem>
        {this.renderPanel()}
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

export default withStyles(styles)(buffer);
