import React from "react";

import { styled } from "@mui/material/styles";
import { Box, Button, Typography } from "@mui/material";
import BugReportIcon from "@mui/icons-material/BugReport";

import { useSnackbar } from "notistack";

// Hajk components are primarily styled in two ways:
// - Using the styled-utility, see: https://mui.com/system/styled/
// - Using the sx-prop, see: https://mui.com/system/basics/#the-sx-prop
// The styled-utility creates a re-usable component, and might be the
// best choice if the style is to be applied in several places.

// The styled-components should be created at the top of the document
// (but after imports) for consistency. Hajk does not have a naming
// convention for the styled-components, but keep in mind to use names
// that does not collide with regular components. (E.g. a styled div
// should not be called Box).

// The example below shows how a <Button /> with a bottom-margin can be created.
// Notice that we are also accessing the application theme.
const ButtonWithBottomMargin = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

// We can also create a custom button that accepts border as a
// prop. If the border-prop is missing, we fall back on the theme
// divider color. (borderColor would be a more fitting name, but
// since this is a custom prop it must be all lowerCase, hence border will have
// to do!)
const ButtonWithBorder = styled(Button)(({ border, theme }) => ({
  border: `${theme.spacing(0.5)} solid ${border ?? theme.palette.divider}`,
}));

// All mui-components (and all styled components, even styled div:s!) will have access to the sx-prop.
// Check out how the sx-prop works further down.

