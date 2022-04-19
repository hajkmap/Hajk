import React from "react";
import PropTypes from "prop-types";

import NormalIcon from "@material-ui/icons/FlipToFront";

import CloseIcon from "@material-ui/icons/Close";
import { withStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

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
    localObserver.publish("vt-search-result-list-minimized");
  };

  maximize = () => {
    const { localObserver } = this.props;
    this.setState({
      maximizeVisible: false,
      minimizeVisible: true,
      normalVisible: true,
    });
    localObserver.publish("vt-search-result-list-maximized");
  };

  normalize = () => {
    const { localObserver } = this.props;
    this.setState({
      maximizeVisible: true,
      minimizeVisible: true,
      normalVisible: false,
    });
    localObserver.publish("vt-search-result-list-normal");
  };

  close = () => {
    const { localObserver } = this.props;
    this.setState({
      maximizeVisible: false,
      minimizeVisible: false,
      normalVisible: true,
    });
    localObserver.publish("vt-search-result-list-close");
  };

  renderButton = (onClickCallback, iconElement) => {
    const { classes } = this.props;
    return (
      <IconButton
        classes={{ root: classes.iconButtonRoot }}
        onClick={onClickCallback}
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
