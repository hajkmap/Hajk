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
import i18n from "src/i18n";

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

  // Sync local state with props when they change externally. Numerically
  // tolerant: while the field holds a representation of the same value
  // (e.g. "0.50" vs 0.5) the user's text is left alone — overwriting on
  // every echo made it impossible to type values like "0.5" at all.
  React.useEffect(() => {
    setLengthInput((cur) =>
      parseFloat(cur) === props.fixedLength ? cur : String(props.fixedLength)
    );
  }, [props.fixedLength]);

  React.useEffect(() => {
    setAngleInput((cur) =>
      parseFloat(cur) === props.fixedAngle ? cur : String(props.fixedAngle)
    );
  }, [props.fixedAngle]);

  // While typing: propagate only values that are already valid, UNCHANGED —
  // clamping/normalizing happens at blur. Clamping on every keystroke made
  // the field fight the user ("0" bounced back as "0.1", "-4" as "356").
  const handleFixedLengthChange = (e) => {
    const inputValue = e.target.value;
    setLengthInput(inputValue); // Update local state immediately

    const value = parseFloat(inputValue);
    if (!isNaN(value) && value >= 0.1 && value <= 100000) {
      props.setFixedLength(value);
    }
  };

  const handleFixedAngleChange = (e) => {
    const inputValue = e.target.value;
    setAngleInput(inputValue); // Update local state immediately

    const value = parseFloat(inputValue);
    if (!isNaN(value) && value >= 0 && value < 360) {
      props.setFixedAngle(value);
    }
  };

  // At blur: constrain/normalize and commit — or restore the last valid
  // value when the field doesn't parse.
  const commitFixedLength = () => {
    const value = parseFloat(lengthInput);
    if (isNaN(value)) {
      setLengthInput(String(props.fixedLength));
      return;
    }
    const constrained = value < 0.1 ? 0.1 : value > 100000 ? 100000 : value;
    props.setFixedLength(constrained);
    setLengthInput(String(constrained));
  };

  const commitFixedAngle = () => {
    const value = parseFloat(angleInput);
    if (isNaN(value)) {
      setAngleInput(String(props.fixedAngle));
      return;
    }
    const normalized = ((value % 360) + 360) % 360;
    props.setFixedAngle(normalized);
    setAngleInput(String(normalized));
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
            ? i18n.t("sketch.fixed.disableHint")
            : i18n.t("sketch.fixed.enableHint")
        }
      >
        <StyledAccordionSummary>
          <Grid
            container
            sx={{ justifyContent: "space-between", alignItems: "center" }}
            size={12}
          >
            <Typography variant="button">
              {i18n.t("sketch.fixed.drawManually")}
            </Typography>
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
            <HajkToolTip title={i18n.t("sketch.fixed.lengthHint")}>
              <TextField
                label={i18n.t("sketch.fixed.length")}
                variant="outlined"
                fullWidth
                type="number"
                size="small"
                value={lengthInput}
                onChange={handleFixedLengthChange}
                onBlur={commitFixedLength}
                disabled={props.uiDisabled}
                slotProps={{
                  htmlInput: {
                    min: 0.1,
                    max: 100000,
                    step: 0.1,
                  },
                }}
              />
            </HajkToolTip>
          </Grid>

          {/* Angle input */}
          <Grid size={12}>
            <HajkToolTip title={i18n.t("sketch.fixed.directionHint")}>
              <TextField
                label={i18n.t("sketch.fixed.direction")}
                variant="outlined"
                fullWidth
                type="number"
                size="small"
                value={angleInput}
                onChange={handleFixedAngleChange}
                onBlur={commitFixedAngle}
                disabled={props.uiDisabled}
                slotProps={{
                  htmlInput: {
                    min: 0,
                    max: 360,
                    step: 1,
                  },
                }}
              />
            </HajkToolTip>
          </Grid>

          {/* Action buttons */}
          <Grid container spacing={1} sx={{ mt: 2 }} size={12}>
            <Grid size={12}>
              <HajkToolTip title={i18n.t("sketch.fixed.addSegmentHint")}>
                <span style={{ display: "block" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={props.onAddSegment}
                    disabled={props.uiDisabled || !props.drawingActive}
                  >
                    {i18n.t("sketch.fixed.addSegment")}
                  </Button>
                </span>
              </HajkToolTip>
            </Grid>
            <Grid size={12}>
              <HajkToolTip title={i18n.t("sketch.fixed.finishDrawingHint")}>
                <span style={{ display: "block" }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<CheckIcon />}
                    onClick={props.onFinishDrawing}
                    disabled={props.uiDisabled || !props.drawingActive}
                  >
                    {i18n.t("sketch.finishDrawing")}
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
