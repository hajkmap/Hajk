import { styled } from "@mui/material/styles";
import {
  Grid,
  Typography,
  Switch,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import HajkToolTip from "components/HajkToolTip";
import CheckIcon from "@mui/icons-material/Check";
import i18n from "src/i18n";

// Styled AccordionSummary to match FeatureStyleAccordion
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
 * Component for controlling multi-draw mode in AddView.
 * Allows users to draw multiple geometries that are merged into
 * a single Multi-geometry (MultiPoint, MultiLineString, MultiPolygon).
 */
const MultiDrawSelector = (props) => {
  const {
    multiDrawEnabled,
    setMultiDrawEnabled,
    multiDrawPartCount,
    onFinishMultiDraw,
    uiDisabled = false,
  } = props;

  // Handle switch click without triggering accordion toggle
  const handleSwitchClick = (e) => {
    e.stopPropagation();
    setMultiDrawEnabled(!multiDrawEnabled);
  };

  return (
    <Accordion
      expanded={multiDrawEnabled}
      onChange={(e, expanded) => !uiDisabled && setMultiDrawEnabled(expanded)}
      style={{ marginTop: 8 }}
    >
      <HajkToolTip
        title={
          multiDrawEnabled
            ? i18n.t("sketch.multi.finishHint")
            : i18n.t("sketch.multi.startHint")
        }
      >
        <StyledAccordionSummary>
          <Grid
            container
            sx={{ justifyContent: "space-between", alignItems: "center" }}
            size={12}
          >
            <Typography variant="button">
              {i18n.t("sketch.multi.title")}
            </Typography>
            <Switch
              checked={multiDrawEnabled}
              onClick={handleSwitchClick}
              disabled={uiDisabled}
              size="small"
              color="primary"
            />
          </Grid>
        </StyledAccordionSummary>
      </HajkToolTip>
      <AccordionDetails>
        <Grid container>
          <Grid
            container
            sx={{ justifyContent: "space-between", alignItems: "center" }}
            size={12}
          >
            <Typography variant="body2" color="text.secondary">
              {i18n.t("sketch.multi.drawnParts")}
            </Typography>
            <Chip
              label={multiDrawPartCount}
              size="small"
              color={multiDrawPartCount > 0 ? "primary" : "default"}
            />
          </Grid>

          <Grid size={12} style={{ marginTop: 8 }}>
            <HajkToolTip title={i18n.t("sketch.multi.finishAndSave")}>
              <span style={{ display: "block" }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<CheckIcon />}
                  onClick={onFinishMultiDraw}
                  disabled={uiDisabled || multiDrawPartCount === 0}
                >
                  {i18n.t("sketch.finishDrawing")}
                </Button>
              </span>
            </HajkToolTip>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default MultiDrawSelector;
