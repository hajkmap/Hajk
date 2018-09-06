import React, { Component } from "react";
import PropTypes from "prop-types";
import { Drawer } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  drawerPaper: {
    left: "72px",
    width: "500px",
    zIndex: theme.zIndex.drawer - 1
  }
});

class Panel extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    const { classes, active, type } = this.props;
    return (
      <Drawer
        variant="persistent"
        anchor="left"
        open={active}
        classes={{ paper: classes.drawerPaper }}
      >
        <h1>{type}</h1>
      </Drawer>
    );
  }
}

Panel.propTypes = {
  classes: PropTypes.object.isRequired,
  active: PropTypes.bool.isRequired,
  type: PropTypes.string.isRequired
};

export default withStyles(styles)(Panel);