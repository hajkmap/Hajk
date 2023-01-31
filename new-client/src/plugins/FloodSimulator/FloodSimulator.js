import React from "react";
import WaterDamageIcon from "@mui/icons-material/WaterDamage";

import Observer from "react-event-observer";

import BaseWindowPlugin from "../BaseWindowPlugin";
import FloodSimulatorView from "./FloodSimulatorView";
import FloodSimulatorModel from "./FloodSimulatorModel";

function FloodSimulator(props) {
  console.log("props: ", props);
  const [localObserver] = React.useState(Observer());

  const [floodSimulatorModel] = React.useState(
    () =>
      new FloodSimulatorModel({
        app: props.app,
        localObserver: localObserver,
        map: props.map,
        options: props.options,
      })
  );
  return (
    <BaseWindowPlugin
      {...props}
      type="FloodSimulator"
      custom={{
        icon: props.options.icon || <WaterDamageIcon />,
        title: props.options.title || "Flood Simulator",
        description:
          props.options.description ||
          "Get a preview of how rising water levels affect the area in map",
        height: props.options.height || "dynamic",
        width: props.options.width || 330,
        visibleAtStart: props.options.visibleAtStart,
      }}
    >
      <FloodSimulatorView
        app={props.app}
        localObserver={localObserver}
        model={floodSimulatorModel}
      />
    </BaseWindowPlugin>
  );
}

export default FloodSimulator;
