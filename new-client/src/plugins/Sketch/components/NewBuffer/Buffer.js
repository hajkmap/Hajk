import React from "react";
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
      setToggleObjectButton={props.setToggleObjectButton}
      toggleObjectButton={props.toggleObjectButton}
      setState={props.setBufferState}
      state={props.bufferState}
    />
  );
}

export default Buffer;
