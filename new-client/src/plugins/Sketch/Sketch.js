import React from "react";
import Observer from "react-event-observer";
import EditIcon from "@mui/icons-material/Edit";

// Helpers
import LocalStorageHelper from "utils/LocalStorageHelper";

// Views
import BaseWindowPlugin from "../BaseWindowPlugin";
import SketchView from "./views/SketchView";

// Models
import SketchModel from "./models/SketchModel";
import DrawModel from "../../models/DrawModel";
import KmlModel from "models/KmlModel";

// Constants
import { STORAGE_KEY, DEFAULT_MEASUREMENT_SETTINGS } from "./constants";

// Hooks
import useCookieStatus from "hooks/useCookieStatus";

// Contexts
import { SketchProvider } from "./SketchContext";

// Returns the measurement-settings-object from LS if it exists, otherwise it returns
// the default measurement-settings. The LS might be empty since the user might have chosen
// not to accept functional cookies.
const getMeasurementSettings = () => {
  const { measurementSettings } = LocalStorageHelper.get(STORAGE_KEY);
  return measurementSettings || DEFAULT_MEASUREMENT_SETTINGS;
};

const Sketch = (props) => {
  // We're gonna need to keep track of the current chosen activity. ("ADD", "REMOVE", etc).
  const [activityId, setActivityId] = React.useState("ADD");
  // We're gonna need to keep track of the currently active draw-type. ("Polygon", "Rectangle", etc).
  const [activeDrawType, setActiveDrawType] = React.useState("Polygon");
  // We have to keep track of the eventual feature that has been selected for modification.
  const [editFeature, setEditFeature] = React.useState(null);
  // We also need to keep track of if we're supposed to be enabling a modify-interaction along with
  // the edit-interaction. (The edit-interaction allows the user to change feature colors etc. and the
  // modify-interaction allows the user to change the features geometries).
  const [modifyEnabled, setModifyEnabled] = React.useState(false);
  // We also have to keep track of if free-hand-translation should be enabled or not.
  // Free-hand-translate is a part of the move-interaction allowing the user to move features
  // by dragging them in the map.
  const [translateEnabled, setTranslateEnabled] = React.useState(true);
  // We need to keep track of features that has been selected while in move-mode.
  const [moveFeatures, setMoveFeatures] = React.useState([]);
  // We're gonna need to keep track of if the actual plugin is shown or not.
  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );

  // A toggle-button that allows the user to toggle the choose-object-button in the functional Bufferview comp/buffer sketch component.
  const [toggleObjectButton, setToggleObjectButton] = React.useState(true);

  // We have to keep track of some measurement-settings
  const [measurementSettings, setMeasurementSettings] = React.useState(
    getMeasurementSettings()
  );
  // We're gonna need to keep track of if we're allowed to save stuff in LS. Let's use the hook.
  const { functionalCookiesOk } = useCookieStatus(props.app.globalObserver);
  // The local observer will handle the communication between models and views.
  const [localObserver] = React.useState(() => Observer());

  // We're also gonna need a drawModel to handle all draw functionality
  const [drawModel] = React.useState(
    () =>
      new DrawModel({
        layerName: "pluginSketch",
        map: props.map,
        observer: localObserver,
        measurementSettings: measurementSettings,
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
        modifyDefaultEnabled: modifyEnabled,
        translateDefaultEnabled: translateEnabled,
        storageKey: STORAGE_KEY,
      })
  );

  // We'll also need a KML-model so that the user can import and export to/from .kml.
  const [kmlModel] = React.useState(
    () =>
      new KmlModel({
        layerName: "pluginSketch",
        map: props.map,
        observer: localObserver,
        drawModel: drawModel,
        enableDragAndDrop: true,
      })
  );

  // This functions handles events from the draw-model that are sent
  // when we are in edit-mode and the map is clicked. A feature might be sent
  // in the payload, but if the user clicked the map where no drawn feature exists,
  // null is sent.
  const handleModifyMapClick = React.useCallback((clickedFeature) => {
    setEditFeature(clickedFeature);
  }, []);

  // This functions handles events from the draw-model that are sent
  // when we are in move-mode and the map is clicked. The payload will contain
  // all features currently selected in the map.
  const handleMoveFeatureSelected = React.useCallback((selectedFeatures) => {
    setMoveFeatures(selectedFeatures);
  }, []);

  // This effect makes sure to subscribe (and un-subscribe) to all observer-events
  // we are interested in in this view.
  React.useEffect(() => {
    localObserver.subscribe("drawModel.modify.mapClick", handleModifyMapClick);
    localObserver.subscribe("drawModel.move.select", handleMoveFeatureSelected);
    return () => {
      localObserver.unsubscribe("drawModel.modify.mapClick");
      localObserver.unsubscribe("drawModel.move.select");
    };
  }, [localObserver, handleModifyMapClick, handleMoveFeatureSelected]);

  // This effect makes sure that we activate the proper draw-interaction when the draw-type,
  // activity-id, or plugin-visibility changes. (This includes activating the first draw-interaction on first render).
  React.useEffect(() => {
    // If the plugin is not shown, we have to make sure to disable
    // the potential draw-interaction.
    if (!pluginShown || !toggleObjectButton) {
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
      case "MOVE":
        return drawModel.toggleDrawInteraction("Move");
      default:
        return drawModel.toggleDrawInteraction("");
    }
  }, [activeDrawType, activityId, drawModel, pluginShown, toggleObjectButton]);

  // This effect makes sure to reset the edit- and move-feature if the window is closed,
  // or if the user changes activity. (We don't want to keep the features selected
  // if the user toggles from edit- or move-mode to create mode for example).
  React.useEffect(() => {
    setEditFeature(null);
    setMoveFeatures([]);
  }, [activityId, pluginShown, toggleObjectButton]);

  // An effect that makes sure to set the modify-interaction in the model
  // when the modify-state changes.
  React.useEffect(() => {
    drawModel.setModifyActive(modifyEnabled);
  }, [drawModel, modifyEnabled]);

  // An effect that makes sure to set the translate-interaction in the model
  // when the translate-state changes.
  React.useEffect(() => {
    drawModel.setTranslateActive(translateEnabled);
  }, [drawModel, translateEnabled]);

  // An effect making sure to update the measurement-settings in the draw-model
  // (and in LS if thats OK) when they are changed in the view.
  React.useEffect(() => {
    if (functionalCookiesOk) {
      LocalStorageHelper.set(STORAGE_KEY, {
        ...LocalStorageHelper.get(STORAGE_KEY),
        measurementSettings: measurementSettings,
      });
    }
    drawModel.setMeasurementSettings(measurementSettings);
  }, [functionalCookiesOk, drawModel, measurementSettings]);

  // We're gonna need to catch if the user closes the window, and make sure to
  // update the state so that the effect handling the draw-interaction-toggling fires.
  const onWindowHide = () => {
    setPluginShown(false);
    setToggleObjectButton(false);
  };

  // We're gonna need to catch if the user opens the window, and make sure to
  // update the state so that the effect handling the draw-interaction-toggling fires.
  const onWindowShow = () => {
    setPluginShown(true);
    setToggleObjectButton(true);
  };

  // We're rendering the view in a BaseWindowPlugin, since this is a
  // "standard" plugin.
  return (
    <SketchProvider>
      <BaseWindowPlugin
        {...props}
        type="Sketch"
        custom={{
          icon: <EditIcon />,
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
          kmlModel={kmlModel}
          options={props.options}
          localObserver={localObserver}
          globalObserver={props.app.globalObserver}
          activeDrawType={activeDrawType}
          activityId={activityId}
          setActivityId={setActivityId}
          setPluginShown={setPluginShown}
          setActiveDrawType={setActiveDrawType}
          modifyEnabled={modifyEnabled}
          setModifyEnabled={setModifyEnabled}
          translateEnabled={translateEnabled}
          setTranslateEnabled={setTranslateEnabled}
          editFeature={editFeature}
          moveFeatures={moveFeatures}
          measurementSettings={measurementSettings}
          setMeasurementSettings={setMeasurementSettings}
          map={props.map}
          app={props.app}
          pluginShown={pluginShown}
          toggleObjectButton={toggleObjectButton}
          setToggleObjectButton={setToggleObjectButton}
        />
      </BaseWindowPlugin>
    </SketchProvider>
  );
};

export default Sketch;
