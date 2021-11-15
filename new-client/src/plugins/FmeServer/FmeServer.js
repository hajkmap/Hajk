import React from "react";
import Observer from "react-event-observer";
import FmeIcon from "@mui/icons-material/BrokenImage";

// Views
import BaseWindowPlugin from "../BaseWindowPlugin";
import FmeView from "./FmeServerView";

// Models
import FmeServerModel from "./models/FmeServerModel";
import MapViewModel from "./models/MapViewModel";

const FmeServer = (props) => {
  // The local observer will handle the communication between models and views.
  const localObserver = Observer();

  // A model used to interact with the map. We want to keep the view free
  // from direct map interactions.
  const mapViewModel = new MapViewModel({
    localObserver: localObserver,
    map: props.map,
  });

  // A model used to interact with the FME-server instance etc. We want to
  // keep the view free from direct interactions with the server.
  const fmeServerModel = new FmeServerModel({
    localObserver: localObserver,
    app: props.app,
    mapViewModel: mapViewModel,
    options: props.options,
  });

  // We're gonna need to catch if the user closes the window, and make sure to
  // disable the draw interaction if it is active. Let's publish a couple events.
  const onWindowHide = () => {
    localObserver.publish("view.toggleDrawMethod", "");
    localObserver.publish("map.toggleDrawMethod", "");
  };

  // We're rendering the view in a BaseWindowPlugin, since this is a
  // "standard" plugin.
  return (
    <BaseWindowPlugin
      {...props}
      type="FmeServer"
      custom={{
        icon: <FmeIcon />,
        title: "FME-server",
        description: "Beställ jobb från FME-server.",
        height: "dynamic",
        width: 400,
        onWindowHide: onWindowHide,
      }}
    >
      <FmeView
        model={fmeServerModel}
        mapViewModel={mapViewModel}
        options={props.options}
        localObserver={localObserver}
      />
    </BaseWindowPlugin>
  );
};

export default FmeServer;
