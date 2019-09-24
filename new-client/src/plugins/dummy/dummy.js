// Generic imports – all plugins need these
import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

// All plugins need some icon – make sure to pick a relevant one from Material UI Icons
import BugReportIcon from "@material-ui/icons/BugReport";

// Finally plugin-specific imports. Most plugins will need Model, View and Observer.
import DummyModel from "./DummyModel";
import DummyView from "./DummyView";
import Observer from "react-event-observer";

class Dummy extends React.PureComponent {
  constructor(props) {
    super(props);

    // We can setup a local observer to allow sending messages between here and model/view.
    // It's called 'localObserver' to distinguish it from AppModel's globalObserver.
    this.localObserver = Observer();

    // Once created, we can observer listen for events with a distinct name. When events
    // are published form somewhere else, the callback here will be run.
    this.localObserver.subscribe("dummyEvent", message => {});

    // Initiate a model. Although optional, it will probably be used for all except the most simple plugins.
    // In this example, we make our localObserver available for the model as well. This makes it possible
    // to send events between model and main plugin controller.
    this.dummyModel = new DummyModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver
    });
  }

  /**
   * Render is now super-simplified compared to previous versions of Hajk3.
   *
   * All common functionality that has to do with showing a Window, and rendering
   * Drawer or Widget buttons, as well as keeping the state of Window, are now
   * abstracted away to BaseWindowPlugin Component.
   *
   * It's important to pass on all the props from here to our "parent" component.
   *
   * Also, we add a new prop, "custom", which holds props that are specific to this
   * given implementation, such as the icon to be shown, or this plugin's title.
   */
  render() {
    return (
      <BaseWindowPlugin
        {...this.props} // Pass on all props
        type={this.constructor.name}
        custom={{
          icon: <BugReportIcon />, // Custom icon for this plugin
          title: "Dummy", // Custom title, etc
          description: "En kort beskrivning som visas i widgeten",
          height: 450, // Custom height/width etc | Use "auto" for automatic or leave undefined
          width: 400,
          top: undefined, // If undefined, it will fallback to BaseWindowPlugin's defaults
          left: undefined
        }}
      >
        {/* This is the child object of BaseWindowPlugin. It will be displayed
            as content inside the plugin's window. */}
        <DummyView
          // Here we send some props to the plugin's View.
          // Make sure to ONLY include props that are ACTUALLY USED in the View.
          model={this.dummyModel} // We can supply our model
          app={this.props.app} // Or even the whole App
          localObserver={this.localObserver} // And also the Observer, so that those 2 can talk through it
        />
      </BaseWindowPlugin>
    );
  }
}

// Part of API. Make a HOC of our plugin.
export default Dummy;
