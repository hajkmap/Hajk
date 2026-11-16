import React from "react";
import Observer from "react-event-observer";
import FmeIcon from "@mui/icons-material/BrokenImage";
import BaseWindowPlugin from "../BaseWindowPlugin";
import FmeServerView from "./FmeServerView";
import FmeServerModel from "./models/FmeServerModel";
import MapViewModel from "./models/MapViewModel";
import type { FmeServerPluginProps } from "./types";

const FmeServer: React.FC<FmeServerPluginProps> = (props) => {
  const [localObserver] = React.useState(() => Observer());

  const [mapViewModel] = React.useState(
    () =>
      new MapViewModel({
        localObserver,
        map: props.map,
        options: props.options,
      })
  );

  const [fmeServerModel] = React.useState(
    () =>
      new FmeServerModel({
        app: props.app,
        mapViewModel,
        options: props.options,
      })
  );

  const onWindowHide = () => {
    localObserver.publish("view.toggleDrawMethod", "");
    localObserver.publish("map.toggleDrawMethod", "");
  };

  const mapserviceBase = (
    props.app.config as { appConfig?: { mapserviceBase?: string } }
  ).appConfig?.mapserviceBase;

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
        onWindowHide,
      }}
    >
      <FmeServerView
        model={fmeServerModel}
        mapViewModel={mapViewModel}
        mapserviceBase={mapserviceBase ?? ""}
        options={props.options}
        localObserver={localObserver}
      />
    </BaseWindowPlugin>
  );
};

export default FmeServer;
