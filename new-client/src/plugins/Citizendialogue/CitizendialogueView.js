// Make sure to only import the hooks you intend to use
import React, { useCallback, useEffect, useState } from "react";

import { styled } from "@mui/material/styles";
import { Box, Button, Typography } from "@mui/material";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";

import { useSnackbar } from "notistack";

import useCookieStatus from "hooks/useCookieStatus";

// Hajk components are primarily styled in two ways:
// - Using the styled-utility, see: https://mui.com/system/styled/
// - Using the sx-prop, see: https://mui.com/system/basics/#the-sx-prop
// The styled-utility creates a reusable component, and might be the
// best choice if the style is to be applied in several places.

// The styled components should be created at the top of the document
// (but after imports) for consistency. Hajk does not have a naming
// convention for the styled components, but keep in mind to use names
// that does not collide with regular components. (E.g. a styled div
// should not be called Box).

// The example below shows how a <Button /> with a bottom margin can be created.
// Notice that we are also accessing the application theme.
const ButtonWithBottomMargin = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

// We can also create a custom button that accepts border as a
// prop. If the border prop is missing, we fall back on the theme
// divider color. (borderColor would be a more fitting name, but
// since this is a custom prop it must be all lowerCase, hence border will have
// to do!)
const ButtonWithBorder = styled(Button)(({ border, theme }) => ({
  border: `${theme.spacing(0.5)} solid ${border ?? theme.palette.divider}`,
}));

// All MUI components (and all styled components, even styled div:s!) will have access to the sx-prop.
// Check out how the sx-prop works further down.