function DummyView(props) {
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  const [state, setState] = React.useState({
    counter: 0,
    borderColor: "#fff",
  });

  const renderDrawerContent = React.useCallback(() => {
    return (
      // The sx-prop gives us some short hand commands, for example, the paddings below
      // will be set to theme.spacing(2), and not 2px! Make sure to read up on how the sx-prop
      // works before using it.
      <Box sx={{ paddingLeft: 2, paddingRight: 2 }}>
        <Typography variant="h6">Dummy</Typography>
        <Typography variant="body1">
          Dummy har anropat globalObserver och bett om att få lägga till en
          knapp uppe i headern. När du trycker på knappen visas det här
          innehållet i sidopanelen.
        </Typography>
        <Typography variant="body1">
          Lorem ipsum dolor sit amet, sit enim montes aliquam. Cras non lorem,
          rhoncus condimentum, irure et ante. Pulvinar suscipit odio ante, et
          tellus a enim, wisi ipsum, vel rhoncus eget faucibus varius, luctus
          turpis nibh vel odio nulla pede. Consectetuer commodo at, ante risus
          amet nec sollicitudin cras, rhoncus diam pharetra in, tristique leo
          dictumst ullamcorper proin libero, et turpis laoreet nonummy
          adipiscing quam mollis. Sed erat cum magna id, iaculis sed porta,
          euismod nisl consequat leo in lectus, suspendisse tincidunt vehicula
          pellentesque eget in justo. Mattis dolor nec, sapien magnis ultricies
          maecenas per urna aperiam, justo aliquam at ut, ut urna quam
          parturient pharetra feugiat, est sit. Sollicitudin cum tempor.
          Suscipit eros aenean viverra velit. Interdum varius vitae, lacus
          sapien ut ipsum et ut. Lobortis pulvinar a. Blandit suspendisse proin
          integer. Aliquam sit, consectetuer sed molestie mauris inceptos. Et
          sit semper semper, ante donec dictum. Est rhoncus sed vestibulum
          vestibulum, sociis eleifend torquent eros, aliquam nulla et mattis
          nulla augue leo, pellentesque cras ultrices dignissim sed, id nunc
          vitae nulla consectetuer. Sed nam tincidunt, aliquam elit justo netus,
          vestibulum nulla nibh sagittis nulla, id urna. Lorem libero mauris
          sit. Amet eu id maecenas. Itaque nulla ut interdum nibh. Arcu
          vulputate adipiscing donec nunc, cras id sodales sit. Nulla sapien sed
          sagittis scelerisque, condimentum sollicitudin nibh donec scelerisque
          conubia, adipiscing dictumst laoreet id, eget augue eu accumsan. Justo
          proin sit tempor, lacus vestibulum non aliquam et id est, odio neque
          elit vestibulum dapibus elit, eros et sapien malesuada vehicula. Neque
          facilisis, suspendisse wisi in. Ultrices a nam morbi, faucibus ligula
          tortor, dui consectetuer non accumsan, suspendisse semper lacinia
          tincidunt sed sem voluptatem, in non. Justo amet sapien lacus id ipsum
          orci, sed integer sem at lacinia dui pede, aliquam ridiculus vel
          faucibus vivamus sed laoreet, lectus neque vitae felis. Tellus nisl
          tristique, in rutrum viverra sollicitudin nunc mus, aenean in, vel vel
          sed, massa ac deserunt volutpat mollis maecenas lacinia. Commodo
          lectus at sapien nascetur pede aliquam, mauris sodales dolor sit
          vitae, egestas sed lobortis lacinia, a nisl molestie in quis orci.
          Velit nec. Cubilia nulla wisi, suspendisse justo lacus consectetuer
          integer vestibulum, dui proin vulputate metus, etiam sollicitudin
          pellentesque sapien. Ipsum risus, est ligula pede mauris. Arcu fusce
          id ac, lacus tempus cubilia, enim auctor aliquam arcu nibh. Nibh
          mauris, aenean neque facilisis, enim justo purus nullam et id, donec
          vehicula. Vitae tellus quis enim dui auctor.
        </Typography>
      </Box>
    );
  }, []);

  React.useEffect(() => {
    props.app.globalObserver.publish("core.addDrawerToggleButton", {
      value: "dummy",
      ButtonIcon: BugReportIcon,
      caption: "Dummyverktyg",
      drawerTitle: "Dummyverktyg",
      order: 100,
      renderDrawerContent: renderDrawerContent,
    });
  }, [props.app.globalObserver, renderDrawerContent]);

  const buttonClick = () => {
    // We have access to plugin's model:
    console.log("Dummy can access model's map:", props.model.getMap());

    // We have access to plugin's observer. Below we publish an event that the parent
    // component is listing to, see dummy.js for how to subscribe to events.
    props.localObserver.publish(
      "dummyEvent",
      "This has been sent from DummyView using the Observer"
    );

    // And we can of course access this component's state
    setState((prevState) => ({ ...prevState, counter: prevState.counter + 1 }));
  };

  // Event handler for a button that shows a global info message when clicked
  const showDefaultSnackbar = () => {
    enqueueSnackbar("Yay, a nice message with default styling.");
  };

  const showIntroduction = () => {
    // Show the introduction guide, see components/Introduction.js
    props.app.globalObserver.publish("core.showIntroduction");
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
    return `#${((Math.random() * 0xffffff) << 0).toString(16)}`;
  };

  // Make it possible to programatically update Window's title/color
  const handleClickOnRandomTitle = () => {
    // We use the updateCustomProp mehtod which is passed down from parent
    // component as a prop to this View.
    props.updateCustomProp("title", new Date().getTime().toString()); // Generate a timestamp
    props.updateCustomProp("color", getRandomHexColorString());
  };

  // Make it possible to programatically update the border color of a button
  const updateBorderColor = () => {
    // Get a random hex color string...
    const randomColor = getRandomHexColorString();
    // ...and update the state!
    setState((prevState) => ({ ...prevState, borderColor: randomColor }));
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
        {state.test ||
          `Clicked ${state.counter} ${state.counter === 1 ? "time" : "times"}`}
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
        onClick={showIntroduction}
      >
        Show Hajk Introduction
      </ButtonWithBottomMargin>
      <ButtonWithBottomMargin
        variant="contained"
        fullWidth={true}
        onClick={handleClickOnRandomTitle}
      >
        Set random title and color
      </ButtonWithBottomMargin>
      <ButtonWithBorder
        border={state.borderColor} // Let's keep the borderColor in state so that we can update it!
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

export default DummyView;
