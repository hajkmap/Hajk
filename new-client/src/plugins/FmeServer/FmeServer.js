import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";
import FmeServerModel from "./FmeServerModel";
import FmeView from "./FmeServerView";
import Observer from "react-event-observer";
import FmeIcon from "@material-ui/icons/BrokenImage";

const FmeServer = (props) => {
  const localObserver = Observer();

  const fmeServerModel = new FmeServerModel({
    localObserver: localObserver,
    app: props.app,
    map: props.map,
    options: props.options,
  });

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
      }}
    >
      <FmeView
        model={fmeServerModel}
        options={props.options}
        localObserver={localObserver}
      />
    </BaseWindowPlugin>
  );
};

export default FmeServer;