function CitizendialogueView(props) {
  // We're gonna need to access the snackbar methods. Let's use the provided hook.
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();

  // We're gonna need to use the event observers. Let's destruct them so that we can
  // get a hold of them easily. The observers can be accessed directly via the props:
  const { globalObserver, localObserver } = props;

  // We're gonna need to keep track of if we're allowed to save stuff in LS. Let's use the hook.
  const { functionalCookiesOk } = useCookieStatus(globalObserver);

  // We're gonna want to keep track of some state. Let's use the useState hook.
  // If you want to read up on how state is managed in functional components, see: https://reactjs.org/docs/hooks-state.html
  const [counter, setCounter] = useState(0);
  const [borderColor, setBorderColor] = useState("#FFFFFF");

  // You don’t have to use many state variables. State variables can hold objects and arrays just fine,
  // so you can still group related data together. However, unlike this.setState in a class, updating a
  // state variable always replaces it instead of merging it. A grouped state, with two variables,
  // could look something like this:
  // const [someState, setSomeState] = useState({
  //   counter: 0,
  //   borderColor: "#FFFFFF",
  // });
  // So how would you go about updating just one of the variables in the grouped state?
  // Well, all you have to do is to make sure to merge the old state manually.
  // For example, to increment the counter, but keep the border-color constant, we can do:
  // setSomeState((state) => ({...state, counter: state.counter + 1}))

  // We've already covered the useState hook. Let's look into another one. The useCallback hook
  // returns a memoized callback (cached, only computed again when the inputs in the dependency
  // array changes). Why do we want to memoize this function? It only returns some JSX? Well,
  // since we want to use this function in a useEffect hook (more on that later) we want to make
  // sure that this function does not change on every render. (If it would, the useEffect would run
  // on every render, which we want to avoid).
  const renderDrawerContent = useCallback(() => {
    return (
      // The sx-prop gives us some shorthand commands, for example, the paddings below
      // will be set to theme.spacing(2), and not 2px! Make sure to read up on how the sx-prop
      // works before using it, check out the MUI docs.
      <Box sx={{ paddingLeft: 2, paddingRight: 2 }}>
        <Typography variant="h6">Citizendialogue</Typography>
        <Typography variant="body1">
          Citizendialogue har anropat globalObserver och bett om att få lägga
          till en knapp uppe i headern. När du trycker på knappen visas det här
          innehållet i sidopanelen.
        </Typography>
      </Box>
    );
  }, []); // <-- dependency array. (Here we can add inputs that would cause the callback to be re-calculated).

  // Another hook that is used a lot in functional components is the useEffect hook.
  // Mutations, subscriptions, timers, logging, and other side effects are not allowed inside the main body
  // of a function component (referred to as React’s render phase). Doing so will lead to confusing bugs
  // and inconsistencies in the UI. Instead, use the useEffect hook. The function passed to useEffect will run after
  // the render is committed to the screen. For more information, see: https://reactjs.org/docs/hooks-reference.html#useeffect

  // When moving from Class-based components to Functional components I've seen several developers trying to mimic the
  // constructor (which is obviously only present in Class-based components) by using the useEffect hook. The useEffect hook
  // *could* be used in a "constructor like" fashion (by leaving the dependency array empty, making the effect only run once).
  // But be aware! The effect runs AFTER the initial render, in contrast to the 'real' constructor which runs before the initial
  // render. To get around this, I would suggest to create a custom hook instead. (To be fair, constructor-like behavior is rarely
  // needed in functional components. But sometimes it **is** needed, and I thought that some clarification regarding how to work
  // around this could be valid).

  // Well, here we use a useEffect to publish a message on the global observer (after the initial render).
  // The message sent is used to render whatever 'renderDrawerContent' returns in Hajks drawer.
  useEffect(() => {
    globalObserver.publish("core.addDrawerToggleButton", {
      value: "citizendialogue",
      ButtonIcon: AppRegistrationIcon,
      caption: "Citizendialogueverktyg",
      drawerTitle: "Citizendialogueverktyg",
      order: 100,
      renderDrawerContent: renderDrawerContent,
    });
  }, [globalObserver, renderDrawerContent]); // <-- The dependency array. Since we reference the global observer and 'renderDrawerContent' we have to include these.
  // There is a lot more to say regarding the useEffect hook, but I'll leave that to you to read up on. Just a couple of tips:
  // - Remember the cleanup-function! Especially when you're working with subscriptions.
  // - Remember that you can use several useEffect hooks! Maybe you want to do something when 'counter' changes?

  const buttonClick = () => {
    // Here's an example of how to access the plugin's model:
    console.log(
      "Citizendialogue can access model's map:",
      props.model.getMap()
    );

    // We have access to plugin's observer too. Below we publish an event that the parent
    // component is listing to, see Citizendialogue.js for how to subscribe to events.
    localObserver.publish(
      "citizendialogueEvent",
      "This has been sent from CitizendialogueView using the Observer"
    );

    // And we can of course access this component's state
    setCounter(counter + 1);
  };

  // Event handler for a button that shows a global info message when clicked
  const showDefaultSnackbar = () => {
    enqueueSnackbar("Yay, a nice message with default styling.");
  };

  // A more complicate snackbar example, this one with an action button and persistent snackbar
  const showAdvancedSnackbar = () => {
    const action = (key) => (
      <>
        <Button
          onClick={() => {
            alert(`I belong to snackbar with key ${key}`);
          }}
        >
          {"Alert"}
        </Button>
        <Button
          onClick={() => {
            closeSnackbar(key);
          }}
        >
          {"Dismiss"}
        </Button>
      </>
    );

    enqueueSnackbar("Oops, a message with error styling!", {
      variant: "error",
      persist: true,
      action,
    });
  };

  // Generate a custom HEX color string
  const getRandomHexColorString = () => {
    return `#${((Math.random() * 0xffffff) << 0)
      .toString(16)
      .padStart(6, "0")}`;
  };

  // Make it possible to programmatically update Window's title/color
  const handleClickOnRandomTitle = () => {
    // First we'll generate a random title and color
    const title = new Date().getTime().toString();
    const color = getRandomHexColorString();
    // Then we'll use the updateCustomProp method which is passed down from parent component as a prop to this View.
    props.updateCustomProp("title", title); // Generate a timestamp
    props.updateCustomProp("color", color);
    // We might want to (if we're allowed) save some values in LS for later use. Let's check
    // if we're allowed to save in LS (We might not be if the user has not accepted functional cookies).
    if (functionalCookiesOk) {
      props.model.setCitizendialogueKeyInStorage("title", title);
    }
  };

  // Make it possible to programmatically update the border color of a button
  const updateBorderColor = () => {
    // Get a random hex color string...
    const randomColor = getRandomHexColorString();
    // ...and update the border-color state!
    setBorderColor(randomColor);
  };

  // Handles when user clicks the "Toggle draw interaction"-button
  const handleToggleDrawClick = () => {
    // First we'll get the current draw interaction and its setter from props
    const { drawInteraction, setDrawInteraction } = props;
    // If the draw-interaction is currently disabled (set to ""), we activate it (by setting it to "Polygon").
    // If it is currently active (not set to ""), we disable it.
    setDrawInteraction(drawInteraction === "" ? "Polygon" : "");
  };

  return (
    <>
      <Button
        variant="contained"
        fullWidth={true}
        // onChange={(e) => { console.log(e) }}
        // ^ Don't do this. Closures here are inefficient. Use the below:
        onClick={buttonClick}
        sx={{ marginBottom: 2 }} // The sx-prop is available on all MUI-components!
      >
        {`Clicked ${counter} ${counter === 1 ? "time" : "times"}`}
      </Button>
      <ButtonWithBorder
        border="blue"
        sx={{ marginBottom: 2 }} // The sx-prop is available on all styled components!
        variant="contained"
        fullWidth={true}
        onClick={showDefaultSnackbar}
      >
        Show default snackbar
      </ButtonWithBorder>
      <ButtonWithBottomMargin
        variant="contained"
        fullWidth={true}
        onClick={showAdvancedSnackbar}
      >
        Show error snackbar
      </ButtonWithBottomMargin>
      <ButtonWithBottomMargin
        variant="contained"
        fullWidth={true}
        color="primary"
        onClick={handleToggleDrawClick}
      >
        {`${
          props.drawInteraction === "" ? "Activate" : "Disable"
        } draw interaction`}
      </ButtonWithBottomMargin>
      <ButtonWithBottomMargin
        variant="contained"
        fullWidth={true}
        onClick={handleClickOnRandomTitle}
      >
        Set random title and color
      </ButtonWithBottomMargin>
      <ButtonWithBorder
        border={borderColor} // Let's keep the borderColor in state so that we can update it!
        sx={{ marginBottom: 2 }} // The sx-prop is available on all styled components!
        variant="contained"
        fullWidth={true}
        onClick={updateBorderColor} // When we click the button, we update the borderColor.
      >
        Set random border color
      </ButtonWithBorder>
    </>
  );
}

export default CitizendialogueView;
