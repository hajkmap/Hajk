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
      [theme.breakpoints.down("xs")]: {
        position: "absolute",
        width: "100%",
        zIndex: 10001
      }
    },
    drawerPaperRight: {
      position: "fixed",
      right: 0,
      top: '64px',
      [theme.breakpoints.down("xs")]: {
        top: '54px'
      }
    },
    drawerPaperContent: {
      padding: "10px",
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
        anchor={this.props.position || "left"}
        open={active}
        classes={{
          docked: classes.drawer,
          paper: classNames(
            classes.drawerPaper,
            !active && classes.drawerPaperClosed,
            (this.props.position === "right" ? classes.drawerPaperRight : "")
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
