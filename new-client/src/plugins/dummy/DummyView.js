import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";

const styles = theme => ({});

class DummyView extends Component {
  constructor(props) {
    super(props);
    console.log("EditView constructor()", this);
  }

  getText() {
    return "Editera";
  }

  render() {
    console.log("Will render EditView");
    const { classes } = this.props;
    return <div className="tool-panel-content">Verktyg</div>;
  }
}

DummyView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(DummyView);
