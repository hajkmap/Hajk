import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";

const styles = theme => ({});

class SuggestView extends Component {
  constructor() {
    super();
    console.log("SuggestView constructor()", this);
  }

  getText() {
    return "Suggestera";
  }

  render() {
    console.log("Will render SuggestView");

    return <div className="tool-panel-content">Verktyg</div>;
  }
}

SuggestView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(SuggestView);
