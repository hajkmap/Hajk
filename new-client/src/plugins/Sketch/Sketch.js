import React from "react";
import Observer from "react-event-observer";
import GestureIcon from "@material-ui/icons/Gesture";

// Views
import BaseWindowPlugin from "../BaseWindowPlugin";
import SketchView from "./views/SketchView";

// Models
import SketchModel from "./models/SketchModel";
import DrawModel from "../../models/DrawModel";

const Sketch = (props) => {
  // The local observer will handle the communication between models and views.
  const localObserver = Observer();

  // A model used to interact with the map etc. We want to
  // keep the view free from direct interactions.
  // There's a possibility that this model won't be needed since most
  // (if not all) of the functionality should exist in the core Draw-model.
  const sketchModel = new SketchModel({
    localObserver: localObserver,
    app: props.app,
    options: props.options,
  });

  // Initiate a new DrawModel (core).
  const drawModel = new DrawModel({ layerName: "sketchLayer", map: props.map });

  // We're gonna need to catch if the user closes the window, and make sure to
  // disable the draw interaction if it is active. Let's publish a couple events. (TODO)
  const onWindowHide = () => {};

  // We're rendering the view in a BaseWindowPlugin, since this is a
  // "standard" plugin.
  return (
    <BaseWindowPlugin
      {...props}
      type="Sketch"
      custom={{
        icon: <GestureIcon />,
        title: "Rita",
        description: "Skapa dina helt egna geometrier!",
        height: "dynamic",
        width: 400,
        onWindowHide: onWindowHide,
      }}
    >
      <SketchView
        model={sketchModel}
        drawModel={drawModel}
        options={props.options}
        localObserver={localObserver}
      />
    </BaseWindowPlugin>
  );
};

export default Sketch;
