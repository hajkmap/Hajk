import React from "react";
import { Button, Grid, Paper, TextField } from "@material-ui/core";
import { Tooltip, Typography, Switch } from "@material-ui/core";
import Information from "../components/Information";

const TranslateToggler = ({ translateEnabled, setTranslateEnabled }) => {
  return (
    <Paper style={{ padding: 8, marginTop: 8 }}>
      <Grid container justify="space-between" alignItems="center">
        <Typography variant="body2">Tillåt fri förflyttning</Typography>
        <Tooltip
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
        </Tooltip>
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
    <Paper style={{ padding: 8, marginTop: 8 }}>
      <Grid container item justify="center" alignItems="center">
        <Grid item xs={12}>
          <Typography variant="body2" align="center">
            Fast förflyttning
          </Typography>
        </Grid>
        <Grid item xs={12} style={{ marginTop: 16 }}>
          <Tooltip title="Ange hur många meter du vill flytta objekten.">
            <TextField
              label="Förflyttningsavstånd (meter)"
              variant="outlined"
              fullWidth
              type="number"
              size="small"
              value={props.movementLength}
              onChange={handleMovementLengthChange}
            />
          </Tooltip>
        </Grid>
        <Grid item xs={12} style={{ marginTop: 16 }}>
          <Tooltip title="Ange i vilken riktning du vill flytta objekten. 0 grader är rakt norrut, 90 grader är rakt åt öster, osv.">
            <TextField
              label="Förflyttningsriktning (grader)"
              variant="outlined"
              fullWidth
              type="number"
              size="small"
              value={props.movementAngle}
              onChange={handleMovementAngleChange}
            />
          </Tooltip>
        </Grid>
        <Grid container spacing={1} style={{ marginTop: 8 }}>
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

const MoveView = (props) => {
  // We're gonna need to keep track of the movement length and angle
  const [movementLength, setMovementLength] = React.useState(100);
  const [movementAngle, setMovementAngle] = React.useState(90);
  // We also need to keep track of the last moves that has been done. These
  // can be used so that the user can disregard moves if they happened to move
  // something in the wrong direction.
  const [lastMoves, setLastMoves] = React.useState([]);
  // Let's destruct some props
  const { drawModel, moveFeatures, translateEnabled, setTranslateEnabled } =
    props;

  // Let's use an effect that can reset the last moves when the current
  // feature/features selected for movement changes.
  React.useEffect(() => {
    setLastMoves([]);
  }, [moveFeatures]);

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
          <FeatureMoveSelector
            drawModel={drawModel}
            lastMoves={lastMoves}
            setLastMoves={setLastMoves}
            movementLength={movementLength}
            setMovementLength={setMovementLength}
            movementAngle={movementAngle}
            setMovementAngle={setMovementAngle}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default MoveView;
