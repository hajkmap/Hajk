import React, { Component } from "react";
import propTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import MaximizeIcon from "@material-ui/icons/WebAsset";
import ResetIcon from "@material-ui/icons/CancelPresentation";
import MinimizeIcon from "@material-ui/icons/Minimize";
import DownIcon from "@material-ui/icons/KeyboardArrowDown";
import UpIcon from "@material-ui/icons/KeyboardArrowUp";
import { getIsMobile } from "../utils/IsMobile.js";
import { Typography } from "@material-ui/core";

const styles = theme => {
  return {
    header: {
      padding: "5px 10px",
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderBottom: "1px solid #ccc",
      userSelect: "none",
      display: "flex",
      justifyContent: "space-between"
    },
    title: {
      color: theme.palette.primary.contrastText
    },
    iconsLeft: {
      alignItems: "center",
      display: "none",
      "&>*": {
        marginRight: "5px"
      },
      [theme.breakpoints.down("xs")]: {
        display: "flex"
      }
    },
    iconsRight: {
      display: "flex",
      alignItems: "center",
      "&>*": {
        marginLeft: "5px"
      }
    },
    icon: {
      cursor: "pointer",
      "&:hover": {
        background: theme.palette.primary.light
      }
    },
    windowControllers: {
      [theme.breakpoints.down("xs")]: {
        display: "none"
      }
    }
  };
};

class PanelHeader extends Component {
  state = {
    maximized: false
  };

  static propTypes = {
    classes: propTypes.object.isRequired,
    mode: propTypes.oneOf(["window", "maximized", "minimized"]),
    onClose: propTypes.func.isRequired,
    onMaximize: propTypes.func.isRequired,
    onMinimize: propTypes.func.isRequired,
    title: propTypes.string.isRequired
  };

  componentDidMount() {
    this.props.globalObserver.subscribe("core.minimizeWindow", () => {
      this.minimize();
    });
  }

  renderButtons() {
    const { classes } = this.props;
    return (
      <>
        <MinimizeIcon
          onClick={this.props.onMinimize}
          className={`${classes.icon} ${classes.windowControllers}`}
        />
        {this.props.mode === "maximized" ? (
          <ResetIcon
            onClick={this.props.onMaximize}
            className={`${classes.icon} ${classes.windowControllers}`}
          />
        ) : (
          <MaximizeIcon
            onClick={this.props.onMaximize}
            className={`${classes.icon} ${classes.windowControllers}`}
          />
        )}
        <CloseIcon onClick={this.props.onClose} className={classes.icon} />
      </>
    );
  }

  maximize = e => {
    if (getIsMobile()) {
      if (e) {
        e.stopPropagation();
      }
      this.setState({
        mode: "maximized"
      });
      this.props.onMaximize();
    }
  };

  minimize = e => {
    if (getIsMobile()) {
      if (e) {
        e.stopPropagation();
      }
      this.setState({
        mode: "minimized"
      });
      this.props.onMinimize();
    }
  };

  render() {
    const { classes } = this.props;
    return (
      <header
        className={classes.header}
        onMouseDown={e => {
          if (e.target.tagName === "header") {
            this.maximize(e);
          }
        }}
      >
        <nav className={classes.iconsLeft}>
          {this.state.mode === "minimized" ? (
            <UpIcon onClick={this.maximize} className={classes.icon} />
          ) : (
            <DownIcon onClick={this.minimize} className={classes.icon} />
          )}
        </nav>
        <Typography
          variant="h6"
          align="left"
          noWrap={true}
          className={classes.title}
        >
          {this.props.title}
        </Typography>
        <nav className={classes.iconsRight}>{this.renderButtons()}</nav>
      </header>
    );
  }
}

export default withStyles(styles)(PanelHeader);
