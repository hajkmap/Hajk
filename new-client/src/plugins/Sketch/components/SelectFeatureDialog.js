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

export default function SelectFeatureDialog({ localObserver, drawModel }) {
  // Let's keep everything in one state here since all properties are
  // changing at the same time (almost).
  const [state, setState] = React.useState({
    clickedFeatures: [],
    selectedFeatureIndexes: [],
  });

  // Resets the state back to init.
  const resetState = React.useCallback(() => {
    setState({ clickedFeatures: [], selectedFeatureIndexes: [] });
  }, []);

  // Handles map-click-event from drawModel and updates the clickedFeatures
  // with the payload.
  const handleDrawSelectClick = React.useCallback((clickedFeatures) => {
    setState((state) => ({ ...state, clickedFeatures }));
  }, []);

  // Handles selection of feature in the dialog-list. Sets the currently
  // selected feature-index. Upon confirmation, the feature with the corresponding
  // index will be added to the map.
  const handleFeatureSelectChange = (index) => {
    setState((state) => ({
      ...state,
      selectedFeatureIndexes: [...state.selectedFeatureIndexes, index],
    }));
  };

  // Handles dialog abort, resets the state so that the dialog can close.
  const handleAbort = () => {
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
            <ListItem disableGutters key={index}>
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
