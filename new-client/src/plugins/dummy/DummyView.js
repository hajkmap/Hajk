import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";
import { withSnackbar } from "notistack";

const styles = theme => ({});

class DummyView extends React.PureComponent {
  state = {};

  constructor(props) {
    // If you're not using some of properties defined below, remove them from your code.
    // They are shown here for demonstration purposes only.
    super(props);
    this.model = this.props.model;
    this.app = this.props.app;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

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
    this.setState({
      test: "State changed!"
    });
  };

  // Event handler for a button that shows a global info message when clicked
  handleMessageClick = () => {
    this.props.enqueueSnackbar("Yay, a nice message with default styling.");
  };

  handleMessageClick2 = () => {
    this.props.enqueueSnackbar("Oops, a message with error styling!", {
      variant: "error"
    });
  };

  render() {
    return (
      <>
        <Button onClick={this.buttonClick}>
          {this.state.test || "Click to change state"}
        </Button>
        <Button onClick={this.handleMessageClick}>Show default snackbar</Button>
        <Button onClick={this.handleMessageClick2}>Show error snackbar</Button>
      </>
    );
  }
}

DummyView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withSnackbar(DummyView));
