import React from "react";
import { styled } from "@mui/material/styles";
import {
  Grid,
  TextField,
  Typography,
  Switch,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import HajkToolTip from "components/HajkToolTip";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";

// Styled AccordionSummary to match other accordions in Sketch
const StyledAccordionSummary = styled(AccordionSummary)(() => ({
  minHeight: 35,
  "&.MuiAccordionSummary-root.Mui-expanded": {
    minHeight: 35,
  },
  "& .MuiAccordionSummary-content": {
    transition: "inherit !important",
    marginTop: 0,
    marginBottom: 0,
    "&.Mui-expanded": {
      marginTop: 0,
      marginBottom: 0,
    },
  },
}));

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

  // Handle switch click without triggering accordion toggle
  const handleSwitchClick = (e) => {
    e.stopPropagation();
    props.setFixedLengthEnabled(!props.fixedLengthEnabled);
  };

  return (
    <Accordion
      expanded={props.fixedLengthEnabled}
      onChange={(e, expanded) => props.setFixedLengthEnabled(expanded)}
      style={{ marginTop: 8 }}
    >
      <HajkToolTip
        title={
          props.fixedLengthEnabled
            ? "Klicka för att avaktivera fast längd och riktning"
            : "Klicka för att rita segment med fast längd och riktning"
        }
      >
        <StyledAccordionSummary>
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            size={12}
          >
            <Typography variant="button">Rita manuellt</Typography>
            <Switch
              checked={props.fixedLengthEnabled}
              onClick={handleSwitchClick}
              disabled={props.uiDisabled}
              size="small"
              color="primary"
            />
          </Grid>
        </StyledAccordionSummary>
      </HajkToolTip>
      <AccordionDetails>
        <Grid container>
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
                disabled={props.uiDisabled}
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
                disabled={props.uiDisabled}
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
                <span style={{ display: "block" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={props.onAddSegment}
                    disabled={props.uiDisabled || !props.drawingActive}
                  >
                    Lägg till segment
                  </Button>
                </span>
              </HajkToolTip>
            </Grid>
            <Grid size={12}>
              <HajkToolTip title="Avsluta ritningen">
                <span style={{ display: "block" }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<CheckIcon />}
                    onClick={props.onFinishDrawing}
                    disabled={props.uiDisabled || !props.drawingActive}
                  >
                    Avsluta ritning
                  </Button>
                </span>
              </HajkToolTip>
            </Grid>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default FixedLengthDrawSelector;
