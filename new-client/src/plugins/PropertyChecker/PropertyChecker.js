import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

// Plugin-specific imports. Most plugins will need a Model, View and Observer but make sure to only create and import whatever you need.
import PropertyCheckerModel from "./PropertyCheckerModel";
import PropertyCheckerView from "./PropertyCheckerView";
import Observer from "react-event-observer";

import ChecklistIcon from "@mui/icons-material/Checklist";

// We might want to import some other classes or constants etc.
import { DEFAULT_MEASUREMENT_SETTINGS } from "./constants";
import DrawModel from "models/DrawModel";

/**
 * @summary Main component for the Dummy-plugin.
 * @description The purpose of having a Dummy plugin is to exemplify
 * and document how plugins should be constructed in Hajk.
 */
function PropertyChecker(props) {
  // Used to keep track of the plugin's current visibility.
  // We will want to do some cleanup later on when the window is hidden.
  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );

  // We will use the DrawModel to catch the map click, draw a point and
  // grab point's coordinates. The convention tells us that we should have
  // a state variable that is used to enable/disable the draw interaction.
  // We will only use "Point" or empty string as values, so this could've been
  // a boolean, but for the sake of convention, we keep it as a string.
  const [drawInteraction, setDrawInteraction] = React.useState("");

  // Initiate the local observer
  const [localObserver] = React.useState(Observer());

  // Initiate the DrawModel
  const [drawModel] = React.useState(
    () =>
      new DrawModel({
        layerName: "pluginPropertyChecker",
        map: props.map,
        measurementSettings: DEFAULT_MEASUREMENT_SETTINGS,
        observer: localObserver,
      })
  );

  // Initiate the model
  const [propertyCheckerModel] = React.useState(
    () =>
      new PropertyCheckerModel({
        app: props.app,
        attributeNameToGroupBy: props.options.attributeNameToGroupBy,
        checkLayerId: props.options.checkLayerId,
        drawModel: drawModel,
        localObserver: localObserver,
        map: props.map,
      })
  );

  // Here's an affect that fires when the pluginShown or activeDrawType state changes. It makes sure to toggle the
  // draw-interaction (either off if the plugin-window has been closed, or to whatever the currentDrawInteraction is set to.
  React.useEffect(() => {
    // If pluginShown is set to false, we toggle the draw-interaction to "" (off).
    if (!pluginShown) {
      return drawModel.toggleDrawInteraction("");
    }
    // Otherwise we'll set it to whatever the current draw-interaction is.
    return drawModel.toggleDrawInteraction(drawInteraction);
  }, [drawModel, drawInteraction, pluginShown]); // We need to keep the drawModel in the dep. arr. since it _could_ change.

  // As soon as a feature is added, disable the draw interaction. We don't want multiple
  // points.
  // const handleFeatureAdded = React.useCallback(
  //   (feature) => {
  //     drawModel.toggleDrawInteraction("");
  //   },
  //   [drawModel]
  // );

  // This effect makes sure to subscribe (and unsubscribe) to the observer-events that we care about.
  // React.useEffect(() => {
  //   // Fires when a feature has been removed from the draw-source.
  //   // localObserver.subscribe("drawModel.featureRemoved", handleFeatureAdded);
  //   // localObserver.subscribe("drawModel.featuresRemoved", handleFeatureAdded);
  //   localObserver.subscribe("drawModel.featureAdded", handleFeatureAdded);
  //   return () => {
  //     // localObserver.unsubscribe("drawModel.featureRemoved");
  //     // localObserver.unsubscribe("drawModel.featuresRemoved");
  //     localObserver.unsubscribe("drawModel.featureAdded", handleFeatureAdded);
  //   };
  // }, [localObserver, handleFeatureAdded]);

  // Fires when the custom header-panel button is clicked. Add more logic and see what happens!
  // const panelHeaderButtonCallback = () => {
  //   console.log("You just clicked the panel-header button!");
  // };

  // We're gonna need to catch if the user closes the window, and make sure to
  // update the local state so that the effect making sure to disable eventual active tools
  // (such as draw, we don't want that active when the plugin-window is closed).
  const onWindowHide = () => {
    setPluginShown(false);
  };

  // We're gonna need to catch if the user opens the window, and make sure to
  // update the local state so that the effect making sure to activate eventual tools
  // (such as draw) that were active before closing the window.
  const onWindowShow = () => {
    setPluginShown(true);
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
      type="propertychecker" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name.
      custom={{
        icon: <ChecklistIcon />, // Custom icon for this plugin
        title: props.options.title || "Fastighetskontroll", // By keeping title and color in Dummy's state we can pass on
        description:
          props.options.description ||
          "Klicka på en fastighet och få fram en lista över vad som gäller", // Shown on Widget button
        // Do you want to add buttons to the plugin-header? That can be done as follows:
        customPanelHeaderButtons: [
          {
            icon: <ChecklistIcon />, // Specify which icon the button should use...
            // onClickCallback: panelHeaderButtonCallback, // ...and which callback should run on click.
          },
        ],
        height: "dynamic", // The height of the plugin-window in px. "dynamic" resizes the window so all content fits, "auto" uses all available space.
        width: 400, // The width of the plugin-window in px.
        onWindowHide: onWindowHide, // Handler for when user closes window.
        onWindowShow: onWindowShow, // Handler for when user shows window.
      }}
    >
      {/* This is the child object of BaseWindowPlugin. It will be displayed
            as content inside the plugin's window. */}
      <PropertyCheckerView
        // Here we send some props to the plugin's View.
        // Make sure to ONLY include props that are ACTUALLY USED in the View.
        app={props.app} // Or even the whole App
        drawInteraction={drawInteraction} // We want to show what the current draw-interaction is in the view.
        drawModel={drawModel}
        globalObserver={props.app.globalObserver} // ... and the global-observer (handling communication within the entire application).
        localObserver={localObserver} // And also the local-observer (handling communication within the plugin)...
        model={propertyCheckerModel} // We can supply our model
        setDrawInteraction={setDrawInteraction} // Finally, we'll pass the updater for the draw-interaction state (so that we can toggle draw on/off).
      />
    </BaseWindowPlugin>
  );
}

export default PropertyChecker;
