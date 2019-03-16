import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import MaximizeIcon from "@material-ui/icons/WebAsset";
import ResetIcon from "@material-ui/icons/CancelPresentation";
import MinimizeIcon from "@material-ui/icons/Minimize";
import DownIcon from "@material-ui/icons/KeyboardArrowDown";
import UpIcon from "@material-ui/icons/KeyboardArrowUp";
import { getIsMobile } from "../utils/IsMobile.js";

const styles = theme => {
  return {
    header: {
      padding: "11px",
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderBottom: "1px solid #ccc",
      userSelect: "none",
      margin: 0,
      fontSize: "14pt",
      display: "flex",
      justifyContent: "space-between",
      height: "23px"
    },
    icons: {
      float: "right",
      display: "flex",
      alignItems: "center"
    },
    iconsLeft: {
      float: "left",
      alignItems: "center",
      display: "none",
      [theme.breakpoints.down("xs")]: {
        display: "flex"
      }
    },
    icon: {
      cursor: "pointer",
      padding: "0 6px",
      height: "30px",
      "&:hover": {
        background: theme.palette.primary.light
      }
    },
    iconClose: {
      cursor: "pointer",
      padding: "0 6px",
      height: "30px",
      "&:hover": {
        background: "rgb(255, 50, 50)"
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
  constructor(props) {
    super(props);
    this.state = {
      maximized: false
    };
    if (this.props.localObserver) {
      this.props.localObserver.on("maximizeWindow", v => {
        console.log("Maximize", v);
        this.setState({
          mode: "maximized"
        });
        this.props.onMaximize();
      });
    }
  }

  renderButtons(maximizable) {
    const { classes } = this.props;
    if (maximizable === false) {
      return (
        <CloseIcon onClick={this.props.onClose} className={classes.iconClose} />
      );
    } else {
      return (
        <>
          <div className={classes.windowControllers}>
            <MinimizeIcon
              onClick={this.props.onMinimize}
              className={classes.icon}
            />
            {this.props.mode === "maximized" ? (
              <ResetIcon
                onClick={this.props.onMaximize}
                className={classes.icon}
              />
            ) : (
              <MaximizeIcon
                onClick={this.props.onMaximize}
                className={classes.icon}
              />
            )}
          </div>
          <CloseIcon
            onClick={this.props.onClose}
            className={classes.iconClose}
          />
        </>
      );
    }
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
    const { classes, maximizable } = this.props;
    return (
      <header
        className={classes.header}
        onMouseDown={e => {
          if (e.target.tagName === "HEADER") {
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
        {this.props.title}
        <nav className={classes.icons}>{this.renderButtons(maximizable)}</nav>
      </header>
    );
  }
}

export default withStyles(styles)(PanelHeader);
