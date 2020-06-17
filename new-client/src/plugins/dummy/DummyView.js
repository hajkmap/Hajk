import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";
import BugReportIcon from "@material-ui/icons/BugReport";
import { Box, Typography } from "@material-ui/core";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = theme => ({
  buttonWithBottomMargin: {
    marginBottom: theme.spacing(2)
  },
  drawerContent: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  }
});

class DummyView extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    counter: 0
  };

  // propTypes and defaultProps are static properties, declared
  // as high as possible within the component code. They should
  // be immediately visible to other devs reading the file,
  // since they serve as documentation.
  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired,
    closeSnackbar: PropTypes.func.isRequired
  };

  static defaultProps = {};

  constructor(props) {
    // If you're not using some of properties defined below, remove them from your code.
    // They are shown here for demonstration purposes only.
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;

    this.globalObserver.publish("core.addDrawerToggleButton", {
      value: "dummy",
      ButtonIcon: BugReportIcon,
      caption: "Dummyverktyg",
      order: 100,
      renderDrawerContent: this.renderDrawerContent
    });
  }

  renderDrawerContent = () => {
    const { classes } = this.props;
    return (
      <Box className={classes.drawerContent}>
        <Typography variant="h6">Dummy</Typography>
        <Typography variant="body1">
          Dummy har anropat globalObserver och bett om att få lägga till en
          knapp uppe i headern. När du trycker på knappen visas det här
          innehållet i sidopanelen.
        </Typography>
      </Box>
    );
  };

  buttonClick = () => {
    // We have access to plugin's model:
    console.log("Dummy can access model's map:", this.model.getMap());

    // We have access to plugin's observer. Below we publish an event that the parent
    // component is listing to, see dummy.js for how to subscribe to events.
    this.localObserver.publish(
      "dummyEvent",
      "This has been sent from DummyView using the Observer"
    );

    // And we can of course access this component's state
    this.setState(prevState => ({
      counter: prevState.counter + 1
    }));
  };

  // Event handler for a button that shows a global info message when clicked
  showDefaultSnackbar = () => {
    this.props.enqueueSnackbar("Yay, a nice message with default styling.");
  };

  showIntroduction = () => {
    // Show the introduction guide, see components/Introduction.js
    this.globalObserver.publish("core.showIntroduction");
  };

  // A more complicate snackbar example, this one with an action button and persistent snackbar
  showAdvancedSnackbar = () => {
    const action = key => (
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
            this.props.closeSnackbar(key);
          }}
        >
          {"Dismiss"}
        </Button>
      </>
    );

    this.props.enqueueSnackbar("Oops, a message with error styling!", {
      variant: "error",
      persist: true,
      action
    });
  };

  render() {
    const { classes } = this.props;
    return (
      <>
        <Button
          className={classes.buttonWithBottomMargin}
          variant="contained"
          fullWidth={true}
          // onChange={(e) => { console.log(e) }}
          // ^ Don't do this. Closures here are inefficient. Use the below:
          onClick={this.buttonClick}
        >
          {this.state.test ||
            `Clicked ${this.state.counter} ${
              this.state.counter === 1 ? "time" : "times"
            }`}
        </Button>
        <Button
          className={classes.buttonWithBottomMargin}
          variant="contained"
          fullWidth={true}
          onClick={this.showDefaultSnackbar}
        >
          Show default snackbar
        </Button>
        <Button
          className={classes.buttonWithBottomMargin}
          variant="contained"
          fullWidth={true}
          onClick={this.showAdvancedSnackbar}
        >
          Show error snackbar
        </Button>
        <Button
          className={classes.buttonWithBottomMargin}
          variant="contained"
          fullWidth={true}
          color="primary"
          onClick={this.showIntroduction}
        >
          Show Hajk Introduction
        </Button>
      </>
    );
  }
}

// Exporting like this adds some props to DummyView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds to functions (enqueueSnackbar() and closeSnackbar())
// that can be used throughout the Component.
export default withStyles(styles)(withSnackbar(DummyView));
