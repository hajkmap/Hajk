import React from "react";
import {
  Button,
  Grid,
  InputAdornment,
  Paper,
  TextField,
  OutlinedInput,
  Typography,
  Switch,
} from "@mui/material";
import HajkToolTip from "components/HajkToolTip";

import RotateRightIcon from "@mui/icons-material/RotateRight";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import Information from "../components/Information";
import { ROTATABLE_DRAW_TYPES } from "plugins/Sketch/constants";

const TranslateToggler = ({ translateEnabled, setTranslateEnabled }) => {
  return (
    <Paper sx={{ p: 1, mt: 1 }}>
      <Grid container justifyContent="space-between" alignItems="center">
        <Typography variant="body2">Tillåt fri förflyttning</Typography>
        <HajkToolTip
          title={
            translateEnabled
              ? "Avaktivera för att inte tillåta förflyttning av objekten i kartan."
              : "Aktivera för att tillåta förflyttning av objekten i kartan."
          }
        >
          <Switch
            checked={translateEnabled}
            onChange={() => setTranslateEnabled(!translateEnabled)}
            size="small"
            color="primary"
          />
        </HajkToolTip>
      </Grid>
    </Paper>
  );
};

const FeatureMoveSelector = (props) => {
  // Handles change on the movement-length input. Makes sure that we're
  // dealing with integers and updates the state.
  const handleMovementLengthChange = (e) => {
    const length = Math.floor(e.target.value);
    props.setMovementLength(length);
  };

  // Handles change on the movement-angle input. Makes sure the angle is
  // always between 0 and 360 and updates the state.
  const handleMovementAngleChange = (e) => {
    const angle = Math.floor(e.target.value);
    const justifiedAngle =
      angle >= 360 ? angle - 360 : angle < 0 ? 360 + angle : angle;
    props.setMovementAngle(justifiedAngle);
  };

  // Handles user click on move-feature. Makes sure to trigger the move
  // action and push the move-information onto the last-move-array so that
  // the user can "remove" that action if it turned out wrong.
  const handleMoveClick = () => {
    // Let's get the values
    const length = props.movementLength;
    const angle = props.movementAngle;
    // Then we trigger the action in the draw-model
    props.drawModel.translateSelectedFeatures(
      props.movementLength,
      props.movementAngle
    );
    // Then we'll update the last-moves-state.
    props.setLastMoves([...props.lastMoves, { length, angle }]);
  };

  // Handles user click on undo. Gets the last move from the move-state
  // and triggers a move in the opposite direction. Also removes that move
  // from the state.
  const handleUndoClick = () => {
    const moves = [...props.lastMoves];
    const { length, angle } = moves.pop();
    props.drawModel.translateSelectedFeatures(length, angle - 180);
    props.setLastMoves(moves);
  };

  return (
    <Paper sx={{ p: 1, mt: 1 }}>
      <Grid container item justifyContent="center" alignItems="center">
        <Grid item xs={12} sx={{ mb: 2 }}>
          <Typography variant="body2" align="center">
            Fast förflyttning
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ mb: 2 }}>
          <HajkToolTip title="Ange hur många meter du vill flytta objekten.">
            <TextField
              label="Förflyttningsavstånd (meter)"
              variant="outlined"
              fullWidth
              type="number"
              size="small"
              value={props.movementLength}
              onChange={handleMovementLengthChange}
            />
          </HajkToolTip>
        </Grid>
        <Grid item xs={12}>
          <HajkToolTip title="Ange i vilken riktning du vill flytta objekten. 0 grader är rakt norrut, 90 grader är rakt åt öster, osv.">
            <TextField
              label="Förflyttningsriktning (grader)"
              variant="outlined"
              fullWidth
              type="number"
              size="small"
              value={props.movementAngle}
              onChange={handleMovementAngleChange}
            />
          </HajkToolTip>
        </Grid>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Button
              variant="contained"
              fullWidth
              size="small"
              onClick={handleUndoClick}
              disabled={props.lastMoves.length === 0}
            >
              Ångra
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              fullWidth
              size="small"
              onClick={handleMoveClick}
            >
              Flytta
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Handles the Rotation functionality
const FeatureRotateSelector = (props) => {
  let rotationTimeout = 0;

  // Force input to 0-360 degrees.
  const handleRotationChange = (e) => {
    let degrees = Math.floor(e.target.value);
    degrees = degrees < 1 ? 1 : degrees > 360 ? 360 : degrees;
    props.setRotationDegrees(degrees);
  };

  // Handle both single click rotation and continuous rotation
  const handleRotationClick = (clockwise = true, continuous = false) => {
    props.drawModel.rotateSelectedFeatures(props.rotationDegrees, clockwise);
    if (continuous) {
      rotationTimeout = setTimeout(() => {
        handleRotationClick(clockwise, true);
      }, 60);
    } else {
      handleMouseUp();
    }
  };

  // If you keep the mouse down for a while, continuous rotation begins.
  const handleMouseDown = (clockwise) => {
    // Add window event to handle mouseUp outside the button.
    window.addEventListener("mouseup", handleMouseUp);

    // Trigger continuous rotation
    rotationTimeout = setTimeout(() => {
      handleRotationClick(clockwise, true);
    }, 800);
  };

  // Make sure continuous rotation is stopped and remove the added window event.
  const handleMouseUp = () => {
    clearTimeout(rotationTimeout);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <Paper
      sx={{
        p: 1,
        mt: 1,
        opacity: props.disabled ? 0.3 : 1.0,
        pointerEvents: props.disabled ? "none" : "auto",
      }}
    >
      <Grid container item justifyContent="center" alignItems="center">
        <Grid item xs={12} sx={{ mb: 1 }}>
          <Typography variant="body2" align="center">
            Rotera
          </Typography>
        </Grid>

        <Grid item xs={6} sx={{ pr: 1 }}>
          <HajkToolTip title="Ange hur många grader du ska rotera objekten.">
            <OutlinedInput
              variant="outlined"
              fullWidth
              type="number"
              size="small"
              endAdornment={<InputAdornment position="end">°</InputAdornment>}
              value={props.rotationDegrees}
              onChange={handleRotationChange}
            />
          </HajkToolTip>
        </Grid>
        <Grid item xs={3} sx={{ pr: 1 / 4 }}>
          <Button
            disabled={props.disabled}
            variant="contained"
            fullWidth
            size="small"
            sx={{ minWidth: "initial" }}
            onClick={() => {
              handleRotationClick(false);
            }}
            onMouseDown={() => {
              handleMouseDown(false);
            }}
          >
            <RotateLeftIcon />
          </Button>
        </Grid>
        <Grid item xs={3} sx={{ pl: 1 / 4 }}>
          <Button
            disabled={props.disabled}
            variant="contained"
            fullWidth
            size="small"
            sx={{ minWidth: "initial" }}
            onClick={() => {
              handleRotationClick(true);
            }}
            onMouseDown={() => {
              handleMouseDown(true);
            }}
          >
            <RotateRightIcon />
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

const MoveView = (props) => {
  // We're gonna need to keep track of the movement length and angle
  const [movementLength, setMovementLength] = React.useState(100);
  const [movementAngle, setMovementAngle] = React.useState(90);
  // We also need to keep track of the last moves that has been done. These
  // can be used so that the user can disregard moves if they happened to move
  // something in the wrong direction.
  const [lastMoves, setLastMoves] = React.useState([]);

  // Keep track of degrees for rotation tool.
  const [rotationDegrees, setRotationDegrees] = React.useState(15);
  // Let's destruct some props
  const { drawModel, moveFeatures, translateEnabled, setTranslateEnabled } =
    props;

  // Let's use an effect that can reset the last moves when the current
  // feature/features selected for movement changes.
  React.useEffect(() => {
    setLastMoves([]);
  }, [moveFeatures]);

  const rotationIsDisabled = () => {
    // Rotation is only allowed for specific draw methods.

    let drawMethod = moveFeatures[0].get("DRAW_METHOD");

    if (drawMethod) {
      return ROTATABLE_DRAW_TYPES.indexOf(drawMethod) === -1;
    }

    return false;
  };

  // We have to get some information about the current activity (view)
  const activity = props.model.getActivityFromId(props.id);
  return (
    <Grid container>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <TranslateToggler
          translateEnabled={translateEnabled}
          setTranslateEnabled={setTranslateEnabled}
        />
        {moveFeatures.length > 0 && (
          <>
            <FeatureMoveSelector
              drawModel={drawModel}
              lastMoves={lastMoves}
              setLastMoves={setLastMoves}
              movementLength={movementLength}
              setMovementLength={setMovementLength}
              movementAngle={movementAngle}
              setMovementAngle={setMovementAngle}
            />
            <FeatureRotateSelector
              disabled={rotationIsDisabled()}
              drawModel={drawModel}
              rotationDegrees={rotationDegrees}
              setRotationDegrees={setRotationDegrees}
            />
          </>
        )}
      </Grid>
    </Grid>
  );
};

export default MoveView;
