import React, { useEffect, useRef } from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";
import Observer from "react-event-observer";

import BufferIcon from "@mui/icons-material/Adjust";

import BufferView from "./BufferView.js";
import BufferModel from "./BufferModel.js";

const Buffer = (props) => {
  const localObserver = useRef(new Observer()).current;
  const bufferModel = useRef(
    new BufferModel({
      map: props.map,
      localObserver: localObserver,
    })
  ).current;

  const onWindowShow = () => {
    bufferModel.setActive(true);
  };

  const onWindowHide = () => {
    bufferModel.setActive(false);

    // Ensure that state is reset in view
    localObserver.publish("resetView");
    // Ensure that no selected features are left when window
    // is hidden: we want to start over fresh next time!
    // Note: we don't clear the buffer source though as user
    // might want to close this window but keep the buffers visible.
    bufferModel.highlightSource.clear();
  };

  useEffect(() => {
    // Clean-up on unmount if needed
    return () => {
      bufferModel.setActive(false);
    };
  }, [bufferModel]);

  return (
    <BaseWindowPlugin
      {...props}
      type="Buffer"
      custom={{
        icon: <BufferIcon />,
        title: "Buffra",
        description: "Skapa en buffer runt objekt utvalda objekt i kartan",
        height: 650,
        width: 400,
        top: undefined,
        left: undefined,
        onWindowShow: onWindowShow,
        onWindowHide: onWindowHide,
      }}
    >
      <BufferView
        model={bufferModel}
        app={props.app}
        localObserver={localObserver}
      />
    </BaseWindowPlugin>
  );
};

export default Buffer;
