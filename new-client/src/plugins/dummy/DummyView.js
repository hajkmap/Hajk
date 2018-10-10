import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";

const styles = theme => ({});

class DummyView extends React.Component {
  state = {};

  getText() {
    return "DummyView";
  }

  buttonClick = () => {
    const { model, observer } = this.props;
    console.log("Map is", model.getMap());
    observer.publish("myEvent", "data here");
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
