// Base
import React from "react";
import { useState } from "react";

// Icons
import RepeatIcon from "@mui/icons-material/Repeat";

// Views
import BaseWindowPlugin from "../BaseWindowPlugin";
import VisionIntegrationView from "./VisionIntegrationView";

// Models
import VisionIntegrationModel from "./models/VisionIntegrationModel";

function VisionIntegration(props) {
  // Let's destruct the options from the props (and fall back on empty object to avoid
  // a complete disaster if the plugin is wrongly configured).
  const { options = {} } = props;
  // Since we're gonna be drawing, we're gonna need to keep track of wether
  // the plugin is currently shown or not. (If the plugin is hidden the draw-
  // functionality should be disabled).
  const [pluginShown, setPluginShown] = useState(
    options.visibleAtStart ?? false
  );

  // We're gonna need a model containing VisionIntegration-functionality...
  const [model] = useState(new VisionIntegrationModel({ options }));

  // We're gonna want to make sure proper settings are supplied when starting
  // the plugin... If some crucial settings are missing we'll just display an
  // error instead of the "real" UI.
  const [configError] = useState(!model.configurationIsValid());

  // We're gonna want to keep track of wether the hub is connected or not. (We're
  // gonna want to show the connection state to the user so that they can know if the
  // connection has failed).
  const [hubIsConnected] = useState(model.hubIsConnected());

  // We're gonna need to catch if the user closes the window, and make sure to
  // update the state so that the effect handling the draw-interaction-toggling fires.
  const onWindowHide = () => {
    setPluginShown(false);
  };

  // We're gonna need to catch if the user opens the window, and make sure to
  // update the state so that the effect handling the draw-interaction-toggling fires.
  const onWindowShow = () => {
    setPluginShown(true);
  };

  return (
    <BaseWindowPlugin
      {...props}
      type="VisionIntegration"
      custom={{
        icon: <RepeatIcon />,
        title: "EDP Integration",
        description: "Kommunicera med EDP Vision.",
        height: "dynamic",
        width: 350,
        onWindowHide: onWindowHide,
        onWindowShow: onWindowShow,
      }}
    >
      <VisionIntegrationView
        pluginShown={pluginShown}
        configError={configError}
        hubIsConnected={hubIsConnected}
      />
    </BaseWindowPlugin>
  );
}

export default VisionIntegration;
