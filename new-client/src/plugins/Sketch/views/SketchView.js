// Base
import React from "react";
import { Grid } from "@material-ui/core";
// Constants
import { PLUGIN_MARGIN, MAX_REMOVED_FEATURES } from "../constants";
// Components
import ActivityMenu from "../components/ActivityMenu";
// Views
import AddView from "./AddView";
import SaveUploadView from "./SaveUploadView";
import DeleteView from "./DeleteView";
import MoveView from "./MoveView";
import EditView from "./EditView";
import SettingsView from "./SettingsView";

// The SketchView is the main view for the Sketch-plugin.
const SketchView = (props) => {
  // We want to render the ActivityMenu on the same side as the plugin
  // is rendered (left or right). Let's grab the prop stating where it is rendered!
  const { position: pluginPosition } = props.options ?? "left";
  // We are going to be using the sketch- and draw-model. Let's destruct them.
  const { model, drawModel } = props;
  // We are gonna need the localObserver
  const { localObserver } = props;
  // The current draw-type is also required, along with it's set:er.
  const { activeDrawType, setActiveDrawType } = props;
  // We're gonna need to keep track of the current chosen activity etc.
  const [activityId, setActivityId] = React.useState("ADD");
  const [drawStyle, setDrawStyle] = React.useState({
    strokeColor: { r: 10, g: 10, b: 10, a: 1 },
    fillColor: { r: 60, g: 60, b: 60, a: 0.3 },
    strokeType: "solid",
    strokeWidth: 1,
    textSize: 2,
  });
  // We want to keep track of the last removed features so that the user can restore
  // features that they potentially removed by mistake.
  const [removedFeatures, setRemovedFeatures] = React.useState(
    model.getRemovedFeaturesFromStorage()
  );

  // Handler making sure to keep the removed features updated when a new feature is removed.
  const handleFeatureRemoved = React.useCallback(
    (feature) => {
      // We're gonna need to decorate the removed feature so that we can keep track of it.
      model.decorateFeature(feature);
      // We have to make sure to update the local storage with the newly removed feature so that
      // the removed features are kept between sessions.
      model.addRemovedFeatureToStorage(feature);
      // Then we'll update the state
      setRemovedFeatures([
        feature,
        ...removedFeatures.slice(0, MAX_REMOVED_FEATURES),
      ]);
    },
    [model, removedFeatures]
  );

  // Handler making sure to keep the removed features updated when the user has pressed "removed all features".
  const handleFeaturesRemoved = React.useCallback(
    (features) => {
      // Since we might be dealing with thousands of features removed at the same time, we make sure
      // to grab only the first "MAX_REMOVED_FEATURES" (around 5).
      const lastRemovedFeatures = features.slice(0, MAX_REMOVED_FEATURES);
      // Then we'll loop over these features and decorate them with id:s and dates.
      for (const feature of lastRemovedFeatures) {
        // We're gonna need to decorate the removed feature so that we can keep track of it.
        model.decorateFeature(feature);
        // We have to make sure to update the local storage with the newly removed feature so that
        // the removed features are kept between sessions.
        model.addRemovedFeatureToStorage(feature);
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
    },
    [model, removedFeatures]
  );

  // This effect makes sure that we activate the proper draw-interaction when the draw-type
  // or activity-id changes. (This includes activating the first draw-interaction on first render).
  React.useEffect(() => {
    switch (activityId) {
      case "ADD":
        return drawModel.toggleDrawInteraction(activeDrawType);
      case "DELETE":
        return drawModel.toggleDrawInteraction("Delete");
      default:
        return drawModel.toggleDrawInteraction("");
    }
  }, [activeDrawType, activityId, drawModel]);

  // This effect makes sure to update the draw-style-settings in the draw-model when
  // the user changes the style-settings in the view.
  React.useEffect(() => {
    return drawModel.setDrawStyleSettings(drawStyle);
  }, [drawModel, drawStyle]);

  // This effect makes sure to subscribe (and unsubscribe) to the observer-events that we care about.
  React.useEffect(() => {
    // Fires when a feature has been removed from the draw-source.
    localObserver.subscribe("drawModel.featureRemoved", handleFeatureRemoved);
    localObserver.subscribe("drawModel.featuresRemoved", handleFeaturesRemoved);
    return () => {
      localObserver.unsubscribe("drawModel.featureRemoved");
      localObserver.unsubscribe("drawModel.featuresRemoved");
    };
  }, [localObserver, handleFeatureRemoved, handleFeaturesRemoved]);

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
            drawModel={drawModel}
            activeDrawType={activeDrawType}
            setActiveDrawType={setActiveDrawType}
            drawStyle={drawStyle}
            setDrawStyle={setDrawStyle}
          />
        );
      case "DELETE":
        return (
          <DeleteView
            id={activityId}
            model={model}
            drawModel={drawModel}
            removedFeatures={removedFeatures}
          />
        );
      case "EDIT":
        return <EditView id={activityId} model={model} drawModel={drawModel} />;
      case "MOVE":
        return <MoveView id={activityId} model={model} drawModel={drawModel} />;
      case "SAVE":
        return (
          <SaveUploadView id={activityId} model={model} drawModel={drawModel} />
        );
      case "SETTINGS":
        return (
          <SettingsView id={activityId} model={model} drawModel={drawModel} />
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
      <Grid container justify="flex-end">
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
