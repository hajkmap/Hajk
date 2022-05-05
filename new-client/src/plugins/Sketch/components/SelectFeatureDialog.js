import React from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";

export default function SelectFeatureDialog({ localObserver, drawModel }) {
  // Let's keep everything in one state here since all properties are
  // changing at the same time (almost).
  const [state, setState] = React.useState({
    clickedFeatures: [],
    selectedFeatureIndex: null,
  });

  // Resets the state back to init.
  const resetState = React.useCallback(() => {
    setState({ clickedFeatures: [], selectedFeatureIndex: null });
  }, []);

  // Handles map-click-event from drawModel and updates the clickedFeatures
  // with the payload.
  const handleDrawSelectClick = React.useCallback((clickedFeatures) => {
    setState((state) => ({ ...state, clickedFeatures }));
  }, []);

  // Handles selection of feature in the dialog-list. Sets the currently
  // selected feature-index. Upon confirmation, the feature with the corresponding
  // index will be added to the map.
  const handleFeatureSelectChange = (e) => {
    setState((state) => ({ ...state, selectedFeatureIndex: e.target.value }));
  };

  // Handles dialog abort, resets the state so that the dialog can close.
  const handleAbort = () => {
    resetState();
  };

  // Handles confirmation from the dialog. Let's the drawModel add the feature,
  // and then the state is reset so that the dialog is closed.
  const handleConfirm = () => {
    drawModel.drawSelectedFeature(clickedFeatures[selectedFeatureIndex]);
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

  const { clickedFeatures, selectedFeatureIndex } = state;

  return createPortal(
    <Dialog
      open={clickedFeatures.length > 1}
      onClose={handleAbort}
      // Must stop event-bubbling. Otherwise the parent element in react can be dragged etc.
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <DialogTitle>Välj vilket objekt du vill kopiera</DialogTitle>
      <DialogContent>
        <RadioGroup
          aria-label="ringtone"
          name="ringtone"
          value={selectedFeatureIndex}
          onChange={handleFeatureSelectChange}
        >
          {clickedFeatures.map((feature, index) => (
            <FormControlLabel
              value={index}
              key={feature.getId()}
              control={<Radio />}
              label={feature.getId()}
            />
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button
          disabled={selectedFeatureIndex === null}
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
