import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import { Button } from "@material-ui/core";

const styles = theme => ({});

class DummyView extends Component {
  state = {};

  getText() {
    return "Editera";
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
    //const { classes } = this.props;
    return (
      <Button onClick={this.buttonClick}>Klicka här {this.state.test}</Button>
    );
    //return <div className="tool-panel-content">Dummy</div>;
  }
}

DummyView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(DummyView);
