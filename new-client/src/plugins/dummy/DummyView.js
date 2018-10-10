import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";

import Button from "@material-ui/core/Button";

const styles = theme => ({});

class DummyView extends React.Component {
  // constructor(props) {
  //   super(props);
  // }

  getText() {
    return "DummyView";
  }

  handleOnClick = e => {
    alert("Hello from Dummy Plugin");
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <Button
          variant="contained"
          color="primary"
          onClick={this.handleOnClick}
        >
          Hello World
        </Button>
      </div>
    );
  }
}

DummyView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(DummyView);
