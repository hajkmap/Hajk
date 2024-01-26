import React, { useEffect } from "react";

import BufferView from "./BufferView";
import BufferFuncModel from "./BufferModel";
import { useSketchLayer } from "plugins/Sketch/SketchContext.js";

function Buffer(props) {
  const { localObserver } = useSketchLayer();
  const map = props.map;

  const bufferModel = BufferFuncModel({
    map: map,
    localObserver: localObserver,
    pluginShown: props.pluginShown,
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
    />
  );
}

export default Buffer;
