import React, { Component } from "react";
import PropTypes from "prop-types";
import { Drawer } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import classNames from "classnames";

const styles = theme => ({
  drawer: {
    order: 1,
    zIndex: 1
  },
  drawerPaper: {
    position: 'inherit',
    width: "400px",
    zIndex: theme.zIndex.drawer - 1
  },
  drawerPaperClose: {
    display: 'none'
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
        classes={{
          docked: classes.drawer,
          paper: classNames(
            classes.drawerPaper,
            !active && classes.drawerPaperClose
          )
        }}
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