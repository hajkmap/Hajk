// Base
import React, { useState, useEffect, useCallback } from "react";
import Observer from "react-event-observer";

// Icons
import RepeatIcon from "@mui/icons-material/Repeat";

// Views
import BaseWindowPlugin from "../BaseWindowPlugin";
import VisionIntegrationView from "./VisionIntegrationView";

// Models
import MapViewModel from "./models/MapViewModel";
import VisionIntegrationModel from "./models/VisionIntegrationModel";

// Utils
import { getSearchSources } from "./utils";

// Constants
import { HUB_CONNECTION_STATUS, INTEGRATION_IDS } from "./constants";

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
  // We also have to keep track of which map-interaction that is currently active
  const [activeMapInteraction, setActiveMapInteraction] = useState(null);

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
    // Basically we're creating a set containing the id's of every selected estate (this one
    // wont include duplicates since it's a set). Then we get the corresponding estate by grabbing
    // them from the new array using the id. (It doesn't really matter which one we get since they're duplicates).
    setSelectedEstates((prevEstates) =>
      Array.from(
        new Set([...prevEstates, ...estates].map((e) => e.getId()))
      ).map((id) => [...prevEstates, ...estates].find((e) => e.getId() === id))
    );
  }, []);

  // Handles when a new coordinate has been created in the map
  const handleNewCoordinateCreated = useCallback((feature) => {
    setSelectedCoordinates((prevCoordinates) => [...prevCoordinates, feature]);
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
    // A listener for when a new coordinate has been created by a map-click
    const newCoordinateCreatedListener = localObserver.subscribe(
      "mapView-new-coordinate-created",
      (feature) => handleNewCoordinateCreated(feature)
    );
    // Make sure to clean up!
    return () => {
      connectionFailureListener.unSubscribe();
      connectionSuccessListener.unSubscribe();
      hubDisconnectedListener.unSubscribe();
      estateSearchFailedListener.unSubscribe();
      estateSearchCompletedListener.unSubscribe();
      coordinatesReceivedFromVisionListener.unSubscribe();
      addNewEstatesListener.unSubscribe();
      newCoordinateCreatedListener.unSubscribe();
    };
  }, [
    localObserver,
    handleEstateSearchSuccess,
    handleCoordinatesReceivedFromVision,
    handleAddNewEstates,
    handleNewCoordinateCreated,
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

  // An effect that makes sure to hide/show features depending on which tab we're currently on.
  // (We don't want to show estates when we're on the coordinate tab and so on...)
  // If the plugin is hidden, we send an empty string (and no features will be shown).
  // The effect also makes sure to disable any map-interaction that could be active.
  useEffect(() => {
    mapViewModel.updateHiddenFeatures(activeTab);
    setActiveMapInteraction(null);
  }, [mapViewModel, activeTab]);

  // An effect making sure to set the chosen map-interaction in the model when state changes...
  useEffect(() => {
    mapViewModel.toggleMapInteraction(activeMapInteraction);
  }, [activeMapInteraction, mapViewModel]);

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
        width: 400,
        onWindowHide: onWindowHide,
        onWindowShow: onWindowShow,
      }}
    >
      <VisionIntegrationView
        app={app}
        model={model}
        mapViewModel={mapViewModel}
        pluginShown={pluginShown}
        configError={configError}
        hubConnectionStatus={hubConnectionStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedEstates={selectedEstates}
        setSelectedEstates={setSelectedEstates}
        selectedCoordinates={selectedCoordinates}
        setSelectedCoordinates={setSelectedCoordinates}
        activeMapInteraction={activeMapInteraction}
        setActiveMapInteraction={setActiveMapInteraction}
      />
    </BaseWindowPlugin>
  );
}

export default VisionIntegration;
