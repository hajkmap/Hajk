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
  // We're gonna need to keep track of the current chosen activity. ("ADD", "REMOVE", etc).
  const [activityId, setActivityId] = React.useState("ADD");
  // We're gonna need to keep track of the currently active draw-type. ("Polygon", "Rectangle", etc).
  const [activeDrawType, setActiveDrawType] = React.useState("Polygon");
  // We have to keep track of the eventual feature that has been selected for modification.
  const [editFeature, setEditFeature] = React.useState(null);
  // We're gonna need to keep track of if the actual plugin is shown or not.
  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );
  // The local observer will handle the communication between models and views.
  const [localObserver] = React.useState(() => Observer());

  // We're also gonna need a drawModel to handle all draw functionality
  const [drawModel] = React.useState(
    () =>
      new DrawModel({
        layerName: "sketchLayer",
        map: props.map,
        observer: localObserver,
      })
  );

  // We need a model used to interact with the map etc. We want to
  // keep the view free from direct interactions.
  // There's a possibility that this model won't be needed since most
  // (if not all) of the functionality should exist in the core Draw-model.
  const [sketchModel] = React.useState(
    () =>
      new SketchModel({
        drawModel: drawModel,
      })
  );

  // This functions handles events from the draw-model that are sent
  // when we are in edit-mode and the map is clicked. A feature might be sent
  // in the payload, but if the user clicked the map where no drawn feature exists,
  // null is sent.
  const handleModifyMapClick = React.useCallback((clickedFeature) => {
    setEditFeature(clickedFeature);
  }, []);

  // This effect makes sure to subscribe (and un-subscribe) to all observer-events
  // we are interested in in this view.
  React.useEffect(() => {
    localObserver.subscribe("drawModel.modify.mapClick", handleModifyMapClick);
    return () => {
      localObserver.unsubscribe("drawModel.modify.mapClick");
    };
  }, [localObserver, handleModifyMapClick]);

  // This effect makes sure that we activate the proper draw-interaction when the draw-type,
  // activity-id, or plugin-visibility changes. (This includes activating the first draw-interaction on first render).
  React.useEffect(() => {
    // If the plugin is not shown, we have to make sure to disable
    // the potential draw-interaction.
    if (!pluginShown) {
      return drawModel.toggleDrawInteraction("");
    }
    // Otherwise, we make sure to toggle the draw-interaction to the correct one.
    switch (activityId) {
      case "ADD":
        return drawModel.toggleDrawInteraction(activeDrawType);
      case "DELETE":
        return drawModel.toggleDrawInteraction("Delete");
      case "EDIT":
        return drawModel.toggleDrawInteraction("Edit");
      default:
        return drawModel.toggleDrawInteraction("");
    }
  }, [activeDrawType, activityId, drawModel, pluginShown]);

  // We're gonna need to catch if the user closes the window, and make sure to
  // update the state so that the effect handling the draw-interaction-toggling fires.
  const onWindowHide = () => {
    setPluginShown(false);
  };
  // We're gonna need to catch if the user opens the window, and make sure to
  // update the state so that the effect handling the draw-interaction-toggling fires.
  const onWindowShow = () => {
    setPluginShown(true);
    setEditFeature(null);
  };

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
        width: 350,
        onWindowHide: onWindowHide,
        onWindowShow: onWindowShow,
      }}
    >
      <SketchView
        model={sketchModel}
        drawModel={drawModel}
        options={props.options}
        localObserver={localObserver}
        activeDrawType={activeDrawType}
        activityId={activityId}
        setActivityId={setActivityId}
        setActiveDrawType={setActiveDrawType}
        editFeature={editFeature}
      />
    </BaseWindowPlugin>
  );
};

export default Sketch;
