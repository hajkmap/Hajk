// Base
import React, { useState, useEffect } from "react";
import Observer from "react-event-observer";

// Icons
import RepeatIcon from "@mui/icons-material/Repeat";

// Views
import BaseWindowPlugin from "../BaseWindowPlugin";
import VisionIntegrationView from "./VisionIntegrationView";

// Models
import VisionIntegrationModel from "./models/VisionIntegrationModel";

// Utils
import { getSearchSources } from "./utils";

// Constants
import { HUB_CONNECTION_STATUS } from "./constants";

function VisionIntegration(props) {
  // Let's destruct the options from the props (and fall back on empty object to avoid
  // a complete disaster if the plugin is wrongly configured).
  const { options = {} } = props;
  // We're gonna need a local-observer so that we can pass some events around
  const [localObserver] = useState(() => Observer());
  // We're gonna need the search-sources (basically information regarding the search-sources
  // that are set in the plugin-options. In the plugin-options we only reference to these objects,
  // and they have to be fetched from the global config).
  const [searchSources] = useState(() => getSearchSources(props));
  // Since we're gonna be drawing, we're gonna need to keep track of wether
  // the plugin is currently shown or not. (If the plugin is hidden the draw-
  // functionality should be disabled).
  const [pluginShown, setPluginShown] = useState(
    options.visibleAtStart ?? false
  );

  // We're gonna need a model containing VisionIntegration-functionality...
  const [model] = useState(
    () => new VisionIntegrationModel({ options, localObserver, searchSources })
  );

  // We're gonna want to make sure proper settings are supplied when starting
  // the plugin... If some crucial settings are missing we'll just display an
  // error instead of the "real" UI.
  const [configError] = useState(!model.configurationIsValid());

  // We're gonna want to keep track of the hub connection-status (We're
  // gonna want to show the connection state to the user so that they can know if the
  // connection has failed etc).
  const [hubConnectionStatus, setHubConnectionStatus] = useState(
    HUB_CONNECTION_STATUS.LOADING
  );

  // We're gonna want to subscribe to some events so that we can keep track of hub-status etc.
  useEffect(() => {
    // A Listener for hub-connection failure. Make sure to update connection-state...
    const connectionFailureListener = localObserver.subscribe(
      "hub-initiation-failed",
      () => setHubConnectionStatus(HUB_CONNECTION_STATUS.FAILED)
    );
    // A Listener for hub-connection success. Make sure to update connection-state...
    const connectionSuccessListener = localObserver.subscribe(
      "hub-initiation-success",
      () => setHubConnectionStatus(HUB_CONNECTION_STATUS.SUCCESS)
    );
    // A Listener for when/if the hub connection is disconnected for some reason...
    const hubDisconnectedListener = localObserver.subscribe(
      "hub-disconnected",
      () => setHubConnectionStatus(HUB_CONNECTION_STATUS.FAILED)
    );
    // Make sure to clean up!
    return () => {
      connectionFailureListener.unSubscribe();
      connectionSuccessListener.unSubscribe();
      hubDisconnectedListener.unSubscribe();
    };
  }, [localObserver]);

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
        hubConnectionStatus={hubConnectionStatus}
      />
    </BaseWindowPlugin>
  );
}

export default VisionIntegration;
