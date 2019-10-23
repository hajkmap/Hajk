// Generic imports – all plugins need these
import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

// Plugin-specific imports. Most plugins will need a Model, View and Observer
// but make sure to only create and import whatever you need.
import DummyModel from "./DummyModel";
import DummyView from "./DummyView";
import Observer from "react-event-observer";

// All plugins will need to display an icon. Make sure to pick a relevant one from Material UI Icons.
import BugReportIcon from "@material-ui/icons/BugReport";

/**
 * @summary Main class for the Dummy plugin.
 * @description The purpose of having a Dummy plugin is to exemplify
 * and document how plugins should be constructed in Hajk.
 * The plugins can also serve as a scaffold for other plugins: simply
 * copy the directory, rename it and all files within, and change logic
 * to create the plugin you want to.
 *
 * @class Dummy
 * @extends {React.PureComponent}
 */
class Dummy extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {};

  // propTypes and defaultProps are static properties, declared
  // as high as possible within the component code. They should
  // be immediately visible to other devs reading the file,
  // since they serve as documentation.
  // If unsure of what propTypes are or how to use them, see https://reactjs.org/docs/typechecking-with-proptypes.html.
  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
  };

  constructor(props) {
    // Unsure why we write "super(props)"?
    // See https://overreacted.io/why-do-we-write-super-props/ for explanation.
    super(props);

    // We can setup a local observer to allow sending messages between here (controller) and model/view.
    // It's called 'localObserver' to distinguish it from AppModel's globalObserver.
    // API docs, see: https://www.npmjs.com/package/react-event-observer
    this.localObserver = Observer();

    // Once created, the observer can subscribe to events with a distinct name. In this example
    // we subscribe to "dummyEvent" When "dummyEvent" is published (from somewhere else)
    // the callback below will be run, with "message" as an optional param.
    this.localObserver.subscribe("dummyEvent", message => {
      console.log(message);
    });

    // Initiate a model. Although optional, it will probably be used for all except the most simple plugins.
    // In this example, we make our localObserver available for the model as well. This makes it possible
    // to send events between model and main plugin controller.
    this.dummyModel = new DummyModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map
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
        type="Dummy" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name
        custom={{
          icon: <BugReportIcon />, // Custom icon for this plugin
          title: "Dummy", // Custom title (will be shown in Window's toolbar and on the Drawer/Widget button)
          description: "En kort beskrivning som visas i widgeten", // Shown on Widget button
          height: 450, // Custom height/width etc | Use "auto" for automatic or leave undefined
          width: 400
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
