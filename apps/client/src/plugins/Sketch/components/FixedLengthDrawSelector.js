import React from "react";
import {
  Grid,
  Paper,
  TextField,
  Typography,
  Switch,
  Button,
} from "@mui/material";
import HajkToolTip from "components/HajkToolTip";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";

/**
 * Component for controlling fixed-length drawing mode in AddView
 * Similar to FeatureMoveSelector from MoveView, but for creating new features
 * with fixed segment length and direction.
 */
const FixedLengthDrawSelector = (props) => {
  // Local state for editing - allows empty strings during input
  const [lengthInput, setLengthInput] = React.useState(
    String(props.fixedLength)
  );
  const [angleInput, setAngleInput] = React.useState(String(props.fixedAngle));

  // Sync local state with props when they change externally
  React.useEffect(() => {
    setLengthInput(String(props.fixedLength));
  }, [props.fixedLength]);

  React.useEffect(() => {
    setAngleInput(String(props.fixedAngle));
  }, [props.fixedAngle]);

  // Handles change on the fixed-length input. Validates and constrains to 0.1-100000m
  const handleFixedLengthChange = (e) => {
    const inputValue = e.target.value;
    setLengthInput(inputValue); // Update local state immediately

    // Only propagate valid values to parent
    if (inputValue === "") {
      return; // Don't update parent while editing
    }

    const value = parseFloat(inputValue);
    if (!isNaN(value)) {
      const constrainedLength =
        value < 0.1 ? 0.1 : value > 100000 ? 100000 : value;
      props.setFixedLength(constrainedLength);
    }
  };

  // Handles change on the fixed-angle input. Normalizes to 0-360 degrees
  const handleFixedAngleChange = (e) => {
    const inputValue = e.target.value;
    setAngleInput(inputValue); // Update local state immediately

    // Only propagate valid values to parent
    if (inputValue === "") {
      return; // Don't update parent while editing
    }

    const value = parseFloat(inputValue);
    if (!isNaN(value)) {
      const normalizedAngle = ((value % 360) + 360) % 360;
      props.setFixedAngle(normalizedAngle);
    }
  };

  return (
    <Paper sx={{ p: 1, mt: 1 }}>
      <Grid container justifyContent="center" alignItems="center">
        {/* Toggle switch for enabling/disabling fixed length mode */}
        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Grid item>
            <Typography variant="body2">Fast längd och riktning</Typography>
          </Grid>
          <Grid item>
            <HajkToolTip
              title={
                props.fixedLengthEnabled
                  ? "Avaktivera för att rita fritt med musen"
                  : "Aktivera för att rita segment med fast längd och riktning"
              }
            >
              <Switch
                checked={props.fixedLengthEnabled}
                onChange={() =>
                  props.setFixedLengthEnabled(!props.fixedLengthEnabled)
                }
                disabled={props.uiDisabled}
                size="small"
                color="primary"
              />
            </HajkToolTip>
          </Grid>
        </Grid>

        {/* Input fields - always shown but disabled when fixed length mode is off */}
        <>
          {/* Length input */}
          <Grid sx={{ mb: 2 }} size={12}>
            <HajkToolTip title="Ange längden för varje segment i meter (0.1 - 100000m)">
              <TextField
                label="Segmentlängd (meter)"
                variant="outlined"
                fullWidth
                type="number"
                size="small"
                value={lengthInput}
                onChange={handleFixedLengthChange}
                disabled={props.uiDisabled || !props.fixedLengthEnabled}
                inputProps={{
                  min: 0.1,
                  max: 100000,
                  step: 0.1,
                }}
              />
            </HajkToolTip>
          </Grid>

          {/* Angle input */}
          <Grid size={12}>
            <HajkToolTip title="Ange riktningen i grader. 0° är norr, 90° är öst, 180° är syd, 270° är väst">
              <TextField
                label="Riktning (grader)"
                variant="outlined"
                fullWidth
                type="number"
                size="small"
                value={angleInput}
                onChange={handleFixedAngleChange}
                disabled={props.uiDisabled || !props.fixedLengthEnabled}
                inputProps={{
                  min: 0,
                  max: 360,
                  step: 1,
                }}
              />
            </HajkToolTip>
          </Grid>

          {/* Action buttons */}
          <Grid container spacing={1} sx={{ mt: 2 }} size={12}>
            <Grid size={12}>
              <HajkToolTip title="Klicka först i kartan för att sätta startpunkt, sedan klicka här för att lägga till varje segment">
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={props.onAddSegment}
                  disabled={
                    props.uiDisabled ||
                    !props.drawingActive ||
                    !props.fixedLengthEnabled
                  }
                >
                  Lägg till segment
                </Button>
              </HajkToolTip>
            </Grid>
            <Grid size={12}>
              <HajkToolTip title="Avsluta ritningen">
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  startIcon={<CheckIcon />}
                  onClick={props.onFinishDrawing}
                  disabled={
                    props.uiDisabled ||
                    !props.drawingActive ||
                    !props.fixedLengthEnabled
                  }
                >
                  Avsluta ritning
                </Button>
              </HajkToolTip>
            </Grid>
          </Grid>
        </>
      </Grid>
    </Paper>
  );
};

export default FixedLengthDrawSelector;
