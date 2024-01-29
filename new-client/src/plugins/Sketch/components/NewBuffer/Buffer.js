import React, { useEffect } from "react";
import BufferView from "./BufferView";
import BufferModel from "./BufferModel";

// Buffer is the main component for the Buffer sketch accordion.
// It includes and follows the same structure as the Bufferplugin with a BufferView and a BufferModel.

function Buffer(props) {
  const { localObserver, map } = props;

  const bufferModel = BufferModel({
    map: map,
    localObserver: localObserver,
    pluginShown: props.pluginShown,
    toggleObjectButton: props.toggleObjectButton,
  });

  useEffect(() => {
    if (!props.pluginShown) {
      bufferModel.setActive(false);
      localObserver.publish("resetViews");
      bufferModel.highlightSource.clear();
    }
  }, [props.pluginShown, bufferModel, localObserver]);

  return (
    <BufferView
      model={bufferModel}
      app={props.app}
      localObserver={localObserver}
      setToggleObjectButton={props.setToggleObjectButton}
      toggleObjectButton={props.toggleObjectButton}
    />
  );
}

export default Buffer;
