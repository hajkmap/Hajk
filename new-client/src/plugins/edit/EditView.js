import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";

const styles = theme => ({
});

class EditView extends Component {

  constructor() {
    super();
    this.state = {
    };
  }

  getText() {
    return "Editera";
  }

  render() {
    return (
      <div className="tool-panel-content">
      </div>
    );
  }
}

EditView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(EditView);
