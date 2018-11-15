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
      borderTop: "1px solid #ddd",
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
        classes={{
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
        <div className={classes.drawerPaperContent}>{children}</div>
      </Drawer>
    );
  }
}

Panel.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Panel);
