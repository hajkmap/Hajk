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
import ConfirmationDialog from "components/ConfirmationDialog";
import { useEffect, useState } from "react";

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
          För att avsluta en mätning, klicka igen på sista punkten eller tryck
          på Esc/Enter-tangenten.
          <br />
          <br />
          Vid ritning av sträckor och arealer är det möjligt att hålla ner
          Shift-tangenten för att rita på fri hand.
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
            <StyledToggleButton value="Point" title="Punkt">
              <SvgImg src={IconPoint()} />
            </StyledToggleButton>
            <StyledToggleButton value="LineString" title="Sträcka">
              <SvgImg src={IconLine()} />
            </StyledToggleButton>
            <StyledToggleButton value="Polygon" title="Areal">
              <SvgImg src={IconPolygon()} />
            </StyledToggleButton>
            <StyledToggleButton value="Circle" title="Cirkel">
              <SvgImg src={IconCircle()} />
            </StyledToggleButton>
            <StyledToggleButton value="Delete" title="Ta bort enskild mätning">
              <DeleteIcon />
            </StyledToggleButton>
          </StyledToggleButtonGroup>
        </Grid>
        <Grid item xs={3}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setShowDeleteConfirmation(true);
            }}
            title="Rensa bort alla mätningar"
          >
            Rensa
          </Button>
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
