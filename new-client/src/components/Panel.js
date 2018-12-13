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
      zIndex: theme.zIndex.drawer - 1,
      [theme.breakpoints.down("xs")]: {
        zIndex: theme.zIndex.drawer + 1
      }
    },
    drawerPaper: {
      position: "inherit",
      width: "400px",
      zIndex: theme.zIndex.drawer - 1,
      overflowY: "inherit",
      border: "1px solid #ccc",
      [theme.breakpoints.down("xs")]: {
        border: "none",
        position: "fixed",
        width: "100%",
        zIndex: 1300,
        top: 0
      }
    },
    drawerRight: {
      order: 1,
      right: 0,
      position: "absolute",
      bottom: 0,
      top: 0,
      margin: "0px",
      marginBottom: "0px",
      [theme.breakpoints.down("xs")]: {
        margin: 0
      }
    },
    drawerLeft: {
      order: 1,
      left: 0,
      position: "static",
      top: 0,
      margin: "0px",
      marginBottom: "0px",
      [theme.breakpoints.down("xs")]: {
        margin: 0
      }
    },
    drawerPaperRight: {},
    drawerPaperContainer: {
      top: "47px",
      right: 0,
      bottom: 0,
      left: 0,
      overflow: "auto",
      position: "absolute"
    },
    drawerPaperContent: {
      userSelect: "none",
      padding: "10px"
    },
    drawerPaperClosed: {
      display: "none"
    },
    dragger: {
      width: "8px",
      cursor: "ew-resize",
      padding: "2px 0 0",
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: "100"
    }
  };
};

class Panel extends Component {
  close = e => {
    const { onClose } = this.props;
    if (onClose) onClose();
  };

  state = {
    isResizing: false,
    lastDownX: 0,
    newWidth: {}
  };

  handleMousedown = e => {
    this.setState({ isResizing: true, lastDownX: e.clientX });
  };

  handleMousemove = e => {
    // we don't want to do anything if we aren't resizing.
    if (!this.state.isResizing) {
      return;
    }

    let offsetRight =
      document.body.offsetWidth - (e.clientX - document.body.offsetLeft);
    let minWidth = 400;
    let maxWidth = 700;
    if (offsetRight > minWidth && offsetRight < maxWidth) {
      this.setState({ newWidth: { width: offsetRight } });
    }
  };

  handleMouseup = e => {
    this.setState({ isResizing: false });
  };

  componentDidMount() {
    document.addEventListener("mousemove", e => this.handleMousemove(e));
    document.addEventListener("mouseup", e => this.handleMouseup(e));
  }

  render() {
    const { classes, open, title, children } = this.props;
    return (
      <Drawer
        variant="persistent"
        anchor={this.props.position || "left"}
        open={open}
        PaperProps={{ style: this.state.newWidth }}
        transitionDuration={0}
        classes={{
          root:
            this.props.position === "right"
              ? classes.drawerRight
              : classes.drawerLeft,
          docked: classes.drawer,
          paper: classNames(
            classes.drawerPaper,
            !open && classes.drawerPaperClosed,
            this.props.position === "right" ? classes.drawerPaperRight : ""
          )
        }}
      >
        <div
          id="dragger"
          onMouseDown={event => {
            this.handleMousedown(event);
          }}
          className={classes.dragger}
        />
        <PanelHeader onClose={this.close} title={title} />
        <div className={classes.drawerPaperContainer}>
          <div className={classes.drawerPaperContent}>{children}</div>
        </div>
      </Drawer>
    );
  }
}

Panel.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Panel);
