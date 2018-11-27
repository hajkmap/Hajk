import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";

const styles = theme => ({});

class EditView extends React.PureComponent {
  // constructor() {
  //  super();
  // }

  getText() {
    return "Editera";
  }

  render() {
    return <div className="tool-panel-content">Verktyg</div>;
  }
}

EditView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(EditView);
