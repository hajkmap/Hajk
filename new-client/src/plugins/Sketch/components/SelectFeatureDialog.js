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
  const [state, setState] = React.useState({
    clickedFeatures: [],
    selectedFeatureIndex: null,
  });

  const resetState = React.useCallback(() => {
    setState({ clickedFeatures: [], selectedFeatureIndex: null });
  }, []);

  const handleDrawSelectClick = React.useCallback((clickedFeatures) => {
    setState((state) => ({ ...state, clickedFeatures }));
  }, []);

  const handleFeatureSelectChange = (e) => {
    setState((state) => ({ ...state, selectedFeatureIndex: e.target.value }));
  };

  const handleAbort = () => {
    resetState();
  };

  const handleConfirm = () => {
    const feature = clickedFeatures[selectedFeatureIndex];
    drawModel.drawSelectedFeature(feature);
    resetState();
  };

  React.useEffect(() => {
    localObserver.subscribe("drawModel.select.click", handleDrawSelectClick);
    return () => {
      localObserver.unsubscribe("drawModel.select.click");
    };
  }, [localObserver, handleDrawSelectClick]);

  const { clickedFeatures, selectedFeatureIndex } = state;

  return createPortal(
    <Dialog open={clickedFeatures.length > 1} onClose={handleAbort}>
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
