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
        zIndex: 1300
      }
    },
    drawerPaperRight: {
      position: "fixed",
      right: 0,
      top: "64px",
      [theme.breakpoints.down("xs")]: {
        top: "54px"
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
    if (onClose) onClose();
  };

  render() {
    const { classes, open, title, children } = this.props;
    return (
      <Drawer
        variant="persistent"
        anchor={this.props.position || "left"}
        open={open}
        classes={{
          docked: classes.drawer,
          paper: classNames(
            classes.drawerPaper,
            !open && classes.drawerPaperClosed,
            this.props.position === "right" ? classes.drawerPaperRight : ""
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
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Panel);
