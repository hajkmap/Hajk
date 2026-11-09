import React from "react";
import Button from "@mui/material/Button";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  ButtonGroup,
} from "@mui/material";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import SettingsBackupRestoreIcon from "@mui/icons-material/SettingsBackupRestore";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";

import withSnackbar from "components/WithSnackbar";
import i18n from "src/i18n";

class RoutingView extends React.PureComponent {
  state = {
    activeStep: 0,
    startMode: undefined,
    endSelectionInProgress: false,
    travelMode: undefined,
  };
  selectStartSnackbar = undefined;
  selectEndSnackbar = undefined;

  constructor(props) {
    super();

    // Used to select the correct step in our Stepper.
    // Also used to close Snackbars when a given stop has completed.
    props.localObserver.subscribe("doneWithStep", (step) => {
      switch (step) {
        // Start selection completed. Close snackbar and let user select destination.
        case 1:
          this.selectStartSnackbar &&
            props.closeSnackbar(this.selectStartSnackbar);
          this.handleClickOnEndSelection();
          break;

        // Destination selection completed. Close snackbar and let user pick transport mode.
        case 2:
          this.selectEndSnackbar && props.closeSnackbar(this.selectEndSnackbar);
          this.setState({ endSelectionInProgress: false });
          break;
        // Transport mode completed. Let's search route!
        case 3:
          props.model.activateRoutingMode();
          break;

        default:
          break;
      }

      this.setState({ activeStep: step });
    });

    props.localObserver.subscribe("startModeSelected", (mode) => {
      this.setState({ startMode: mode });
    });

    props.localObserver.subscribe("startStopPointsMissing", () => {
      this.props.enqueueSnackbar(i18n.t("routing.errors.pointsMissing"), {
        variant: "error",
      });
    });

    props.localObserver.subscribe("requestDenied", () => {
      this.props.enqueueSnackbar(i18n.t("routing.errors.requestDenied"), {
        variant: "error",
      });
    });

    props.localObserver.subscribe("routingGoogleMapsApiLoadFailed", () => {
      this.props.enqueueSnackbar(i18n.t("routing.errors.loadFailed"), {
        variant: "error",
      });
    });

    props.localObserver.subscribe("zeroResults", () => {
      this.props.enqueueSnackbar(i18n.t("routing.errors.zeroResults"), {
        variant: "warning",
      });
    });

    props.localObserver.subscribe("otherError", (status) => {
      console.error(status);
      this.props.enqueueSnackbar(i18n.t("routing.errors.other"), {
        variant: "warning",
      });
    });
  }

  handleTravelModeChange = (e, travelMode) => {
    this.setState({ travelMode });
    this.props.model.setTravelMode(travelMode);
  };

  handleClickOnStartMode = (e, startMode) => {
    this.setState({ startMode: undefined });
    switch (startMode) {
      case "gps":
        this.props.model.getLocation();
        break;

      case "manual":
        this.selectStartSnackbar = this.props.enqueueSnackbar(
          i18n.t("routing.clickToSelectStart"),
          { variant: "info", persist: true }
        );
        this.props.model.activateStartMode();
        break;

      default:
        break;
    }
  };

  handleClickOnEndSelection = () => {
    if (this.state.endSelectionInProgress !== true) {
      this.setState({ endSelectionInProgress: true }, (_e) => {
        this.selectEndSnackbar = this.props.enqueueSnackbar(
          i18n.t("routing.clickToSelectEnd"),
          { variant: "info", persist: true }
        );
        this.props.model.activateEndMode();
      });
    }
  };

  render() {
    return (
      <>
        <Stepper
          activeStep={this.state.activeStep}
          orientation="vertical"
          sx={{ padding: 2 }}
        >
          <Step key="pickStart">
            <StepLabel>{i18n.t("routing.steps.start")}</StepLabel>
            <StepContent>
              <ToggleButtonGroup
                value={this.state.startMode}
                exclusive
                onChange={this.handleClickOnStartMode}
                size="small"
              >
                <ToggleButton key={1} value="gps">
                  {i18n.t("routing.myPosition")}
                </ToggleButton>
                <ToggleButton key={2} value="manual">
                  {i18n.t("routing.selectInMap")}
                </ToggleButton>
              </ToggleButtonGroup>
            </StepContent>
          </Step>
          <Step key="pickEnd">
            <StepLabel>{i18n.t("routing.steps.end")}</StepLabel>
            <StepContent>
              <Button
                variant="contained"
                onClick={this.handleClickOnEndSelection}
                disabled={this.state.endSelectionInProgress === true}
              >
                {i18n.t("routing.selectInMap")}
              </Button>
            </StepContent>
          </Step>
          <Step key="pickTravelMode">
            <StepLabel>{i18n.t("routing.steps.travelMode")}</StepLabel>
            <StepContent>
              <ToggleButtonGroup
                value={this.state.travelMode}
                exclusive
                onChange={this.handleTravelModeChange}
              >
                <ToggleButton key={1} value="WALKING">
                  <DirectionsWalkIcon />
                </ToggleButton>
                <ToggleButton key={2} value="DRIVING">
                  <DirectionsCarIcon />
                </ToggleButton>
                <ToggleButton key={3} value="TRANSIT">
                  <DirectionsBusIcon />
                </ToggleButton>
                <ToggleButton key={4} value="BICYCLING">
                  <DirectionsBikeIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </StepContent>
          </Step>
        </Stepper>
        {this.renderStepperButtons()}
        <Box id="resultList" sx={{ padding: 2 }}></Box>
      </>
    );
  }

  renderStepperButtons() {
    return (
      <ButtonGroup fullWidth sx={{ padding: 2 }}>
        <Button
          sx={{ marginRight: 1 }}
          variant="contained"
          disabled={this.state.activeStep === 0}
          startIcon={<ArrowBackIosIcon />}
          onClick={() => {
            this.setState({ activeStep: this.state.activeStep - 1 });
          }}
        >
          {i18n.t("common.previous")}
        </Button>
        <Button
          variant="contained"
          startIcon={<SettingsBackupRestoreIcon />}
          onClick={() => {
            this.setState({
              activeStep: 0,
              startMode: undefined,
              travelMode: undefined,
            });
            this.props.model.clearMap();
          }}
        >
          {i18n.t("common.reset")}
        </Button>
      </ButtonGroup>
    );
  }
}

export default withSnackbar(RoutingView);
