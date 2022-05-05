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
    highlightedFeatures: [],
  });

  // Resets the state back to init.
  const resetState = React.useCallback(() => {
    setState({
      clickedFeatures: [],
      selectedFeatureIndexes: [],
      highlightedFeatures: [],
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
    // We have to remove all the highlighted features when aborting...
    state.highlightedFeatures.forEach((f) => {
      drawModel.removeFeature(f);
    });
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

  const handleMouseEnter = (index) => {
    const feature = state.clickedFeatures[index];
    const nFeature = model.setHighlightOnFeature(feature);
    setState({
      ...state,
      highlightedFeatures: [...state.highlightedFeatures, nFeature],
    });
  };

  const handleMouseLeave = () => {
    state.highlightedFeatures.forEach((f) => {
      model.disableHighlightOnFeature(f);
    });
  };

  // An effect that handles subscriptions (and un-subscriptions) to the observer-
  // event fired from the drawModel when the user has clicked a feature with the
  // "select feature from map"-tool active. The event will only be fired if there
  // is more than one feature present at the location on which the user clicked.
  // (If there's zero or one, the drawModel will take care of it).
  React.useEffect(() => {
    localObserver.subscribe("drawModel.select.click", handleDrawSelectClick);
    return () => {
      localObserver.unsubscribe("drawModel.select.click");
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
