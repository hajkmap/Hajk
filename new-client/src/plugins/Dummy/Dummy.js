// Generic imports – all plugins need these.
// (BaseWindowPlugin can be substituted with DialogWindowPlugin though.)
import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

// Plugin-specific imports. Most plugins will need a Model, View and Observer but make sure to only create and import whatever you need.
import DummyModel from "./DummyModel";
import DummyView from "./DummyView";
import Observer from "react-event-observer";

// All plugins will need to display an icon. Make sure to pick a relevant one from MUI Icons.
import BugReportIcon from "@mui/icons-material/BugReport";

/**
 * @summary Main component for the Dummy-plugin.
 * @description The purpose of having a Dummy plugin is to exemplify
 * and document how plugins should be constructed in Hajk.
 */
function Dummy(props) {
  // We're gonna want to keep track of some state... Let's use the State hook.
  // If you want to read up on how state is managed in functional components, see: https://reactjs.org/docs/hooks-state.html
  // There is a more thorough explanation regarding state in ./DummyView.js
  const [state, setState] = React.useState({ title: "Dummy", color: null });
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
  // We're also gonna initiate the model (which should/could hold the plugin's logic, so we're not bloating the components).
  const [dummyModel] = React.useState(
    new DummyModel({
      localObserver: localObserver,
      app: props.app,
      map: props.map,
    })
  );

  // Subscriptions to events etc. should be done in the useEffect hooks. Pay attention to the
  // return (cleanup) function which makes sure to unsubscribe from the event when the component unmounts.
  // More information regarding the useEffect hook can be found in ./DummyView.js
  React.useEffect(() => {
    const dummyEvent = localObserver.subscribe("dummyEvent", (message) => {
      console.log(message);
    });
    // Cleanup function can be created as follows:
    return () => {
      localObserver.unsubscribe(dummyEvent);
    };
  }, [localObserver]); // <-- Dependency array, specifies which objects changes will trigger the effect to run

  // Used to update title/color (or any other state variable…). Title and color are passed on to BaseWindowPlugin as props,
  // and will result in updating the Window's color/title. Note that we put this method here, in dummy.js, and then pass it on
  // to DummyView as a prop. It is then called in DummyView when user clicks a button. This is just made for illustrating
  // the concept of passing on props to BaseWindowPlugin from a plugin's view.
  const updateCustomProp = (prop, value) => {
    console.log(`Setting ${prop} to:`, value);
    setState((prevState) => ({ ...prevState, [prop]: value }));
  };

  // Fires when the custom header-panel button is clicked. Add more logic and see what happens!
  const panelHeaderButtonCallback = () => {
    console.log("You just clicked the panel-header button!");
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
      type="Dummy" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name.
      custom={{
        icon: <BugReportIcon />, // Custom icon for this plugin
        title: state.title, // By keeping title and color in Dummy's state we can pass on
        color: state.color, // the changes to BaseWindowPlugin which will update internal state too.
        description: "En kort beskrivning som visas i widgeten", // Shown on Widget button
        // Do you want to add buttons to the plugin-header? That can be done as follows:
        customPanelHeaderButtons: [
          {
            icon: <BugReportIcon />, // Specify which icon the button should use...
            onClickCallback: panelHeaderButtonCallback, // ...and which callback should run on click.
          },
        ],
        height: "dynamic", // The height of the plugin-window in px. "dynamic" resizes the window so all content fits, "auto" uses all available space.
        width: 400, // The width of the plugin-window in px.
      }}
    >
      {/* This is the child object of BaseWindowPlugin. It will be displayed
            as content inside the plugin's window. */}
      <DummyView
        // Here we send some props to the plugin's View.
        // Make sure to ONLY include props that are ACTUALLY USED in the View.
        model={dummyModel} // We can supply our model
        app={props.app} // Or even the whole App
        localObserver={localObserver} // And also the local-observer (handling communication within the plugin)...
        globalObserver={props.app.globalObserver} // ... and the global-observer (handling communication within the entire application).
        updateCustomProp={updateCustomProp} // We're also gonna pass a function that we can use to update the state in this (the parent) component.
      />
    </BaseWindowPlugin>
  );
}

export default Dummy;
