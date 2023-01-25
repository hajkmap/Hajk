import React from "react";
import WaterDamageIcon from "@mui/icons-material/WaterDamage";

import BaseWindowPlugin from "../BaseWindowPlugin";

import FloodSimulatorView from "./FloodSimulatorView";

function FloodSimulator(props) {
  console.log("props: ", props);
  return (
    <BaseWindowPlugin
      {...props}
      type="FloodSimulator"
      custom={{
        icon: <WaterDamageIcon />,
        title: "Flood Simulator",
        description:
          "Get a preview of how rising water levels affect the area in map",
        height: "dynamic",
        width: 330,
        visibleAtStart: true, // TODO: Remove and read from Admin's config
      }}
    >
      <FloodSimulatorView />
    </BaseWindowPlugin>
  );
}

export default FloodSimulator;
