import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

// Plugin-specific imports. Most plugins will need a Model, View and Observer but make sure to only create and import whatever you need.
import AudioGuideModel from "./AudioGuideModel.js";
import AudioGuideView from "./AudioGuideView.js";
import Observer from "react-event-observer";

import ChecklistIcon from "@mui/icons-material/Checklist";
import HelpIcon from "@mui/icons-material/Help";

/**
 * @summary Main component for the Dummy-plugin.
 * @description The purpose of having a Dummy plugin is to exemplify
 * and document how plugins should be constructed in Hajk.
 */
function AudioGuide(props) {
  console.log("AudioGuide render: ", props);

  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );

  // Initiate the local observer
  const [localObserver] = React.useState(Observer());

  // Initiate the model
  const [audioGuideModel] = React.useState(
    () =>
      new AudioGuideModel({
        app: props.app,
        localObserver: localObserver,
        map: props.map,
        options: props.options,
      })
  );

  const onWindowHide = () => {
    setPluginShown(false);
  };

  // We're gonna need to catch if the user opens the window, and make sure to
  // update the local state so that the effect making sure to activate eventual tools
  // (such as draw) that were active before closing the window.
  const onWindowShow = () => {
    setPluginShown(true);
  };

  const showInfoDialog = () => {
    localObserver.publish("showInfoDialog");
  };

  // Render is now super-simplified compared to previous versions of Hajk.
  // All common functionality that has to do with showing a Window, and rendering
  // Drawer or Widget buttons, as well as keeping the state of Window, are now
  // abstracted away to BaseWindowPlugin Component.
  //
  // It's important to pass on all the props from here to our "parent" component.
  //
  // Also, we add a new prop, "custom", which holds props that are specific to this
  // given implementation, such as the icon to be shown, or this plugin's title.
  return (
    <BaseWindowPlugin
      {...props} // Pass on all the props...
      type="audioguide" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name.
      custom={{
        icon: <ChecklistIcon />, // Custom icon for this plugin
        title: props.options.title || "AudioGuide", // By keeping title and color in Dummy's state we can pass on
        description:
          props.options.description ||
          "Ta en promenad och lyssna på våra guider", // Shown on Widget button
        // Do you want to add buttons to the plugin-header? That can be done as follows:
        customPanelHeaderButtons: [
          {
            icon: <HelpIcon />, // Specify which icon the button should use...
            onClickCallback: showInfoDialog, // ...and which callback should run on click.
          },
        ],
        height: "dynamic", // The height of the plugin-window in px. "dynamic" resizes the window so all content fits, "auto" uses all available space.
        width: 500, // The width of the plugin-window in px.
        onWindowHide: onWindowHide, // Handler for when user closes window.
        onWindowShow: onWindowShow, // Handler for when user shows window.
      }}
    >
      {/* This is the child object of BaseWindowPlugin. It will be displayed
            as content inside the plugin's window. */}
      <AudioGuideView
        // Here we send some props to the plugin's View.
        // Make sure to ONLY include props that are ACTUALLY USED in the View.
        app={props.app} // Or even the whole App
        globalObserver={props.app.globalObserver} // ... and the global-observer (handling communication within the entire application).
        localObserver={localObserver} // And also the local-observer (handling communication within the plugin)...
        map={props.map}
        model={audioGuideModel} // We can supply our model
        options={props.options}
      />
    </BaseWindowPlugin>
  );
}

export default AudioGuide;
