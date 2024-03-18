import React from "react";
import BufferView from "./BufferView";
import BufferModel from "./BufferModel";

// Buffer is the parent component for the Buffer sketch.
// It includes and follows the same structure as the Bufferplugin with a BufferView and a BufferModel as children.

function Buffer(props) {
  const bufferModel = BufferModel({
    drawModel: props.drawModel,
    localObserver: props.localObserver,
    pluginShown: props.pluginShown,
    toggleBufferBtn: props.toggleBufferBtn,
    bufferState: props.bufferState,
    setBufferState: props.setBufferState,
    highlightLayer: props.highlightLayer,
    drawStyle: props.drawStyle,
  });
  return (
    <BufferView
      drawModel={props.drawModel}
      model={bufferModel}
      app={props.app}
      localObserver={props.localObserver}
      toggleBufferBtn={props.toggleBufferBtn}
      setToggleBufferBtn={props.setToggleBufferBtn}
      setState={props.setBufferState}
      state={props.bufferState}
    />
  );
}

export default Buffer;
