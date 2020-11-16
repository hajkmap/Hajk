// Generic imports – all plugins need these
import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

// Plugin-specific imports. Most plugins will need a Model, View and Observer
// but make sure to only create and import whatever you need.
import TimeSliderModel from "./TimeSliderModel";
import TimeSliderView from "./TimeSliderView";
import Observer from "react-event-observer";

import UpdateIcon from "@material-ui/icons/Update";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";

/**
 * @summary Main class for the TimeSlider plugin.
 * @description The purpose of having a TimeSlider plugin is to exemplify
 * and document how plugins should be constructed in Hajk.
 * The plugins can also serve as a scaffold for other plugins: simply
 * copy the directory, rename it and all files within, and change logic
 * to create the plugin you want to.
 *
 * @class TimeSlider
 * @extends {React.PureComponent}
 */
class TimeSlider extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    title: "TimeSlider",
    color: null,
    playing: false,
  };

  // propTypes and defaultProps are static properties, declared
  // as high as possible within the component code. They should
  // be immediately visible to other devs reading the file,
  // since they serve as documentation.
  // If unsure of what propTypes are or how to use them, see https://reactjs.org/docs/typechecking-with-proptypes.html.
  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
  };

  static defaultProps = {
    options: {},
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
    // we subscribe to "TimeSliderEvent" When "TimeSliderEvent" is published (from somewhere else)
    // the callback below will be run, with "message" as an optional param.
    this.localObserver.subscribe("TimeSliderEvent", (message) => {
      console.log(message);
    });

    // Initiate a model. Although optional, it will probably be used for all except the most simple plugins.
    // In this example, we make our localObserver available for the model as well. This makes it possible
    // to send events between model and main plugin controller.
    this.TimeSliderModel = new TimeSliderModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map,
    });
  }

  onWindowShow = () => {
    this.localObserver.publish("showTimeLineLayers", this.props.options.layers);
  };

  onWindowHide = () => {
    this.localObserver.publish("hideTimeLineLayers", this.props.options.layers);
  };

  // Used to update title/color (or any other state variable…).
  // Title and color are passed on to BaseWindowPlugin as props,
  // and will result in updating the Window's color/title.
  // Note that we put this method here, in TimeSlider.js, and then pass
  // it on to TimeSliderView as a prop. It is then called in TimeSliderView
  // when user clicks a button. This is just made for illustrating
  // the concept of passing on props to BaseWindowPlugin from a
  // plugin's view.
  updateCustomProp = (prop, value) => {
    this.setState({ [prop]: value });
  };

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
        type="TimeSlider" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name
        custom={{
          icon: <UpdateIcon />, // Custom icon for this plugin
          title: this.state.title, // By keeping title and color in TimeSlider's state we can pass on
          color: this.state.color, // the changes to BaseWindowPlugin which will update internal state too.
          description: "En kort beskrivning som visas i widgeten", // Shown on Widget button
          customPanelHeaderButtons: [
            {
              //Add extra buttons to window-header with a specified onClickCallback
              icon: !this.state.playing ? <PlayArrowIcon /> : <PauseIcon />,
              onClickCallback: () => {
                this.setState(
                  {
                    playing: !this.state.playing,
                  },
                  () => {
                    this.localObserver.publish(
                      "toggleTimeSlider",
                      this.state.playing
                    );
                  }
                );
              },
            },
          ],
          height: 450, // Custom height/width etc | Use "auto" for automatic or leave undefined
          width: 400,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
        }}
      >
        {/* This is the child object of BaseWindowPlugin. It will be displayed
            as content inside the plugin's window. */}
        <TimeSliderView
          // Here we send some props to the plugin's View.
          // Make sure to ONLY include props that are ACTUALLY USED in the View.
          model={this.TimeSliderModel} // We can supply our model
          app={this.props.app} // Or even the whole App
          map={this.props.map}
          localObserver={this.localObserver} // And also the Observer, so that those 2 can talk through it
          updateCustomProp={this.updateCustomProp}
          options={this.props.options}
        />
      </BaseWindowPlugin>
    );
  }
}

// Part of API. Make a HOC of our plugin.
export default TimeSlider;
