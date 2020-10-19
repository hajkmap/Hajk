import React, { Component } from "react";
import propTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import MaximizeIcon from "@material-ui/icons/Maximize";
import MinimizeIcon from "@material-ui/icons/Minimize";
import DownIcon from "@material-ui/icons/KeyboardArrowDown";
import UpIcon from "@material-ui/icons/KeyboardArrowUp";
import { getIsMobile } from "../utils/IsMobile.js";
import { Typography } from "@material-ui/core";

const styles = (theme) => {
  console.log("theme: ", theme);
  return {
    header: {
      padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
      borderBottom: `4px solid ${theme.palette.primary.main}`,
      userSelect: "none",
      display: "flex",
      justifyContent: "space-between",
    },
    iconsLeft: {
      alignItems: "center",
      display: "none",
      "&>*": {
        marginRight: "5px",
      },
      [theme.breakpoints.down("xs")]: {
        display: "flex",
      },
    },
    iconsRight: {
      display: "flex",
      alignItems: "center",
      "&>*": {
        marginLeft: "5px",
      },
    },
    icon: {
      cursor: "pointer",
      "&:hover": {
        background: theme.palette.action.hover,
      },
    },
    windowControllers: {
      [theme.breakpoints.down("xs")]: {
        display: "none",
      },
    },
  };
};

class PanelHeader extends Component {
  state = {
    maximized: false,
  };

  static propTypes = {
    classes: propTypes.object.isRequired,
    color: propTypes.string,
    mode: propTypes.oneOf(["window", "maximized", "minimized"]),
    onClose: propTypes.func.isRequired,
    onMaximize: propTypes.func.isRequired,
    onMinimize: propTypes.func.isRequired,
    title: propTypes.string.isRequired,
  };

  componentDidMount() {
    this.props.globalObserver.subscribe("core.minimizeWindow", () => {
      this.minimize();
    });

    this.props.globalObserver.subscribe("core.maximizeWindow", () => {
      this.maximize();
    });
  }

  renderButtons() {
    const { classes } = this.props;
    return (
      <>
        {this.props.mode === "minimized" ? (
          <MaximizeIcon
            onClick={this.props.onMaximize}
            className={`${classes.icon} ${classes.windowControllers}`}
          />
        ) : (
          <MinimizeIcon
            onClick={this.props.onMinimize}
            className={`${classes.icon} ${classes.windowControllers}`}
          />
        )}
        <CloseIcon onClick={this.props.onClose} className={classes.icon} />
      </>
    );
  }

  maximize = (e) => {
    if (getIsMobile()) {
      if (e) {
        e.stopPropagation();
      }
      this.setState({
        mode: "maximized",
      });
      this.props.onMaximize();
    }
  };

  minimize = (e) => {
    if (getIsMobile()) {
      if (e) {
        e.stopPropagation();
      }
      this.setState({
        mode: "minimized",
      });
      this.props.onMinimize();
    }
  };

  render() {
    const { classes } = this.props;
    return (
      <header
        className={classes.header}
        onMouseDown={(e) => {
          if (e.target.tagName === "header") {
            this.maximize(e);
          }
        }}
        style={{ borderColor: this.props.color }}
      >
        <nav className={classes.iconsLeft}>
          {this.state.mode === "minimized" ? (
            <UpIcon onClick={this.maximize} className={classes.icon} />
          ) : (
            <DownIcon onClick={this.minimize} className={classes.icon} />
          )}
        </nav>
        <Typography variant="button" align="left" noWrap={true}>
          {this.props.title}
        </Typography>
        <nav className={classes.iconsRight}>{this.renderButtons()}</nav>
      </header>
    );
  }
}

export default withStyles(styles)(PanelHeader);
