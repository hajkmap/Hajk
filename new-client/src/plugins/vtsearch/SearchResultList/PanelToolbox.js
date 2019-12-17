import React from "react";
import PropTypes from "prop-types";
import MinimizeIcon from "@material-ui/icons/Minimize";
import NormalIcon from "@material-ui/icons/FlipToFront";
import MaximizeIcon from "@material-ui/icons/WebAsset";
import CloseIcon from "@material-ui/icons/Close";
import { withStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";

/**
 * @summary Window size handling
 * @description Module with three buttons to handle size of window.
 * Possible to maximize, minimize and go to "normal" size.
 * @class PanelToolbox
 * @extends {React.PureComponent}
 */

const styles = theme => {
  return {
    containerRoot: {
      padding: 0,
      marginRight: 0,
      width: 20
    },
    iconButtonRoot: {
      color: "white"
    }
  };
};
class PanelToolbox extends React.PureComponent {
  state = {
    minimizeVisible: true,
    maximizeVisible: true,
    normalVisible: false
  };

  static propTypes = {
    options: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
  };

  minimize = () => {
    const { localObserver } = this.props;
    this.setState({
      maximizeVisible: true,
      minimizeVisible: false,
      normalVisible: true
    });
    localObserver.publish("search-result-list-minimized");
  };

  maximize = () => {
    const { localObserver } = this.props;
    this.setState({
      maximizeVisible: false,
      minimizeVisible: true,
      normalVisible: true
    });
    localObserver.publish("search-result-list-maximized");
  };

  normal = () => {
    const { localObserver } = this.props;
    this.setState({
      maximizeVisible: true,
      minimizeVisible: true,
      normalVisible: false
    });
    localObserver.publish("search-result-list-normal");
  };

  close = () => {
    const { localObserver } = this.props;
    this.setState({
      maximizeVisible: false,
      minimizeVisible: false,
      normalVisible: true
    });
    localObserver.publish("search-result-list-close");
  };

  render() {
    const { classes } = this.props;
    return (
      <div>
        {this.state.minimizeVisible && (
          <IconButton
            classes={{ root: classes.iconButtonRoot }}
            onClick={this.minimize}
            aria-label="minimize"
          >
            <MinimizeIcon></MinimizeIcon>
          </IconButton>
        )}
        {this.state.normalVisible && (
          <IconButton
            classes={{ root: classes.iconButtonRoot }}
            onClick={this.normal}
            aria-label="normal"
          >
            <NormalIcon></NormalIcon>
          </IconButton>
        )}
        {this.state.maximizeVisible && (
          <IconButton
            classes={{ root: classes.iconButtonRoot }}
            onClick={this.maximize}
            aria-label="maximize"
          >
            <MaximizeIcon></MaximizeIcon>
          </IconButton>
        )}
        <IconButton
          classes={{ root: classes.iconButtonRoot }}
          onClick={this.close}
          aria-label="close"
        >
          <CloseIcon></CloseIcon>
        </IconButton>
      </div>
    );
  }
}

export default withStyles(styles)(PanelToolbox);
