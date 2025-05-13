import { styled } from "@mui/material/styles";
import {
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Zoom,
} from "@mui/material";

import {
  IconPolygon,
  IconPoint,
  IconLine,
  IconCircle,
  IconSegment,
} from "./MeasurerIcons";
import DeleteIcon from "@mui/icons-material/Delete";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { useEffect, useState } from "react";
import HajkToolTip from "components/HajkToolTip";
import SelectFeaturesDialog from "utils/SelectFeaturesDialog";

const SvgImg = styled("img")(({ theme }) => ({
  height: "24px",
  width: "24px",
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  img: {
    filter: theme.palette.mode === "dark" ? "invert(1)" : "",
  },
  "&.Mui-selected, &.Mui-selected:hover": {
    "img, svg": {
      marginBottom: "-3px",
    },
    borderBottom: `3px solid ${theme.palette.primary.main}`,
  },
}));

const StyledSingleToggleButton = styled(StyledToggleButton)(({ theme }) => ({
  border: "2px solid white",
  borderColor: theme.palette.divider,
  [theme.breakpoints.only("xs")]: {
    marginTop: "2px",
  },
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  border: "2px solid white",
  borderColor: theme.palette.divider,
  overflow: "hidden",
  whiteSpace: "nowrap",
  button: {
    borderTopWidth: 0,
    borderTop: "none",
    borderBottom: "none",
    borderBottomWidth: 0,
  },
  "button:first-of-type": {
    borderLeft: "none",
  },
  "button:last-of-type": {
    borderRight: "none",
  },
}));

function HelpDialog(props) {
  return (
    <Dialog
      open={props.open}
      onClose={() => {
        props.setShowHelp(false);
      }}
    >
      <DialogTitle>{"Hjälp"}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <strong>Avsluta mätning</strong>
          <br />
          Tryck på Esc/Enter-tangenten eller klicka igen på sista punkten för
          att avsluta mätning.
          <br />
          <br />
          <strong>Rita på fri hand</strong>
          <br />
          Håll ner Shift-tangenten för att rita på fri hand. Det här är möjligt
          när du ritar sträckor eller arealer.
          <br />
          <br />
          <strong>Vinkelrät mätning</strong>
          <br />
          Håll ner Ctrl på Windows eller Cmd (⌘) på Mac och klicka på en linje
          så kan du göra vinkelräta mätningar från den linjen. Observera: Linjen
          du klickar på måste vara en vektorlinje som du snäpper mot.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => {
            props.setShowHelp(false);
          }}
          autoFocus
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MeasurerView(props) {
  const {
    handleDrawTypeChange,
    drawType,
    drawModel,
    segmentsEnabled,
    toggleSegmentsEnabled,
  } = props;
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSegmentButton, setShowSegmentButton] = useState(true);

  const deleteAll = () => {
    setShowDeleteConfirmation(false);
    drawModel.removeDrawnFeatures();
  };

  useEffect(() => {
    if (drawType === "LineString" || drawType === "Polygon") {
      setShowSegmentButton(true);
    } else {
      setShowSegmentButton(false);
    }
  }, [drawType]);

  useEffect(() => {
    props.localObserver.subscribe("show-help", () => {
      setShowHelp(true);
    });
    return () => {
      props.localObserver.unsubscribe("show-help");
    };
  }, [props.localObserver]);

  const handleSegmentsToggle = () => {
    toggleSegmentsEnabled(!segmentsEnabled);
  };

  return (
    <>
      <Grid container spacing={1} alignItems="flex-start">
        <Grid item xs={9}>
          <Grid container spacing={0} alignItems="center">
            <Grid item xs={12} md={10}>
              <StyledToggleButtonGroup
                exclusive
                value={drawType}
                onChange={handleDrawTypeChange}
                orientation="horizontal"
                variant="contained"
                aria-label="outlined button group"
              >
                <HajkToolTip title="Punkt (Visar koordinat)">
                  <StyledToggleButton value="Point">
                    <SvgImg src={IconPoint()} />
                  </StyledToggleButton>
                </HajkToolTip>
                <HajkToolTip title="Sträcka">
                  <StyledToggleButton value="LineString">
                    <SvgImg src={IconLine()} />
                  </StyledToggleButton>
                </HajkToolTip>
                <HajkToolTip title="Areal">
                  <StyledToggleButton value="Polygon">
                    <SvgImg src={IconPolygon()} />
                  </StyledToggleButton>
                </HajkToolTip>
                <HajkToolTip title="Cirkel">
                  <StyledToggleButton value="Circle">
                    <SvgImg src={IconCircle()} />
                  </StyledToggleButton>
                </HajkToolTip>
                <HajkToolTip title="Välj på kartan">
                  <StyledToggleButton value="Select">
                    <TouchAppIcon />
                  </StyledToggleButton>
                </HajkToolTip>
                <HajkToolTip title="Ta bort enskild mätning">
                  <StyledToggleButton value="Delete">
                    <DeleteIcon />
                  </StyledToggleButton>
                </HajkToolTip>
              </StyledToggleButtonGroup>
            </Grid>
            <Grid item xs={12} md={2} spacing={2}>
              <HajkToolTip title="Rita del-längder av mätningar">
                <Zoom in={showSegmentButton}>
                  <StyledSingleToggleButton
                    value="Segments"
                    selected={segmentsEnabled}
                    onClick={() => handleSegmentsToggle()}
                  >
                    <SvgImg src={IconSegment()} />
                  </StyledSingleToggleButton>
                </Zoom>
              </HajkToolTip>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={3}>
          <HajkToolTip title="Rensa bort alla mätningar">
            <Button
              sx={{ marginTop: "6px" }}
              variant="contained"
              fullWidth
              onClick={() => {
                setShowDeleteConfirmation(true);
              }}
            >
              Rensa
            </Button>
          </HajkToolTip>
        </Grid>
      </Grid>
      <ConfirmationDialog
        open={showDeleteConfirmation === true}
        titleName={"Rensa"}
        contentDescription={
          "Är du säker på att du vill rensa bort alla mätningar?"
        }
        cancel={"Avbryt"}
        confirm={"Ja rensa"}
        handleConfirm={deleteAll}
        handleAbort={() => {
          setShowDeleteConfirmation(false);
        }}
      />
      <HelpDialog open={showHelp} setShowHelp={setShowHelp} />
      <SelectFeaturesDialog
        localObserver={props.localObserver}
        drawModel={drawModel}
      />
    </>
  );
}

export default MeasurerView;
