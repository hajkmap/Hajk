import React from "react";
import BufferView from "./BufferView";
import BufferModel from "./BufferModel";

// Buffer is the main component for the Buffer sketch.
// It includes and follows the same structure as the Bufferplugin with a BufferView and a BufferModel.

function Buffer(props) {
  const { localObserver, map } = props;

  const bufferModel = BufferModel({
    map: map,
    localObserver: localObserver,
    pluginShown: props.pluginShown,
    toggleObjectBufferBtn: props.toggleObjectBufferBtn,
    setHighlightLayer: props.setHighlightLayer,
    isHighlightLayerAdded: props.isHighlightLayerAdded,
    setIsBufferLayerAdded: props.setIsBufferLayerAdded,
    isBufferLayerAdded: props.isBufferLayerAdded,
    highlightSource: props.highlightSource,
    bufferSource: props.bufferSource,
    highlightLayer: props.highlightLayer,
    bufferLayer: props.bufferLayer,
  });

  return (
    <BufferView
      model={bufferModel}
      app={props.app}
      localObserver={localObserver}
      toggleObjectBufferBtn={props.toggleObjectBufferBtn}
      setToggleObjectBufferBtn={props.setToggleObjectBufferBtn}
      setState={props.setBufferState}
      state={props.bufferState}
    />
  );
}

export default Buffer;
