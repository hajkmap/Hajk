import React, { Component } from "react";
import propTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import FullscreenIcon from "@material-ui/icons/Fullscreen";
import FullscreenExitIcon from "@material-ui/icons/FullscreenExit";
import AspectRatioIcon from "@material-ui/icons/AspectRatio";
import { Hidden, Typography, IconButton, Box } from "@material-ui/core";
import { withTranslation } from "react-i18next";

const styles = (theme) => {
  return {
    header: {
      padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
      borderBottom: `4px solid ${theme.palette.primary.main}`,
      userSelect: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 46,
    },
  };
};

class PanelHeader extends Component {
  static propTypes = {
    allowMaximizedWindow: propTypes.bool.isRequired,
    classes: propTypes.object.isRequired,
    color: propTypes.string,
    mode: propTypes.oneOf(["window", "maximized", "minimized"]),
    onClose: propTypes.func.isRequired,
    onMaximize: propTypes.func.isRequired,
    onMinimize: propTypes.func.isRequired,
    title: propTypes.string.isRequired,
  };

  renderCustomHeaderButtons = () => {
    const { customHeaderButtons } = this.props;
    return customHeaderButtons.map((buttonInfo, index) => {
      const HeaderActionIcon = buttonInfo.icon.type;
      const description = buttonInfo.description;
      return (
        <IconButton
          key={index}
          onClick={buttonInfo.onClickCallback}
          size="small"
        >
          <Typography variant="srOnly">{description}</Typography>
          <HeaderActionIcon />
        </IconButton>
      );
    });
  };

  shouldRenderCustomHeaderButtons = () => {
    const { customHeaderButtons } = this.props;
    return customHeaderButtons && customHeaderButtons.length > 0;
  };

  render() {
    const { allowMaximizedWindow, classes, mode, t } = this.props;
    return (
      <header
        className={classes.header}
        style={{ borderColor: this.props.color }} // Allow for dynamic override of accent border color
      >
        <Typography component="h1" variant="button" align="left" noWrap={true}>
          {t(this.props.title)}
        </Typography>
        <Box display="flex" component="nav">
          {this.shouldRenderCustomHeaderButtons() &&
            this.renderCustomHeaderButtons()}
          {mode !== "maximized" && // If window isn't in fit screen mode currently…
            (mode === "minimized" ? ( // … but it's minimized…
              <IconButton size="small" onClick={this.props.onMaximize}>
                <Typography variant="srOnly">
                  {t("common.maximizeWindow")}
                </Typography>
                <FullscreenIcon // …render the maximize icon.
                />
              </IconButton>
            ) : (
              // If it's already in "window" mode though, render the minimize icon.
              <IconButton size="small" onClick={this.props.onMinimize}>
                <Typography variant="srOnly">
                  {t("common.minimizeWindow")}
                </Typography>
                <FullscreenExitIcon />
              </IconButton>
            ))}
          <Hidden xsDown>
            {allowMaximizedWindow && ( // If we're not on mobile and config allows fit-to-screen…
              <IconButton size="small" onClick={this.props.onMaximize}>
                <Typography variant="srOnly">
                  {t("common.maximizeWindow")}
                </Typography>
                <AspectRatioIcon // … render the action button. Note: it will remain the same…
                />
              </IconButton>
            )}
          </Hidden>
          <IconButton size="small" onClick={this.props.onClose}>
            <Typography variant="srOnly">{t("common.closeWindow")}</Typography>
            <CloseIcon />
          </IconButton>
        </Box>
      </header>
    );
  }
}

export default withTranslation()(withStyles(styles)(PanelHeader));
