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
            <Button variant="contained" fullWidth size="small" disabled={true}>
              Ångra
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              fullWidth
              size="small"
              onClick={() =>
                props.drawModel.translateSelectedFeatures(
                  props.movementLength,
                  props.movementAngle
                )
              }
            >
              Ok
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

const MoveView = (props) => {
  const [movementLength, setMovementLength] = React.useState(100);
  const [movementAngle, setMovementAngle] = React.useState(90);
  // We have to get some information about the current activity (view)
  const activity = props.model.getActivityFromId(props.id);
  return (
    <Grid container>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <TranslateToggler
          translateEnabled={props.translateEnabled}
          setTranslateEnabled={props.setTranslateEnabled}
        />
        {props.moveFeatures.length > 0 && (
          <FeatureMoveSelector
            drawModel={props.drawModel}
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
