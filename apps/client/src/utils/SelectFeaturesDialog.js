import React from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

export default function SelectFeaturesDialog({
  localObserver,
  drawModel,
  model,
}) {
  // Let's keep everything in one state here since all properties are
  // changing at the same time (almost).
  const [state, setState] = React.useState({
    clickedFeatures: [],
    selectedFeatureIndexes: [],
    highlightedFeature: null,
  });

  // Resets the state back to init.
  const resetState = React.useCallback(() => {
    setState({
      clickedFeatures: [],
      selectedFeatureIndexes: [],
      highlightedFeature: null,
    });
  }, []);

  // Handles map-click-event from drawModel and updates the clickedFeatures
  // with the payload.
  const handleDrawSelectClick = React.useCallback((clickedFeatures) => {
    setState((state) => ({ ...state, clickedFeatures }));
  }, []);

  // Handles selection of features in the dialog-list. If the feature-index is already
  // selected, we remove it, otherwise we add it to the selection.
  const handleFeatureSelectChange = (featureIndex) => {
    // Create the new selected feature-indexes...
    const newSelectedFeatureIndexes =
      state.selectedFeatureIndexes.indexOf(featureIndex) !== -1
        ? state.selectedFeatureIndexes.filter((i) => i !== featureIndex)
        : [...state.selectedFeatureIndexes, featureIndex];
    // ...and update the state
    setState((state) => ({
      ...state,
      selectedFeatureIndexes: newSelectedFeatureIndexes,
    }));
  };

  // Handles dialog abort, resets the state so that the dialog can close.
  const handleAbort = () => {
    // We have to remove the eventual highlighted feature when aborting...
    state.highlightedFeature &&
      drawModel.removeFeature(state.highlightedFeature);
    // ...and reset the state.
    resetState();
  };

  // Handles confirmation from the dialog. Let's the drawModel add the feature,
  // and then the state is reset so that the dialog is closed.
  const handleConfirm = () => {
    state.selectedFeatureIndexes.map((index) => {
      return drawModel.drawSelectedFeature(state.clickedFeatures[index]);
    });
    resetState();
  };

  // Handler for mouse-enter on list of clicked features. Creates a new
  // feature (which is used to show where the clicked feature is in the map).
  const handleMouseEnter = (index) => {
    // Let's get the clicked feature we're currently hoovering.
    const hoveredFeature = state.clickedFeatures[index];
    // Then we can create a corresponding highlight-feature.
    if (model) {
      const highlightFeature = model.createHighlightFeature(hoveredFeature);
      // We'll add the highlight-feature to the draw-layer...
      drawModel.addFeature(highlightFeature, { silent: true });
      // ...and update the state so that we can keep track of what we are highlighting.
      setState({
        ...state,
        highlightedFeature: highlightFeature,
      });
    }
  };

  // Handler for mouse-leave on the list of clicked features. Removes the currently
  // highlighted feature from the draw-layer.
  const handleMouseLeave = () => {
    state.highlightedFeature &&
      drawModel.removeFeature(state.highlightedFeature);
  };

  // An effect that handles subscriptions (and un-subscriptions) to the observer-
  // event fired from the drawModel when the user has clicked a feature with the
  // "select feature from map"-tool active. The event will only be fired if there
  // is more than one feature present at the location on which the user clicked.
  // (If there's zero or one, the drawModel will take care of it).
  React.useEffect(() => {
    localObserver.subscribe("drawModel.select.click", handleDrawSelectClick);
    localObserver.subscribe(
      "measure.drawModel.select.click",
      handleDrawSelectClick
    );
    return () => {
      localObserver.unsubscribe("drawModel.select.click");
      localObserver.unsubscribe(
        "measure.drawModel.select.click",
        handleDrawSelectClick
      );
    };
  }, [localObserver, handleDrawSelectClick]);

  return createPortal(
    <Dialog
      open={state.clickedFeatures.length > 1}
      onClose={handleAbort}
      // Must stop event-bubbling. Otherwise the parent element in react can be dragged etc.
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <DialogTitle>Välj de objekt du vill kopiera</DialogTitle>
      <DialogContent>
        <List sx={{ width: "100%", maxHeight: "30vh" }}>
          {state.clickedFeatures.map((feature, index) => (
            <ListItem
              disableGutters
              key={index}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
            >
              <ListItemButton
                onClick={() => handleFeatureSelectChange(index)}
                dense
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={state.selectedFeatureIndexes.indexOf(index) !== -1}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText primary={feature.getId()} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button
          disabled={state.selectedFeatureIndexes.length === 0}
          onClick={handleConfirm}
        >
          OK
        </Button>
        <Button onClick={handleAbort}>Avbryt</Button>
      </DialogActions>
    </Dialog>,
    document.getElementById("map")
  );
}
