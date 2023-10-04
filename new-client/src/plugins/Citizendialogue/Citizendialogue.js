// Generic imports – all plugins need these.
// (BaseWindowPlugin can be substituted with DialogWindowPlugin though.)
//import React from "react";
import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

// Plugin-specific imports. Most plugins will need a Model, View and Observer but make sure to only create and import whatever you need.
import CitizendialogueModel from "./CitizendialogueModel";
import CitizendialogueView from "./CitizendialogueView";
//import EditView from "./EditView.js";
//import EditModel from "./EditModel.js";
import Observer from "react-event-observer";

// All plugins will need to display an icon. Make sure to pick a relevant one from MUI Icons.
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";

// We might want to import some other classes or constants etc.
import { DEFAULT_MEASUREMENT_SETTINGS } from "./constants";
import DrawModel from "models/DrawModel";

/**
 * @summary Main component for the Citizendialogue-plugin.
 * @description The purpose of having a Citizendialogue plugin is to exemplify
 * and document how plugins should be constructed in Hajk.
 */
function Citizendialogue(props) {
  // We're gonna want to keep track of some state... Let's use the State hook.
  // If you want to read up on how state is managed in functional components, see: https://reactjs.org/docs/hooks-state.html
  // There is a more thorough explanation regarding state in ./CitizendialogueView.js
  // Here is an example where we keep track of a state object (kind of like class-based components).
  const [state, setState] = React.useState({
    title: "Medborgardialog",
    color: null,
  });
  // But we can also keep just one variable, allowing us to keep naming etc. clean. The pluginShown state
  // keeps track of wether the plugin is shown or not, and is obviously initiated to the visibleAtStart-option set in admin.
  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );
  // Another state variable we need to keep track off is the current draw-interaction. (Used to tell the drawModel
  // what we want to draw). Since this is an example, we'll keep it simple: It will either be set to "Polygon" or "" (off).
  const [drawInteraction, setDrawInteraction] = React.useState("");
  // We're gonna want to initiate an observer which can be used for communication within the component.
  // We must remember that in functional components all code within the component runs on every render.
  // This means that if we would initiate the observer as follow:
  // [Don't do  this!] const localObserver = Observer(); we would create a new observer on every render... Not good.
  //
  // So how would we combat this? One way would be to use the useRef-hook, as follows:
  // const localObserver = React.useRef(Observer());
  // The useRef hook memoizes the value and does not create a new reference on every render. The drawback
  // of this approach is that in order to access the variable we have to do as follows:
  // const observer = localObserver.current;
  //
  // There is some debate regarding my next statement, but my idea is that the useState hook would be
  // a better fit in this case... Why? Well, we combat the issue with re-assignments on every render (since
  // the useState hook also persists the value) and we do not have to use ".current" property to access the value.
  //
  // Some criticism regarding this approach might be related to rendering issues if we for some reason happen
  // to update the state (which would be cumbersome since we're not exposing the updater) or that we're using
  // an anti-pattern since we're not using the state as intended. I don't agree, especially since the useRef hook
  // is basically the useState hook with some synthetic sugar (useRef is basically useState({current: initialValue})[0]).
  //
  // I hope that the explanation will help you. Anyways, let's initiate the local observer in the following, recommended fashion:
  const [localObserver] = React.useState(Observer());
  // We're also gonna initiate the plugin-model (which should/could hold the plugin's logic, to avoid bloating the components).
  const [citizendialogueModel] = React.useState(
    () =>
      new CitizendialogueModel({
        localObserver: localObserver,
        app: props.app,
        map: props.map,
      })
  );
  // There are some core models that can be used as well. The core models take care of logic that is used in several places in the application.
  // Some example core models are: SearchModel (for searching in WFS etc.), DrawModel (for drawing on the map), KmlModel (for importing/exporting .kml).
  // Let's initiate the DrawModel!
  const [drawModel] = React.useState(
    () =>
      new DrawModel({
        layerName: "pluginCitizendialogue",
        map: props.map,
        observer: localObserver,
        measurementSettings: DEFAULT_MEASUREMENT_SETTINGS,
      })
  );

  // Subscriptions to events etc. should be done in the useEffect hooks. Pay attention to the
  // return (cleanup) function which makes sure to unsubscribe from the event when the component unmounts.
  // More information regarding the useEffect hook can be found in ./CitizendialogueView.js
  React.useEffect(() => {
    const citizendialogueEvent = localObserver.subscribe(
      "citizendialogueEvent",
      (message) => {
        console.log(message);
      }
    );
    // Cleanup function can be created as follows:
    return () => {
      localObserver.unsubscribe(citizendialogueEvent);
    };
  }, [localObserver]); // <-- Dependency array, specifies which objects changes will trigger the effect to run

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

  // Used to update title/color (or any other state variable…). Title and color are passed on to BaseWindowPlugin as props,
  // and will result in updating the Window's color/title. Note that we put this method here, in Citizendialogue.js, and then pass it on
  // to CitizendialogueView as a prop. It is then called in CitizendialogueView when user clicks a button. This is just made for illustrating
  // the concept of passing on props to BaseWindowPlugin from a plugin's view.
  const updateCustomProp = (prop, value) => {
    console.log(`Setting ${prop} to:`, value);
    setState((prevState) => ({ ...prevState, [prop]: value }));
  };

  // Fires when the custom header-panel button is clicked. Add more logic and see what happens!
  const panelHeaderButtonCallback = () => {
    console.log("You just clicked the panel-header button!");
  };

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

  /* const defaultOptions = {
    sources: [],
    // ... other default properties you might want
  };

  const [editModel] = React.useState(
    () =>
      new EditModel({
        map: props.map,
        app: props.app,
        observer: localObserver,
        options: { ...defaultOptions, ...props.options },
      })
  );*/

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
      type="Citizendialogue" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name.
      custom={{
        icon: <AppRegistrationIcon />, // Custom icon for this plugin
        title: state.title, // By keeping title and color in Citizendialogue's state we can pass on
        color: state.color, // the changes to BaseWindowPlugin which will update internal state too.
        description: "En kort beskrivning som visas i widgeten", // Shown on Widget button
        // Do you want to add buttons to the plugin-header? That can be done as follows:
        customPanelHeaderButtons: [
          {
            icon: <AppRegistrationIcon />, // Specify which icon the button should use...
            onClickCallback: panelHeaderButtonCallback, // ...and which callback should run on click.
          },
        ],
        height: "dynamic", // The height of the plugin-window in px. "dynamic" resizes the window so all content fits, "auto" uses all available space.
        width: 600, // The width of the plugin-window in px.
        onWindowHide: onWindowHide, // Handler for when user closes window.
        onWindowShow: onWindowShow, // Handler for when user shows window.
      }}
    >
      <div>
        {/* This is the child object of BaseWindowPlugin. It will be displayed
            as content inside the plugin's window. */}
        <CitizendialogueView
          {...props}
          // Here we send some props to the plugin's View.
          // Make sure to ONLY include props that are ACTUALLY USED in the View.
          model={citizendialogueModel} // We can supply our model
          app={props.app} // Or even the whole App
          localObserver={localObserver} // And also the local-observer (handling communication within the plugin)...
          globalObserver={props.app.globalObserver} // ... and the global-observer (handling communication within the entire application).
          updateCustomProp={updateCustomProp} // We're also gonna pass a function that we can use to update the state in this (the parent) component.
          drawInteraction={drawInteraction} // We want to show what the current draw-interaction is in the view.
          setDrawInteraction={setDrawInteraction} // Finally, we'll pass the updater for the draw-interaction state (so that we can toggle draw on/off).
        />
        {/*<EditView app={props.app} model={editModel} observer={localObserver} />*/}
      </div>
    </BaseWindowPlugin>
  );
}

export default Citizendialogue;
