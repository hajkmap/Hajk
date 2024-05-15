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
} from "@mui/material";

import { IconPolygon, IconPoint, IconLine, IconCircle } from "./MeasurerIcons";
import DeleteIcon from "@mui/icons-material/Delete";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { useEffect, useState } from "react";
import HajkToolTip from "components/HajkToolTip";

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
  const { handleDrawTypeChange, drawType, drawModel } = props;
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const deleteAll = () => {
    setShowDeleteConfirmation(false);
    drawModel.removeDrawnFeatures();
  };

  useEffect(() => {
    props.localObserver.subscribe("show-help", () => {
      setShowHelp(true);
    });
    return () => {
      props.localObserver.unsubscribe("show-help");
    };
  }, [props.localObserver]);

  return (
    <>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={9}>
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
            <HajkToolTip title="Ta bort enskild mätning">
              <StyledToggleButton value="Delete">
                <DeleteIcon />
              </StyledToggleButton>
            </HajkToolTip>
          </StyledToggleButtonGroup>
        </Grid>
        <Grid item xs={3}>
          <HajkToolTip title="Rensa bort alla mätningar">
            <Button
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
    </>
  );
}

export default MeasurerView;
