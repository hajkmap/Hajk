import React, { Component } from "react";
import PropTypes from "prop-types";
import { Drawer } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import PanelHeader from "./PanelHeader";

const styles = theme => {
  return {
    drawer: {
      order: 1,
      zIndex: theme.zIndex.drawer - 1
    },
    drawerPaper: {
      position: "inherit",
      width: "400px",
      zIndex: theme.zIndex.drawer - 1,
      [theme.breakpoints.down("sm")]: {
        position: "absolute",
        width: "100%",
        zIndex: 10001
      }
    },
    drawerPaperContent: {
      padding: "10px"
    },
    drawerPaperClosed: {
      display: "none"
    }
  };
};

class Panel extends Component {

  close = e => {
    const { onClose } = this.props;
    onClose();
  };

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.active !== nextProps.active;
  }

  render() {
    const { classes, active, title, children } = this.props;
    return (
      <Drawer
        variant="persistent"
        anchor="left"
        open={active}
        classes={{
          docked: classes.drawer,
          paper: classNames(
            classes.drawerPaper,
            !active && classes.drawerPaperClosed
          )
        }}
      >
        <PanelHeader onClose={this.close} title={title} />
        <div className={classes.drawerPaperContent}>{children}</div>
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
