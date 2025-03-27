// Base
import React, { useState, useEffect, useCallback } from "react";
import Observer from "react-event-observer";
import { useSnackbar } from "notistack";

// Icons
import RepeatIcon from "@mui/icons-material/Repeat";

// Views
import BaseWindowPlugin from "../BaseWindowPlugin";
import VisionIntegrationView from "./views/VisionIntegrationView";

// Models
import MapViewModel from "./models/MapViewModel";
import VisionIntegrationModel from "./models/VisionIntegrationModel";

// Utils
import { getSearchSources } from "./utils";

// Constants
import {
  HUB_CONNECTION_STATUS,
  INTEGRATION_IDS,
  ENVIRONMENT_IDS,
  EDIT_STATUS,
} from "./constants";

// Hooks
import useUpdateEffect from "hooks/useUpdateEffect";

function VisionIntegration(props) {
  // Let's destruct the options from the props (and fall back on empty object to avoid
  // a complete disaster if the plugin is wrongly configured), along with the map and app.
  const { options = {}, map, app } = props;
  // We're gonna need a local-observer so that we can pass some events around
  const [localObserver] = useState(() => Observer());
  // We're gonna need the search-sources (basically information regarding the search-sources
  // that are set in the plugin-options. In the plugin-options we only reference to these objects,
  // and they have to be fetched from the global config).
  const [searchSources] = useState(() => getSearchSources(props));
  // Since we're gonna be drawing, we're gonna need to keep track of wether
  // the plugin is currently shown or not. (If the plugin is hidden the draw-
  // functionality should be disabled).
  const [pluginShown, setPluginShown] = useState(
    options.visibleAtStart ?? false
  );
  // We have to keep track of which tab we're currently on...
  const [activeTab, setActiveTab] = useState(INTEGRATION_IDS.ESTATES);
  // We have to keep track of the edit-state
  const [editState, setEditState] = useState({
    mode: EDIT_STATUS.INACTIVE,
    features: [],
    text: "",
  });
  // We have to keep track of which environment-type is currently active...
  const [activeEnvironmentType, setActiveEnvironmentType] = useState(
    ENVIRONMENT_IDS.AREA
  );
  // We're gonna need a map-view-model to interact with the map...
  const [mapViewModel] = useState(
    () => new MapViewModel({ options, localObserver, map, app })
  );
  // We're gonna need a model containing VisionIntegration-functionality...
  const [model] = useState(
    () =>
      new VisionIntegrationModel({
        options,
        localObserver,
        searchSources,
        map,
        app,
        mapViewModel,
        initialEnvironmentTypeId: ENVIRONMENT_IDS.AREA,
      })
  );
  // We're gonna want to make sure proper settings are supplied when starting
  // the plugin... If some crucial settings are missing we'll just display an
  // error instead of the "real" UI.
  const [configError] = useState(!model.configurationIsValid());
  // We're gonna want to keep track of the hub connection-status (We're
  // gonna want to show the connection state to the user so that they can know if the
  // connection has failed etc).
  const [hubConnectionStatus, setHubConnectionStatus] = useState(
    HUB_CONNECTION_STATUS.LOADING
  );
  // We're gonna need to keep track of the currently selected estates.
  // The selected estates could change when a user selects/deselects estates in the map
  // or if estates are sent from Vision.
  const [selectedEstates, setSelectedEstates] = useState([]);
  // We're also gonna need to keep track of the currently selected coordinates.
  // The selected coordinates could change when a user selected/deselects coordinates in
  // the map or if coordinates are sent from Vision
  const [selectedCoordinates, setSelectedCoordinates] = useState([]);
  // We're also gonna have to keep track of the environment-state (such as selected environment-objects etc.)
  const [environmentState, setEnvironmentState] = useState(() =>
    model.getInitialEnvironmentState()
  );
  // We also have to keep track of which map-interaction that is currently active
  const [activeMapInteraction, setActiveMapInteraction] = useState(null);
  // We're gonna need some snackbar functions so that we can prompt the user with information.
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  // We don't want to prompt the user with more than one snack, so lets track the current one,
  // so that we can close it when another one is about to open.
  const helperSnack = React.useRef(null);

  // We're gonna need a handler for the estate-search-success event.
  const handleEstateSearchSuccess = useCallback(
    (features) => {
      // We want to jump to the estate-section when new estates has been found
      setActiveTab(INTEGRATION_IDS.ESTATES);
      // We also want to zoom to the features that we we're sent
      mapViewModel.zoomToFeatures(features);
      // Then we'll update the state
      setSelectedEstates(features);
    },
    [mapViewModel]
  );

  // We're gonna need a handler for the environment-search-success event.
  const handleEnvironmentSearchSuccess = useCallback(
    (payload) => {
      // The payload from this event will contain the resulting features along
      // with the environment-type-id to which they belong.
      const { features, typeId } = payload;
      // We want to jump to the environment-section when new environment features has been found
      setActiveTab(INTEGRATION_IDS.ENVIRONMENT);
      // We also want to set the environment-type
      setActiveEnvironmentType(typeId);
      // We also want to zoom to the features that we received
      mapViewModel.zoomToFeatures(features);
      // We also have to update the environment-state with the features to show...
      setEnvironmentState((prev) => ({
        ...prev,
        [typeId]: {
          selectedFeatures: features,
          wmsActive: prev[typeId].wmsActive,
        },
      }));
    },
    [mapViewModel]
  );

  // We're gonna need a handler for the coordinates-from-vision event.
  const handleCoordinatesReceivedFromVision = useCallback(
    (features) => {
      // We want to jump to the estate-section when new estates has been found
      setActiveTab(INTEGRATION_IDS.COORDINATES);
      // We also want to zoom to the features that we we're sent
      mapViewModel.zoomToFeatures(features);
      // Then we'll update the state
      setSelectedCoordinates(features);
    },
    [mapViewModel]
  );

  // Handles when we've received estates from a map-click-event
  const handleAddNewEstates = useCallback((estates) => {
    // Since we don't want to allow for duplicate estates we do some really funky shit here...
    // Basically we're creating a set containing the titles of every selected estate (this one
    // wont include duplicates since it's a set). Then we get the corresponding estate by grabbing
    // them from the new array using the title. (It doesn't really matter which one we get since they're duplicates).
    setSelectedEstates((prevEstates) =>
      Array.from(
        new Set([...prevEstates, ...estates].map((e) => e.get("FEATURE_TITLE")))
      ).map((title) =>
        [...prevEstates, ...estates].find(
          (e) => e.get("FEATURE_TITLE") === title
        )
      )
    );
  }, []);

  // Handles when we've received environment features from a map-click-event
  const handleAddNewEnvironmentFeatures = useCallback((payload) => {
    // Since we don't want to allow for duplicate estates we do some really funky shit here...
    // Basically we're creating a set containing the id's of every selected estate (this one
    // wont include duplicates since it's a set). Then we get the corresponding estate by grabbing
    // them from the new array using the id. (It doesn't really matter which one we get since they're duplicates).
    const { typeId, features } = payload;
    setEnvironmentState((prev) => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        selectedFeatures: Array.from(
          new Set(
            [...prev[typeId].selectedFeatures, ...features].map((e) =>
              e.get("FEATURE_TITLE")
            )
          )
        ).map((title) =>
          [...prev[typeId].selectedFeatures, ...features].find(
            (e) => e.get("FEATURE_TITLE") === title
          )
        ),
      },
    }));
  }, []);

  // Handles when a new coordinate has been created in the map
  const handleNewCoordinateCreated = useCallback((feature) => {
    setSelectedCoordinates((prevCoordinates) => [...prevCoordinates, feature]);
  }, []);

  // Handler for when the listener for edit-state-changes has fired
  const handleSetEditState = useCallback(
    (payload) => {
      // If Vision sends operation feedback while the view is not expecting it, we want to ignore it...
      if (
        payload.mode === EDIT_STATUS.SAVE_SUCCESS &&
        editState.mode !== EDIT_STATUS.WAITING
      ) {
        return null;
      }
      setEditState((prev) => ({
        ...prev,
        ...payload,
      }));
    },
    [editState.mode]
  );

  // Handler for when the listener for add-edit-feature has fired
  const handleAddEditFeature = useCallback((feature) => {
    setEditState((prev) => ({
      ...prev,
      features: [...prev.features, feature],
    }));
  }, []);

  // Handler for when the listener for remove-edit-feature has fired
  const handleRemoveEditFeature = useCallback((feature) => {
    setEditState((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== feature),
    }));
  }, []);

  // We're gonna want to subscribe to some events so that we can keep track of hub-status etc.
  useEffect(() => {
    // A Listener for hub-connection failure. Make sure to update connection-state...
    const connectionFailureListener = localObserver.subscribe(
      "hub-initiation-failed",
      () => setHubConnectionStatus(HUB_CONNECTION_STATUS.FAILED)
    );
    // A Listener for hub-connection success. Make sure to update connection-state...
    const connectionSuccessListener = localObserver.subscribe(
      "hub-initiation-success",
      () => setHubConnectionStatus(HUB_CONNECTION_STATUS.SUCCESS)
    );
    // A Listener for when/if the hub connection is disconnected for some reason...
    const hubDisconnectedListener = localObserver.subscribe(
      "hub-disconnected",
      () => setHubConnectionStatus(HUB_CONNECTION_STATUS.FAILED)
    );
    // A listener for when the estate-search failed
    const estateSearchFailedListener = localObserver.subscribe(
      "estate-search-failed",
      () => console.error("Estate search failed...")
    );
    // A listener for when the estate-search was successful
    const estateSearchCompletedListener = localObserver.subscribe(
      "estate-search-completed",
      (features) => handleEstateSearchSuccess(features)
    );
    // A listener for when the environment-feature-search was successful
    const environmentSearchCompletedListener = localObserver.subscribe(
      "environment-search-completed",
      (payload) => handleEnvironmentSearchSuccess(payload)
    );
    // A listener for when we've gotten coordinate-features from Vison
    const coordinatesReceivedFromVisionListener = localObserver.subscribe(
      "coordinates-received-from-vision",
      (features) => handleCoordinatesReceivedFromVision(features)
    );
    // A listener for when we've gotten new estates to add to the selection (from map-click originally)
    const addNewEstatesListener = localObserver.subscribe(
      "add-estates-to-selection",
      (features) => handleAddNewEstates(features)
    );
    // A listener for when we've gotten new estates to add to the selection (from map-click originally)
    const addNewEnvironmentFeaturesListener = localObserver.subscribe(
      "add-environment-features-to-selection",
      (payload) => handleAddNewEnvironmentFeatures(payload)
    );
    // A listener for when a new coordinate has been created by a map-click
    const newCoordinateCreatedListener = localObserver.subscribe(
      "mapView-new-coordinate-created",
      (feature) => handleNewCoordinateCreated(feature)
    );
    // A listener for when the edit state is to be changed from the model
    const updateEditStateListener = localObserver.subscribe(
      "set-edit-state",
      (payload) => handleSetEditState(payload)
    );
    // A listener for when a new edit-feature should be added
    const addEditFeatureListener = localObserver.subscribe(
      "add-edit-feature",
      (feature) => handleAddEditFeature(feature)
    );
    // A listener for when a edit-feature should be removed
    const removeEditFeatureListener = localObserver.subscribe(
      "remove-edit-feature",
      (feature) => handleRemoveEditFeature(feature)
    );
    // Make sure to clean up! remove-edit-feature
    return () => {
      connectionFailureListener.unsubscribe();
      connectionSuccessListener.unsubscribe();
      hubDisconnectedListener.unsubscribe();
      estateSearchFailedListener.unsubscribe();
      estateSearchCompletedListener.unsubscribe();
      environmentSearchCompletedListener.unsubscribe();
      coordinatesReceivedFromVisionListener.unsubscribe();
      addNewEstatesListener.unsubscribe();
      addNewEnvironmentFeaturesListener.unsubscribe();
      newCoordinateCreatedListener.unsubscribe();
      updateEditStateListener.unsubscribe();
      addEditFeatureListener.unsubscribe();
      removeEditFeatureListener.unsubscribe();
    };
  }, [
    localObserver,
    handleEstateSearchSuccess,
    handleEnvironmentSearchSuccess,
    handleCoordinatesReceivedFromVision,
    handleAddNewEstates,
    handleAddNewEnvironmentFeatures,
    handleNewCoordinateCreated,
    handleSetEditState,
    handleAddEditFeature,
    handleRemoveEditFeature,
  ]);

  // We're gonna need an useEffect that can handle side-effects when the selected
  // estates changes. (We're gonna have to update the map etc.).
  useEffect(() => {
    // We're gonna want to show the selected estates in the map. Let's use the map-view-model
    mapViewModel.setEstatesToShow(selectedEstates);
    // Then we'll publish an event if we want to prompt the user etc.
    localObserver.publish("selected-estates-updated", selectedEstates);
  }, [mapViewModel, localObserver, selectedEstates]);

  // We're gonna need an useEffect that can handle side-effect when the selected
  // coordinates changes. (We're gonna want to update the map etc.).
  useEffect(() => {
    // We're gonna want to show the selected estates in the map. Let's use the map-view-model
    mapViewModel.setCoordinatesToShow(selectedCoordinates);
    // Then we'll publish an event if we want to prompt the user etc.
    localObserver.publish("selected-coordinates-updated", selectedCoordinates);
  }, [mapViewModel, localObserver, selectedCoordinates]);

  // We're gonna need an useEffect that can handle side-effect when the
  // edit-features changes. (We're gonna want to update the map etc.).
  useEffect(() => {
    // We're gonna want to show the edit-features in the map. Let's use the map-view-model
    mapViewModel.setEditFeaturesToShow(editState.features);
  }, [mapViewModel, localObserver, editState.features]);

  // We're gonna need an useEffect that can handle side-effects when the environment-state has
  // been updated. Before the environment-state was updated, the active activeEnvironmentType has been set
  // as well. We can use that fact to out advantage, as seen below.
  useEffect(() => {
    // We'll make sure to update the model with the currently active environment-type...
    // We need to keep track of that in the model to allow for proper selections etc. further on.
    model.setCurrentEnvironmentTypeId(activeEnvironmentType);
    // Then we can update thr map-view.
    const updatedEnvironment = environmentState[activeEnvironmentType];
    mapViewModel.setEnvironmentFeaturesToShow(
      updatedEnvironment.selectedFeatures,
      activeEnvironmentType
    );
  }, [model, mapViewModel, environmentState, activeEnvironmentType]);

  // An effect that makes sure to hide/show features depending on which tab we're currently on.
  // (We don't want to show estates when we're on the coordinate tab and so on...)
  // The edit-mode is a special case since its not really a "tab", but rather a view. The thought process is the same though.
  // The effect also makes sure to disable any map-interaction that could be active.
  useEffect(() => {
    const featureTypeToShow =
      editState.mode !== EDIT_STATUS.INACTIVE
        ? INTEGRATION_IDS.EDIT
        : activeTab === INTEGRATION_IDS.ENVIRONMENT
          ? `${activeTab}_${activeEnvironmentType}`
          : activeTab;
    mapViewModel.updateHiddenFeatures(featureTypeToShow);
    model.setEditEnabled(
      editState.mode === EDIT_STATUS.INACTIVE ? false : true
    );
    setActiveMapInteraction(null);
  }, [model, mapViewModel, activeTab, editState.mode, activeEnvironmentType]);

  // An effect making sure to set the chosen map-interaction in the model when state changes...
  useEffect(() => {
    mapViewModel.toggleMapInteraction(activeMapInteraction);
  }, [activeMapInteraction, mapViewModel]);

  // This effect does not run on first render. (Otherwise the user would be
  // prompted with information before they've even started using the plugin).
  // If it's not the first render, the effect makes sure to prompt the user
  // with information when they change the current activity or draw-type.
  useUpdateEffect(() => {
    // Let's check if there's some helper-text that we should prompt the user with.
    const helperText = model.getHelperSnackText(activeMapInteraction);
    // If there is, we can prompt the user with a snack.
    if (helperText) {
      helperSnack.current = enqueueSnackbar(helperText, {
        variant: "default",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });
    }
    // Let's make sure to clean-up out current snack when un-mounting!
    return () => {
      closeSnackbar(helperSnack.current);
    };
  }, [activeMapInteraction, enqueueSnackbar, closeSnackbar]);

  // We're gonna need to catch if the user closes the window, and make sure to
  // update the state so that the effect handling the draw-interaction-toggling fires.
  const onWindowHide = () => {
    setPluginShown(false);
  };

  // We're gonna need to catch if the user opens the window, and make sure to
  // update the state so that the effect handling the draw-interaction-toggling fires.
  const onWindowShow = () => {
    setPluginShown(true);
  };

  return (
    <BaseWindowPlugin
      {...props}
      type="VisionIntegration"
      custom={{
        icon: <RepeatIcon />,
        title: "Vision Integration",
        description: "Kommunicera med EDP Vision.",
        height: "dynamic",
        width: 450,
        onWindowHide: onWindowHide,
        onWindowShow: onWindowShow,
      }}
    >
      <VisionIntegrationView
        app={app}
        model={model}
        localObserver={localObserver}
        mapViewModel={mapViewModel}
        pluginShown={pluginShown}
        configError={configError}
        hubConnectionStatus={hubConnectionStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        editState={editState}
        setEditState={setEditState}
        activeEnvironmentType={activeEnvironmentType}
        setActiveEnvironmentType={setActiveEnvironmentType}
        selectedEstates={selectedEstates}
        setSelectedEstates={setSelectedEstates}
        environmentState={environmentState}
        setEnvironmentState={setEnvironmentState}
        selectedCoordinates={selectedCoordinates}
        setSelectedCoordinates={setSelectedCoordinates}
        activeMapInteraction={activeMapInteraction}
        setActiveMapInteraction={setActiveMapInteraction}
      />
    </BaseWindowPlugin>
  );
}

export default VisionIntegration;
