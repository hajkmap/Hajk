import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import PanelHeader from "./PanelHeader";

const styles = theme => {
  return {
    popPanel: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      background: "white",
      zIndex: 1200,
      order: 1,
      maxWidth: "400px",
      boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
      overflow: "hidden",
      [theme.breakpoints.down("xs")]: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        top: "auto !important",
        height: "auto"
      }
    },
    hidden: {
      display: "none"
    },
    body: {
      padding: "15px",
      overflow: "auto"
    }
  };
};

class PopPanel extends Component {
  close = e => {
    const { onClose } = this.props;
    if (onClose) onClose();
  };

  state = {};

  componentDidMount() {}

  render() {
    const { classes, children, open, top, height, width } = this.props;
    var activeClasses = [classes.popPanel];
    if (!open) {
      activeClasses = [classes.hidden, activeClasses];
    }
    return (
      <div
        ref="panel"
        className={classNames(activeClasses)}
        style={{
          top: top,
          height: height,
          width: width
        }}
      >
        <PanelHeader title={this.props.title} onClose={this.close} />
        <div className={classes.body}>{children}</div>
      </div>
    );
  }
}

PopPanel.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(PopPanel);
