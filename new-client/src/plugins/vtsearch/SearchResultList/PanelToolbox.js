// Generic imports â€“ all plugins need these
import React from "react";
import PropTypes from "prop-types";
import MinimizeIcon from "@material-ui/icons/Minimize";
import MaximizeIcon from "@material-ui/icons/WebAsset";
import { withStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";

/**
 * @summary Main class for the Dummy plugin.
 * @description The purpose of having a Dummy plugin is to exemplify
 * and document how plugins should be constructed in Hajk.
 * The plugins can also serve as a scaffold for other plugins: simply
 * copy the directory, rename it and all files within, and change logic
 * to create the plugin you want to.
 *
 * @class Dummy
 * @extends {React.PureComponent}
 */

const styles = theme => {
  return {
    containerRoot: {
      padding: 0,
      marginRight: 0,
      width: 20
    }
  };
};
class PanelToolbox extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {};

  // propTypes and defaultProps are static properties, declared
  // as high as possible within the component code. They should
  // be immediately visible to other devs reading the file,
  // since they serve as documentation.
  // If unsure of what propTypes are or how to use them, see https://reactjs.org/docs/typechecking-with-proptypes.html.
  static propTypes = {
    options: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
  };

  minimize = () => {
    const { localObserver } = this.props;
    console.log(localObserver, "localob");
    localObserver.publish("search-result-list-minimized");
  };

  maximize = () => {
    console.log("maximize");
    const { localObserver } = this.props;
    localObserver.publish("search-result-list-maximized");
  };

  render() {
    return (
      <div>
        <IconButton onClick={this.minimize} aria-label="minimize">
          <MinimizeIcon></MinimizeIcon>
        </IconButton>

        <IconButton onClick={this.maximize} aria-label="maximize">
          <MaximizeIcon></MaximizeIcon>
        </IconButton>
      </div>
    );
  }
}

// Part of API. Make a HOC of our plugin.
export default withStyles(styles)(PanelToolbox);
