import React from "react";
import PropTypes from "prop-types";

import NormalIcon from "@mui/icons-material/FlipToFront";

import CloseIcon from "@mui/icons-material/Close";
import withStyles from "@mui/styles/withStyles";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * @summary Window size handling
 * @description Module with three buttons to handle size of window.
 * Possible to maximize, minimize and go to "normal" size.
 * @class PanelToolbox
 * @extends {React.PureComponent}
 */

const styles = (theme) => {
  return {
    iconButtonRoot: {
      color: theme.palette.common.white,
      padding: 0,
    },
    expandOpen: {
      transform: "rotate(180deg)",
    },
  };
};
class PanelToolbox extends React.PureComponent {
  state = {
    minimizeVisible: true,
    maximizeVisible: true,
    normalVisible: false,
  };

  static propTypes = {
    options: PropTypes.object.isRequired,
  };

  static defaultProps = {
    options: {},
  };

  minimize = () => {
    const { localObserver } = this.props;
    this.setState({
      maximizeVisible: true,
      minimizeVisible: false,
      normalVisible: true,
    });
    localObserver.publish("search-result-list-minimized");
  };

  maximize = () => {
    const { localObserver } = this.props;
    this.setState({
      maximizeVisible: false,
      minimizeVisible: true,
      normalVisible: true,
    });
    localObserver.publish("search-result-list-maximized");
  };

  normalize = () => {
    const { localObserver } = this.props;
    this.setState({
      maximizeVisible: true,
      minimizeVisible: true,
      normalVisible: false,
    });
    localObserver.publish("search-result-list-normal");
  };

  close = () => {
    const { localObserver } = this.props;
    this.setState({
      maximizeVisible: false,
      minimizeVisible: false,
      normalVisible: true,
    });
    localObserver.publish("search-result-list-close");
  };

  renderButton = (onClickCallback, iconElement) => {
    const { classes } = this.props;
    return (
      <IconButton
        classes={{ root: classes.iconButtonRoot }}
        onClick={onClickCallback}
        size="large"
      >
        {iconElement === "minimize" ? (
          <ExpandMoreIcon />
        ) : iconElement === "maximize" ? (
          <ExpandMoreIcon className={classes.expandOpen} />
        ) : iconElement === "normalize" ? (
          <NormalIcon />
        ) : iconElement === "close" ? (
          <CloseIcon />
        ) : null}
      </IconButton>
    );
  };

  render() {
    return (
      <div>
        {this.state.minimizeVisible &&
          this.renderButton(this.minimize, "minimize")}

        {this.state.maximizeVisible &&
          this.renderButton(this.maximize, "maximize")}
        {this.state.normalVisible &&
          this.renderButton(this.normalize, "normalize")}
        {this.renderButton(this.close, "close")}
      </div>
    );
  }
}

export default withStyles(styles)(PanelToolbox);
