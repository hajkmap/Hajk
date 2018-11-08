import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";

const styles = theme => ({});

class DummyView extends React.PureComponent {
  state = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.observer = this.props.observer;
  }

  buttonClick = () => {
    // We have access to plugin's model:
    console.log("Dummy can access models's map:", this.model.getMap());

    // We have access to plugin's observer. Below we publish an event that the parent
    // component is listing to, see dummy.js for how to subscribe to events.
    this.observer.publish(
      "dummyEvent",
      "This data has been sent from DummyView using the Observer!"
    );

    // And we can of course access this component's state
    this.setState({
      test: "test"
    });
  };

  render() {
    return (
      <Button onClick={this.buttonClick}>Klicka här {this.state.test}</Button>
    );
  }
}

DummyView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(DummyView);
