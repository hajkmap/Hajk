import React, { useEffect } from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";
import ExploreIcon from "@mui/icons-material/Explore";
import CoordinatesView from "./CoordinatesView.js";
import CoordinatesModel from "./CoordinatesModel.js";
import Observer from "react-event-observer";

const Coordinates = (props) => {
  const localObserver = Observer();

  const coordinatesModel = new CoordinatesModel({
    map: props.map,
    app: props.app,
    options: props.options,
    localObserver: localObserver,
  });

  useEffect(() => {
    const onWindowShow = () => {
      coordinatesModel.activate();
    };

    const onWindowHide = () => {
      coordinatesModel.deactivate();
    };

    localObserver.subscribe("windowShow", onWindowShow);
    localObserver.subscribe("windowHide", onWindowHide);

    return () => {
      localObserver.unsubscribe("windowShow", onWindowShow);
      localObserver.unsubscribe("windowHide", onWindowHide);
    };
  }, [coordinatesModel, localObserver]);

  return (
    <BaseWindowPlugin
      {...props}
      type="Coordinates"
      custom={{
        icon: <ExploreIcon />,
        title: "Visa koordinat",
        description: "Visa koordinater för given plats",
        height: "dynamic",
        width: 400,
        disablePadding: true,
        onWindowShow: () => localObserver.publish("windowShow"),
        onWindowHide: () => localObserver.publish("windowHide"),
      }}
    >
      <CoordinatesView model={coordinatesModel} localObserver={localObserver} />
    </BaseWindowPlugin>
  );
};

export default Coordinates;
