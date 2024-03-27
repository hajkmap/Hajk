import React from "react";
import { Button, Grid, Slider, Tooltip } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PauseIcon from "@mui/icons-material/Pause";
import RotateLeftOutlinedIcon from "@mui/icons-material/RotateLeftOutlined";
import SettingsButton from "./components/SettingsButton";

export default function PlayerView(props) {
  // Handles when the user wants to step one step forwards.
  // Sets the current time to the current time plus one step size
  // If we've reached the end, we start from the beginning...
  const stepOnesForward = () => {
    let nextUnixTime = props.currentUnixTime + props.stepSize;
    if (nextUnixTime >= props.endTime) {
      nextUnixTime = props.startTime;
    }
    props.handleSliderChange(nextUnixTime);
  };

  // Handles when the user wants to step one step backwards.
  // Sets the current time to the current time minus one step size
  // If we've reached the start, we "jump" to the end...
  const stepOnesBackward = () => {
    let nextUnixTime = props.currentUnixTime - props.stepSize;
    if (nextUnixTime <= props.startTime) {
      nextUnixTime = props.endTime;
    }
    props.handleSliderChange(nextUnixTime);
  };

  return props.currentUnixTime ? (
    <Grid container sx={{ padding: 2 }}>
      <Grid
        item
        xs={12}
        sx={{
          paddingLeft:
            props.markResolution === "years"
              ? 2
              : props.markResolution === "months"
                ? 4
                : 6,
          paddingRight:
            props.markResolution === "years"
              ? 2
              : props.markResolution === "months"
                ? 4
                : 6,
        }}
      >
        <Slider
          size="small"
          value={props.currentUnixTime}
          min={props.startTime}
          max={props.endTime}
          step={props.stepSize}
          marks={props.marks}
          onChange={(e, value) => {
            if (value !== props.currentUnixTime) {
              props.handleSliderChange(value);
            }
          }}
        />
      </Grid>
      <Grid
        container
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={2}
      >
        <Grid item align="center" xs={2}>
          <Tooltip disableInteractive title="Återställ tidslinjen">
            <Button variant="contained" onClick={props.resetTimeSlider}>
              <RotateLeftOutlinedIcon />
            </Button>
          </Tooltip>
        </Grid>
        <Grid item align="center" xs={2}>
          <Tooltip
            disableInteractive
            title={
              props.playing
                ? "Du kan inte hoppa bakåt när spelaren är aktiv."
                : "Hoppa ett steg bakåt"
            }
          >
            <span>
              <Button
                variant="contained"
                onClick={() => {
                  stepOnesBackward();
                }}
                disabled={props.playing}
              >
                <ArrowBackIcon />
              </Button>
            </span>
          </Tooltip>
        </Grid>
        <Grid item align="center" xs={2}>
          <Tooltip
            disableInteractive
            title={props.playing ? "Stoppa tidslinjen" : "Starta tidslinjen"}
          >
            <Button
              variant="contained"
              onClick={() => {
                props.toggleSlider(!props.playing);
              }}
            >
              {props.playing ? <PauseIcon /> : <PlayArrowIcon />}
            </Button>
          </Tooltip>
        </Grid>
        <Grid item align="center" xs={2}>
          <Tooltip
            disableInteractive
            title={
              props.playing
                ? "Du kan inte hoppa framåt när spelaren är aktiv."
                : "Hoppa ett steg framåt"
            }
          >
            <span>
              <Button
                variant="contained"
                onClick={() => {
                  stepOnesForward();
                }}
                disabled={props.playing}
              >
                <ArrowForwardIcon />
              </Button>
            </span>
          </Tooltip>
        </Grid>
        <Grid item align="center" xs={2}>
          <SettingsButton
            layerStatus={props.layerStatus}
            open={props.settingsDialog}
            setOpen={props.setSettingsDialog}
          />
        </Grid>
      </Grid>
    </Grid>
  ) : (
    <Grid
      container
      alignItems="center"
      justifyContent="center"
      sx={{ width: "100%", height: "100%" }}
    >
      <Grid item>
        <SettingsButton
          layerStatus={props.layerStatus}
          open={props.settingsDialog}
          setOpen={props.setSettingsDialog}
        />
      </Grid>
    </Grid>
  );
}
