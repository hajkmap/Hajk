// Base
import React from "react";
import { Grid } from "@mui/material";
// Constants
import {
  PLUGIN_MARGIN,
  MAX_REMOVED_FEATURES,
  DEFAULT_DRAW_STYLE_SETTINGS,
} from "../constants";
// Components
import ActivityMenu from "../components/ActivityMenu";
// Views
import AddView from "./AddView";
import SaveView from "./SaveView";
import UploadView from "./UploadView";
import DeleteView from "./DeleteView";
import MoveView from "./MoveView";
import EditView from "./EditView";
import SettingsView from "./SettingsView";
// Hooks
import useCookieStatus from "../../../hooks/useCookieStatus";
import useUpdateEffect from "../../../hooks/useUpdateEffect";

//Snackbar
import { useSnackbar } from "notistack";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { Circle, Stroke, Fill, Style } from "ol/style.js";

// The SketchView is the main view for the Sketch-plugin.
const SketchView = (props) => {
  // We want to render the ActivityMenu on the same side as the plugin
  // is rendered (left or right). Let's grab the prop stating where it is rendered!
  const pluginPosition = props.options?.position ?? "left";
  // We are going to be using the sketch-, kml-, and draw-model. Let's destruct them.
  const { model, drawModel, kmlModel } = props;
  // We are gonna need the local- and global-observer
  const { localObserver, globalObserver } = props;
  // The current draw-type is also required, along with it's set:er.
  const { activeDrawType, setActiveDrawType } = props;
  // We're gonna need to keep track of the current chosen activity.
  const { activityId, setActivityId } = props;

  // We're gonna need some snackbar functions so that we can prompt the user with information.
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  // We don't want to prompt the user with more than one snack, so lets track the current one,
  // so that we can close it when another one is about to open.
  const helperSnack = React.useRef(null);

  // We're gonna need to keep track of some draw-styling...
  const [drawStyle, setDrawStyle] = React.useState(
    model.getDrawStyleSettings()
  );
  // ...and some text-styling.
  const [textStyle, setTextStyle] = React.useState(
    model.getTextStyleSettings()
  );
  // We want to keep track of the last removed features so that the user can restore
  // features that they potentially removed by mistake.
  const [removedFeatures, setRemovedFeatures] = React.useState(
    model.getRemovedFeaturesFromStorage()
  );
  // We want to keep track of the recently imported kml-files so that the user can remove or hide
  // all features from an imported kml-file.The array will contain objects with an id (this id will
  // be present on each feature from that kml-file as well) along with a title that can be shown to the user.
  const [uploadedFiles, setUploadedFiles] = React.useState([]);
  // We're gonna need to keep track of if we're allowed to save stuff in LS. Let's use the hook.
  const { functionalCookiesOk } = useCookieStatus(globalObserver);

  // Checks that every entry in the array of uploaded files still
  // has some features in the map. If it doesn't, the entry is removed.
  const refreshUploadsList = React.useCallback(() => {
    const refreshedUploadsList = uploadedFiles.filter((file) => {
      return kmlModel.importedKmlStillHasFeatures(file.id);
    });
    setUploadedFiles(refreshedUploadsList);
  }, [kmlModel, uploadedFiles]);

  // Handler making sure to keep the removed features updated when a new feature is removed.
  const handleFeatureRemoved = React.useCallback(
    (feature) => {
      // If the user has chosen not to accept functional cookies, we cannot save the recently
      // removed feature. In that case, let's return right away.
      if (!functionalCookiesOk) {
        return;
      }
      // There are some special cases where the removed feature should not be added
      // to the list of removed features. More information can be found in the method
      // declaration.
      if (!model.featureShouldBeAddedToStorage(feature)) {
        return;
      }
      // We're gonna need to decorate the removed feature so that we can keep track of it.
      model.decorateFeature(feature);
      // We have to make sure to update the local storage with the newly removed feature so that
      // the removed features are kept between sessions.
      model.addFeatureToStorage(feature);
      // Then we'll update the state
      setRemovedFeatures(
        [feature, ...removedFeatures].slice(0, MAX_REMOVED_FEATURES)
      );
      // We also have to make sure to remove eventual uploads where all its features
      // has been removed. (It does not make sense to have a list of imports where all the
      // features from the import has been removed).
      refreshUploadsList();
    },
    [model, removedFeatures, functionalCookiesOk, refreshUploadsList]
  );

  // Handler making sure to keep the removed features updated when the user has pressed "removed all features".
  const handleFeaturesRemoved = React.useCallback(
    (features) => {
      // If the user has chosen not to accept functional cookies, we cannot save the recently
      // removed feature. In that case, let's return right away.
      if (!functionalCookiesOk) {
        return;
      }
      // Since we might be dealing with thousands of features removed at the same time, we make sure
      // to grab only the first "MAX_REMOVED_FEATURES" (around 5). (While also ignoring hidden features).
      const lastRemovedFeatures = features
        .filter((f) => f.get("HIDDEN") !== true)
        .slice(0, MAX_REMOVED_FEATURES);
      // Then we'll loop over these features and decorate them with id:s and dates.
      for (const feature of lastRemovedFeatures) {
        // We're gonna need to decorate the removed feature so that we can keep track of it.
        model.decorateFeature(feature);
        // We have to make sure to update the local storage with the newly removed feature so that
        // the removed features are kept between sessions.
        model.addFeatureToStorage(feature);
      }
      // Since we might _not_ be dealing with enough features to fill the list of removed features,
      // we have to make sure to merge the features that were just deleted with the features that
      // we might have from earlier, and then extract the last "MAX_REMOVED_FEATURES" of them.
      const removedFeaturesToShow = [
        ...lastRemovedFeatures,
        ...removedFeatures,
      ].slice(0, MAX_REMOVED_FEATURES);
      // Then we'll update the state.
      setRemovedFeatures(removedFeaturesToShow);
      // We also have to make sure to remove eventual uploads where all its features
      // has been removed. (It does not make sense to have a list of imports where all the
      // features from the import has been removed).
      refreshUploadsList();
    },
    [model, removedFeatures, functionalCookiesOk, refreshUploadsList]
  );

  // Handler for when a feature is added to the draw-source via the addFeature-method
  // in the drawModel.
  const handleFeatureAdded = React.useCallback(
    (feature) => {
      // We only care about features that contain the "HANDLED_ID"-prop (which basically) means
      // we're dealing with a feature that was removed at an earlier stage, and is now being restored.
      const handledId = feature.get("HANDLED_ID");
      if (handledId) {
        // If we're restoring a feature from the list of removed features, we have to update the list
        // of removed features obviously.
        setRemovedFeatures(
          removedFeatures.filter((f) => f.get("HANDLED_ID") !== handledId)
        );
        // We also have to remove the restored feature from the storage
        model.removeFeatureFromStorage(handledId);
      }
    },
    [model, removedFeatures]
  );

  // Handles when a kml-file has been added to the map via the drag-and-drop
  // functionality. Makes sure to update the state containing the uploaded files.
  const handleKmlFileImported = React.useCallback(
    ({ id }) => {
      setUploadedFiles((files) => [
        ...files,
        {
          id,
          title: model.getDateTimeString({
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
          }),
          hidden: false,
          textShown: true,
        },
      ]);
    },
    [model]
  );

  // This effect makes sure to update the draw-style-settings in the draw-model when
  // the user changes the style-settings in the view.
  React.useEffect(() => {
    return drawModel.setDrawStyleSettings(drawStyle);
  }, [drawModel, drawStyle]);

  // This effect makes sure to update the text-style-settings in the draw-model when
  // the user changes the text-style-settings in the view.
  React.useEffect(() => {
    return drawModel.setTextStyleSettings(textStyle);
  }, [drawModel, textStyle]);

  // This effect makes sure to save the draw-style-settings to the LS when it
  // changes. (Only if functional cookies are allowed obviously).
  React.useEffect(() => {
    functionalCookiesOk && model.setStoredDrawStyleSettings(drawStyle);
  }, [drawStyle, functionalCookiesOk, model]);

  // This effect makes sure to save the text-style-settings to the LS when it
  // changes. (Only if functional cookies are allowed obviously).
  React.useEffect(() => {
    functionalCookiesOk && model.setStoredTextStyleSettings(textStyle);
  }, [textStyle, functionalCookiesOk, model]);

  // This effect does not run on first render. (Otherwise the user would be
  // prompted with information before they've even started using the plugin).
  // If it's not the first render, the effect makes sure to prompt the user
  // with information when they change the current activity or draw-type.
  useUpdateEffect(() => {
    // Let's check if there's some helper-text that we should prompt the user with.
    const helperText = model.getHelperSnackText(activityId, activeDrawType);
    // If there is, we can prompt the user with a snack.
    if (helperText) {
      helperSnack.current = enqueueSnackbar(helperText, {
        variant: "default",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });
    }

    if (activeDrawType !== "Point") {
      setDrawStyle({
        ...drawStyle,
        radius: DEFAULT_DRAW_STYLE_SETTINGS.radius,
      });
    }
    // Let's make sure to clean-up out current snack when un-mounting!
    return () => {
      closeSnackbar(helperSnack.current);
    };
  }, [activityId, activeDrawType, enqueueSnackbar, closeSnackbar]);

  // This effect makes sure to subscribe (and unsubscribe) to the observer-events that we care about.
  React.useEffect(() => {
    // Fires when a feature has been removed from the draw-source.
    localObserver.subscribe("drawModel.featureRemoved", handleFeatureRemoved);
    localObserver.subscribe("drawModel.featuresRemoved", handleFeaturesRemoved);
    localObserver.subscribe("drawModel.featureAdded", handleFeatureAdded);
    localObserver.subscribe("kmlModel.fileImported", handleKmlFileImported);
    return () => {
      localObserver.unsubscribe("drawModel.featureRemoved");
      localObserver.unsubscribe("drawModel.featuresRemoved");
      localObserver.unsubscribe("drawModel.featureAdded");
      localObserver.unsubscribe("kmlModel.fileImported");
    };
  }, [
    activityId,
    localObserver,
    handleFeatureRemoved,
    handleFeaturesRemoved,
    handleFeatureAdded,
    handleKmlFileImported,
  ]);

  /* State object for the buffer sketch component
  - isSelecting: boolean - true if the user is currently selecting steps in the buffer stepper
  - distance: number - the distance to buffer the selected features
  - activeStep: number - the current step in the buffer stepper
  - isHighlightLayerAdded: boolean - checks if the highlight layer is added to the map
  - isBufferLayerAdded: boolean - checks if the buffer layer is added to the map
  - Vector sources and layers for the highlight and buffer layers
  */
  const [bufferState, setBufferState] = React.useState({
    isSelecting: false,
    distance: 1000,
    activeStep: 0,
    highlightSource: new VectorSource(),
    bufferSource: new VectorSource(),
    isHighlightLayerAdded: false,
    isBufferLayerAdded: false,
  });
  const [highlightLayer] = React.useState(
    new VectorLayer({
      source: bufferState.highlightSource,
      layerType: "system",
      zIndex: 5000,
      name: "pluginBufferSelections",
      caption: "Buffer selection layers",
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 168, 231, 0.47)",
        }),
        stroke: new Stroke({
          color: "rgba(255, 168, 231, 1)",
          width: 4,
        }),
        image: new Circle({
          radius: 6,
          fill: new Fill({
            color: "rgba(255, 168, 231, 0.47)",
          }),
          stroke: new Stroke({
            color: "rgba(255, 168, 231, 1)",
            width: 1,
          }),
        }),
      }),
    })
  );
  const [bufferLayer] = React.useState(
    new VectorLayer({
      source: bufferState.bufferSource,
      layerType: "system",
      zIndex: 5000,
      name: "pluginBuffers",
      caption: "Buffer layer",
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.5)",
        }),
        stroke: new Stroke({
          color: "rgba(75, 100, 115, 1.5)",
          width: 4,
        }),
        image: new Circle({
          radius: 6,
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.5)",
          }),
          stroke: new Stroke({
            color: "rgba(75, 100, 115, 1.5)",
            width: 2,
          }),
        }),
      }),
    })
  );

  // This useEffect makes sure to clear the highlight-source when the user changes the activity.
  React.useEffect(() => {
    if (activityId !== "ADD" || !props.pluginShown) {
      localObserver.publish("resetViews");
      bufferState.highlightSource.clear();
      setBufferState({
        ...bufferState,
        isHighlightLayerAdded: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bufferState.isHighlightLayerAdded,
    activityId,
    localObserver,
    bufferState.highlightSource,
    props.pluginShown,
  ]);

  // This useEffect makes sure to always enable the possibility to draw every time the draw-tool is opened.

  React.useEffect(() => {
    if (activityId === "ADD" || !props.pluginShown) {
      props.setToggleBufferBtn({ ...props.toggleBufferBtn, toggle: true });
      setBufferState((prevState) => ({
        ...prevState,
        isSelecting: false,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, props.pluginShown]);

  // The current view depends on which tab the user has
  // selected. Tab 0: The "create-view", Tab 1: The "save-upload-view".
  const renderCurrentView = () => {
    // Let's check which activity we're supposed to render!
    switch (activityId) {
      case "ADD":
        return (
          <AddView
            id={activityId}
            setPluginShown={props.setPluginShown}
            model={model}
            localObserver={localObserver}
            globalObserver={globalObserver}
            drawModel={drawModel}
            activeDrawType={activeDrawType}
            setActiveDrawType={setActiveDrawType}
            drawStyle={drawStyle}
            setDrawStyle={setDrawStyle}
            textStyle={textStyle}
            setTextStyle={setTextStyle}
            pluginShown={props.pluginShown}
            bufferState={bufferState}
            setBufferState={setBufferState}
            highlightLayer={highlightLayer}
            bufferLayer={bufferLayer}
            toggleBufferBtn={props.toggleBufferBtn}
            setToggleBufferBtn={props.setToggleBufferBtn}
          />
        );
      case "DELETE":
        return (
          <DeleteView
            id={activityId}
            model={model}
            drawModel={drawModel}
            removedFeatures={removedFeatures}
            globalObserver={globalObserver}
            functionalCookiesOk={functionalCookiesOk}
          />
        );
      case "EDIT":
        return (
          <EditView
            id={activityId}
            model={model}
            drawModel={drawModel}
            editFeature={props.editFeature}
            modifyEnabled={props.modifyEnabled}
            setModifyEnabled={props.setModifyEnabled}
          />
        );
      case "MOVE":
        return (
          <MoveView
            id={activityId}
            model={model}
            drawModel={drawModel}
            translateEnabled={props.translateEnabled}
            setTranslateEnabled={props.setTranslateEnabled}
            moveFeatures={props.moveFeatures}
          />
        );
      case "SAVE":
        return (
          <SaveView
            id={activityId}
            model={model}
            drawModel={drawModel}
            globalObserver={globalObserver}
            functionalCookiesOk={functionalCookiesOk}
          />
        );
      case "UPLOAD":
        return (
          <UploadView
            id={activityId}
            model={model}
            drawModel={drawModel}
            kmlModel={kmlModel}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
          />
        );
      case "SETTINGS":
        return (
          <SettingsView
            id={activityId}
            model={model}
            functionalCookiesOk={functionalCookiesOk}
            measurementSettings={props.measurementSettings}
            setMeasurementSettings={props.setMeasurementSettings}
            globalObserver={globalObserver}
          />
        );
      default:
        return null;
    }
  };

  const renderBaseWindowLeft = () => {
    return (
      // The base plugin-window (in which we render the plugins) has a padding
      // of 10 set. In this plugin we want to render the <ActivityMenu /> at the
      // border of the window, hence we must set a negative margin-left of 10.
      <Grid container>
        <Grid item xs={3} style={{ marginLeft: -PLUGIN_MARGIN }}>
          <ActivityMenu
            pluginPosition={pluginPosition}
            activityId={activityId}
            setActivityId={setActivityId}
          />
        </Grid>
        <Grid item xs={9}>
          {renderCurrentView()}
        </Grid>
      </Grid>
    );
  };

  const renderBaseWindowRight = () => {
    return (
      // The base plugin-window (in which we render the plugins) has a padding
      // of 10 set. In this plugin we want to render the <ActivityMenu /> at the
      // border of the window, hence we must set a negative margin-right of 10.
      <Grid container justifyContent="flex-end">
        <Grid item xs={9}>
          {renderCurrentView()}
        </Grid>
        <Grid item xs={3} style={{ marginRight: -PLUGIN_MARGIN }}>
          <ActivityMenu
            pluginPosition={pluginPosition}
            activityId={activityId}
            setActivityId={setActivityId}
          />
        </Grid>
      </Grid>
    );
  };

  // We want the ActivityMenu to be rendered in a place where it doesn't
  // conflict with other user interactions. Therefore, we're rendering either
  // all the way to the left (if the plugin is rendered on the left part of the
  // screen), otherwise, we render it all the way to the right.
  return pluginPosition === "left"
    ? renderBaseWindowLeft()
    : renderBaseWindowRight();
};

export default SketchView;
