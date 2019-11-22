// Generic imports – all plugins need these
import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

// Plugin-specific imports.
import PresetModel from "./PresetModel";
import PresetView from "./PresetView";

// All plugins will need to display an icon. Make sure to pick a relevant one from Material UI Icons.
import BugReportIcon from "@material-ui/icons/Bookmarks";

/**
 * @summary Main class for the Preset plugin.
 * @description Zooms the map to places pre-defined in admin.
 *
 * @class Preset
 * @extends {React.PureComponent}
 */
class Preset extends React.PureComponent {
  state = {};

  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
  };

  constructor(props) {
    super(props);

    this.presetModel = new PresetModel({
      app: props.app,
      map: props.map
    });
  }

  render() {
    return (
      <BaseWindowPlugin
        {...this.props} // Pass on all props
        type="Preset" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name
        custom={{
          icon: <BugReportIcon />, // Custom icon for this plugin
          title: "Snabbval", // Custom title (will be shown in Window's toolbar and on the Drawer/Widget button)
          description: "Zooma till en plats", // Shown on Widget button
          height: 450, // Custom height/width etc | Use "auto" for automatic or leave undefined
          width: 400
        }}
      >
        {/* This is the child object of BaseWindowPlugin. It will be displayed
            as content inside the plugin's window. */}
        <PresetView
          // Here we send some props to the plugin's View.
          // Make sure to ONLY include props that are ACTUALLY USED in the View.
          model={this.presetModel} // We can supply our model
        />
      </BaseWindowPlugin>
    );
  }
}

export default Preset;
