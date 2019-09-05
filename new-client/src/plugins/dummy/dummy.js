// Generic imports – all plugins need these
import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";

// In pretty much all cases, you'll want your plugin to render something.
// There are currently two available ways: Window or Panel.
// Most plugins (except those super simple) will need Window. Note that
// Window has two render modes, either as 'panel' or as 'window' (yeah, it's a bit confusing).
// You set Window's render mode using a prop to the Window component.
import Window from "../../components/Window.js";

// The following imports can be changed, depending on desired appearance of the plugin.
// If you want your plugin to be renderable in Toolbar and as Floating Action Button, you
// need both the List* and Button imports.
// Don't forget to change the icon though!
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import { Button } from "@material-ui/core";
import BugReportIcon from "@material-ui/icons/BugReport";

// Finally there are some plugin-specific imports. Most plugins will need Model, View and Observer.
// Panel is optional – you could use a Dialog or something else. This Dummy uses a Panel as an
// example though.
import DummyView from "./DummyView";
import DummyModel from "./DummyModel";
import Observer from "react-event-observer";

// You can customize the look and feel of your plugin using theme overrides.
// See docs: https://material-ui.com/customization/themes/
const styles = theme => {
  return {};
};

class Dummy extends React.PureComponent {
  // In native ES6 class the default state should be sat like this, outside the constructor.
  // Important, part of API: Make sure to respect panel visibility set in config.
  state = {
    panelOpen: this.props.options.visibleAtStart
  };

  // Important, part of API for plugins that contain panels.
  // When another plugin calls this.app.onPanelOpen, all other plugins
  // that are registered as panel will hide themselves. In other words,
  // if your plugin (for some reason) should not be hidden when other plugin
  // opens, you could modify the function below to just do nothing. But don't
  // remove it entirely as every plugin is assumed to have a method named closePanel().
  closePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  // Called when plugin's <ListItem> or widget <Button> is clicked
  onClick = e => {
    // Tell App to call closePanel() on all other plugins. If your plugin
    // doesn't need to hide other plugins when it opens, you can omit this method.
    this.app.onPanelOpen(this);

    // When user clicks the button to activate this plugin, set state of panelOpen to true.
    // The value of panelOpen is being watched for in methods that render the actual Window/Panel.
    this.setState({
      panelOpen: true
    });
  };

  constructor(props) {
    super(props);
    this.options = props.options;

    // Important, part of API. Will be visible in Window's head and next to button (if toolbar item). Could be fetched from config.
    this.title = this.options.title || "Dummy plugin";

    this.app = props.app;

    // Optionally setup a local observer to allow sending messages between here and model/view.
    // It's called 'localObserver' to distinguish it from AppModel's observer, that we call 'globalObserver'.
    this.localObserver = Observer();
    // Example on how to make observer listen for "myEvent" event sent from elsewhere
    this.localObserver.subscribe("dummyEvent", message => {
      console.log(message);
    });

    // Initiate a model. Although optional, will probably be used for all except the most simple plugins.
    // In this example, we make our localObserver available for the model as well. This makes it possible
    // to send events between model and main plugin controller.
    this.dummyModel = new DummyModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver
    });

    // Important, part of API for plugins that contain panels. Makes App aware of this panels existance.
    // Without this, the app won't know that your plugin exists.
    this.app.registerPanel(this);
  }

  // If you choose to extend React.Component, instead of React.PureComponent, make sure to un-comment
  // this method. It will check if render is necessary, and avoid re-rendering if current panel has not changed its state.
  // NB: The preferred way is to make plugins that extend PureComponent, hence this method is not needed as
  // PureComponents already implement 'shouldComponentUpdate()'.
  /* shouldComponentUpdate(nextProps, nextState) {
    return this.state.panelOpen !== nextState.panelOpen;
  } */

  // The renderWindow method is not part of the API but rather convention.
  // Please try to stick to the convention as it makes it easier to recognize logic flow in other people's plugins.
  renderWindow(mode) {
    // Using Portals (see React docs) we render our Window (or Panel) in another <div>. Which <div> it is
    // depends on whether the browser is a mobile or desktop.
    // Value of 'mode' parameter determines whether the Window will render as a free floating window, or a "sticky" panel.
    return createPortal(
      <Window
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        position={this.position}
        height={450}
        width={400}
        top={210}
        left={0}
        mode={mode}
      >
        {/* */}
        <DummyView
          // Here you send some props to the plugin's View.
          // Note that normally you don't need to give the View access to BOTH Observer and Model,
          // one of those is sufficient, as Model will mostly already have access to the Observer.
          // So, for performance reasons, make sure to ONLY include props that are ACTUALLY USED in the View.
          // map={this.map} // You can send the map
          localObserver={this.localObserver} // You can send the Observer
          model={this.dummyModel} // Etc...
          app={this.app} // Or even the whole App
        />
      </Window>,
      document.getElementById("windows-container")
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
          aria-label="Dummy plugin"
          className={classes.button}
          onClick={this.onClick}
        >
          <BugReportIcon />
        </Button>
        {this.renderWindow("window")}
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
            <BugReportIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
        {this.renderWindow("panel")}
      </div>
    );
  }

  // Depending on how the plugin has been configured (in Hajk's admin GUI),
  // render it as either toolbar item or a free floating action button (aka widget).
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

// Part of API. Make a HOC of our plugin.
export default withStyles(styles)(Dummy);
