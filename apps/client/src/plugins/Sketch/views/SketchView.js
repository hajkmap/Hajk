// Base
import React from "react";
import { Grid } from "@mui/material";
// Constants
import {
  PLUGIN_MARGIN,
  MAX_REMOVED_FEATURES,
  DEFAULT_DRAW_STYLE_SETTINGS,
  PLUGIN_COLORS,
} from "../constants";
// Components
import ActivityMenu from "../components/ActivityMenu";
import ConfirmServiceSwitchWithDrawings from "../../../components/ConfirmServiceSwitchWithDrawings";
// Views
import AddView from "./AddView";
import SaveView from "./SaveView";
import UploadView from "./UploadView";
import DeleteView from "./DeleteView";
import MoveView from "./MoveView";
import EditView from "./EditView";
import SettingsView from "./SettingsView";
import OGCView from "./OGCView";
// Hooks
import useCookieStatus from "../../../hooks/useCookieStatus";
import useUpdateEffect from "../../../hooks/useUpdateEffect";

//Snackbar
import { useSnackbar } from "notistack";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";

//Bus
import { editBus } from "../../../buses/editBus";

// The SketchView is the main view for the Sketch-plugin.
const SketchView = (props) => {
  const [hasUnsaved, setHasUnsaved] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const unsavedRef = React.useRef({
    hasUnsaved: false,
    summary: { adds: 0, edits: 0, deletes: 0 },
  });

  // We want to render the ActivityMenu on the same side as the plugin
  // is rendered (left or right). Let's grab the prop stating where it is rendered!
  const pluginPosition = props.options?.position ?? "left";
  // We are going to be using the sketch-, kml-, and draw-model. Let's destruct them.
  const { model, drawModel, kmlModel, gpxModel } = props;
  // We are gonna need the local- and global-observer
  const { localObserver, globalObserver } = props;
  // The current draw-type is also required, along with it's set:er.
  const { activeDrawType, setActiveDrawType } = props;
  // We're gonna need to keep track of the current chosen activity.
  const { activityId, setActivityId } = props;
  // We're gonna need to keep track of the current plugin-shown-state and the toggle-buffer-button.
  const { pluginShown, setToggleBufferBtn, toggleBufferBtn } = props;
  // We're gonna need to keep track of the allowed geometry types
  const { allowedGeometryTypes } = props;

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

  const [ogcSource, setOgcSource] = React.useState("Ingen");
  const [serviceList, setServiceList] = React.useState([]);

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

  const [drawingsWarningDialog, setDrawingsWarningDialog] = React.useState({
    open: false,
    targetService: null,
    drawingCount: 0,
  });

  const getDrawnFeaturesCount = React.useCallback(() => {
    // Find sketch layer
    const layers = props.map.getLayers().getArray?.() || [];
    const sketchLayer =
      layers.find((lyr) => lyr?.get?.("name") === "pluginSketch") || null;
    const source = sketchLayer.getSource?.();
    const features = source.getFeatures?.() || [];
    const visibleFeatures = features.filter((f) => f.get("HIDDEN") !== true);
    return visibleFeatures.length;
  }, [props.map]);

  React.useEffect(() => {
    const offList = editBus.on("edit:service-list-loaded", (ev) => {
      const { serviceList } = ev.detail || {};
      if (serviceList) {
        setServiceList(serviceList);
      }
    });

    return () => {
      offList();
    };
  }, []);

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
  - isSelecting: boolean - true if the user is currently selecting objects to buffer.
  - distance: number - the distance to buffer the selected drawn object.
  - activeStep: number - the current step in the buffer stepper.
  - Vector sources for the highlight and buffer layers.
  - isBufferStyle: boolean - checks if the buffer style is added to the map.
  */
  const [bufferState, setBufferState] = React.useState({
    isSelecting: false,
    distance: 1000,
    activeStep: 0,
    highlightSource: new VectorSource(),
    isBufferStyle: false,
  });
  const [highlightLayer] = React.useState(
    new VectorLayer({
      source: bufferState.highlightSource,
      layerType: "system",
      name: "pluginBufferSelections",
      caption: "Buffer selection layers",
    })
  );

  // This useEffect makes sure to clear the highlight-source when the user changes the activity.
  React.useEffect(() => {
    if (activityId !== "ADD" || !pluginShown) {
      localObserver.publish("resetViews");
      bufferState.highlightSource.clear();
    }
  }, [activityId, localObserver, bufferState.highlightSource, pluginShown]);

  const memoizedSetToggleBufferBtn = React.useCallback(
    (newToggleBufferBtn) => {
      setToggleBufferBtn((prevToggleBufferBtn) => ({
        ...prevToggleBufferBtn,
        ...newToggleBufferBtn,
      }));
    },
    [setToggleBufferBtn]
  );

  // This useEffect makes sure to always enable the possibility to draw every time the draw-tool is opened.
  React.useEffect(() => {
    if (activityId || !pluginShown || activeDrawType === "Circle") {
      memoizedSetToggleBufferBtn({ toggle: true });
      setBufferState((prevState) => ({
        ...prevState,
        isSelecting: false,
      }));
    }
    if (activityId === "ADD") {
      setBufferState((prevState) => ({
        ...prevState,
        activeStep: 0,
        isBufferStyle: false,
      }));
    }
  }, [activityId, pluginShown, memoizedSetToggleBufferBtn, activeDrawType]);

  React.useEffect(() => {
    const offUnsaved = editBus.on("edit:unsaved-state", (ev) => {
      const { hasUnsaved, summary } = ev.detail || {};
      setHasUnsaved(!!hasUnsaved);
      unsavedRef.current = {
        hasUnsaved: !!hasUnsaved,
        summary: summary || { adds: 0, edits: 0, deletes: 0 },
      };
    });

    const offSaveStart = editBus.on("edit:saving-started", () => {
      setIsSaving(true);
    });
    const offSaveEnd = editBus.on("edit:saving-finished", () => {
      setIsSaving(false);
    });

    return () => {
      offUnsaved();
      offSaveStart();
      offSaveEnd();
    };
  }, []);

  const uiDisabled = isSaving || (ogcSource && ogcSource !== "Ingen");

  const handleOgcSourceChange = (newOgcSourceTitle) => {
    if (isSaving) return;

    const selectedService = serviceList.find(
      (s) => (s.title || s.id) === newOgcSourceTitle
    );
    const serviceId = selectedService?.id || null;

    // Check if user is trying to select a service (not "Ingen")
    const isSelectingService = newOgcSourceTitle !== "Ingen";

    // If user selects a service AND there are drawn objects, show warning
    if (isSelectingService && ogcSource === "Ingen") {
      const drawingCount = getDrawnFeaturesCount();

      if (drawingCount > 0) {
        // Show warning dialog instead of switching directly
        setDrawingsWarningDialog({
          open: true,
          targetService: { title: newOgcSourceTitle, id: serviceId },
          drawingCount: drawingCount,
        });
        return; // Cancel the switch until user confirms
      }
    }

    // Logic for unsaved changes in AttributeEditor
    if (hasUnsaved) {
      editBus.emit("edit:service-switch-requested", {
        source: "sketch",
        targetLabel: newOgcSourceTitle,
        targetId: serviceId,
      });
      return;
    }

    // Continue with switch
    props.setPluginSettings(
      newOgcSourceTitle === "Ingen"
        ? { title: "Rita", color: PLUGIN_COLORS.default }
        : {
            title: `Redigerar ${newOgcSourceTitle}`,
            color: PLUGIN_COLORS.warning,
          }
    );

    if (newOgcSourceTitle === "Ingen") {
      editBus.emit("edit:service-cleared", { source: "sketch" });
    } else {
      editBus.emit("edit:service-selected", {
        source: "sketch",
        id: serviceId,
        layerId: selectedService?.layers?.[0]?.id || "",
        title: newOgcSourceTitle,
        color: PLUGIN_COLORS.warning,
      });
    }
    setOgcSource(newOgcSourceTitle);
  };

  // Add callback to handle user's choice in dialog
  const handleConfirmServiceSwitchWithDrawings = React.useCallback(() => {
    const { targetService } = drawingsWarningDialog;

    if (!targetService) return;

    // Close dialog
    setDrawingsWarningDialog({
      open: false,
      targetService: null,
      drawingCount: 0,
    });

    // Continue with switch
    props.setPluginSettings({
      title: `Redigerar ${targetService.title}`,
      color: PLUGIN_COLORS.warning,
    });

    editBus.emit("edit:service-selected", {
      source: "sketch",
      id: targetService.id,
      title: targetService.title,
      color: PLUGIN_COLORS.warning,
    });

    setOgcSource(targetService.title);

    // Show notification to user
    enqueueSnackbar(
      `Redigeringstjänst vald. ${drawingsWarningDialog.drawingCount} ritade objekt finns kvar i kartan.`,
      { variant: "info" }
    );
  }, [drawingsWarningDialog, props, enqueueSnackbar]);

  const handleClearDrawingsAndSwitch = React.useCallback(() => {
    const { targetService } = drawingsWarningDialog;

    if (!targetService) return;

    // Remove all drawn objects - use the same method as DeleteView
    drawModel.removeDrawnFeatures(); // Changed from removeAllFeatures()

    // Close dialog
    setDrawingsWarningDialog({
      open: false,
      targetService: null,
      drawingCount: 0,
    });

    // Continue with switch
    props.setPluginSettings({
      title: `Redigerar ${targetService.title}`,
      color: PLUGIN_COLORS.warning,
    });

    editBus.emit("edit:service-selected", {
      source: "sketch",
      id: targetService.id,
      title: targetService.title,
      color: PLUGIN_COLORS.warning,
    });

    setOgcSource(targetService.title);

    // Show confirmation
    enqueueSnackbar("Ritade objekt borttagna. Redigeringstjänst vald.", {
      variant: "success",
    });
  }, [drawingsWarningDialog, drawModel, props, enqueueSnackbar]);

  React.useEffect(() => {
    const offSel = editBus.on("edit:service-selected", (ev) => {
      const { title, source } = ev.detail || {};
      if (source === "sketch") return;
      const raw =
        typeof title === "string" && title.startsWith("Redigerar ")
          ? title.replace(/^Redigerar\s+/, "")
          : title;
      if (raw) setOgcSource(raw);
    });

    const offClr = editBus.on("edit:service-cleared", (ev) => {
      const { source } = ev.detail || {};
      if (source === "sketch") return;
      setOgcSource("Ingen");
    });

    return () => {
      offSel();
      offClr();
    };
  }, []);

  // The current view depends on which tab the user has
  // selected. Tab 0: The "create-view", Tab 1: The "save-upload-view".
  const renderCurrentView = () => {
    // Let's check which activity we're supposed to render!
    switch (activityId) {
      case "ADD":
        return (
          <AddView
            id={activityId}
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
            pluginShown={pluginShown}
            bufferState={bufferState}
            setBufferState={setBufferState}
            highlightLayer={highlightLayer}
            toggleBufferBtn={toggleBufferBtn}
            setToggleBufferBtn={setToggleBufferBtn}
            uiDisabled={uiDisabled}
            allowedGeometryTypes={allowedGeometryTypes}
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
            uiDisabled={uiDisabled}
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
            setBufferState={setBufferState}
            bufferState={bufferState}
            uiDisabled={uiDisabled}
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
            uiDisabled={uiDisabled}
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
            gpxModel={gpxModel}
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
            ogcSource={ogcSource}
            handleOgcSourceChange={handleOgcSourceChange}
          />
        );
      case "OGC":
        return (
          <OGCView
            uiDisabled={isSaving}
            id={activityId}
            model={model}
            ogcSource={ogcSource}
            handleOgcSourceChange={handleOgcSourceChange}
            serviceList={serviceList}
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
        <Grid style={{ marginLeft: -PLUGIN_MARGIN }} size={3}>
          <ActivityMenu
            pluginPosition={pluginPosition}
            activityId={activityId}
            setActivityId={setActivityId}
          />
        </Grid>
        <Grid size={9}>{renderCurrentView()}</Grid>
      </Grid>
    );
  };

  const renderBaseWindowRight = () => {
    return (
      // The base plugin-window (in which we render the plugins) has a padding
      // of 10 set. In this plugin we want to render the <ActivityMenu /> at the
      // border of the window, hence we must set a negative margin-right of 10.
      <Grid container justifyContent="flex-end">
        <Grid size={9}>{renderCurrentView()}</Grid>
        <Grid style={{ marginRight: -PLUGIN_MARGIN }} size={3}>
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
  return (
    <>
      {pluginPosition === "left"
        ? renderBaseWindowLeft()
        : renderBaseWindowRight()}

      <ConfirmServiceSwitchWithDrawings
        open={drawingsWarningDialog.open}
        onClose={() =>
          setDrawingsWarningDialog({
            open: false,
            targetService: null,
            drawingCount: 0,
          })
        }
        onConfirm={handleConfirmServiceSwitchWithDrawings}
        onClearDrawings={handleClearDrawingsAndSwitch}
        drawingCount={drawingsWarningDialog.drawingCount}
        targetServiceName={drawingsWarningDialog.targetService?.title || ""}
      />
    </>
  );
};

export default SketchView;
