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

import { withSnackbar } from "notistack";

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
      this.props.enqueueSnackbar(
        "Välj start- och stoppunkt för att kunna navigera.",
        {
          variant: "error",
        }
      );
    });

    props.localObserver.subscribe("requestDenied", () => {
      this.props.enqueueSnackbar(
        "Kunde inte navigera. Kontakta systemadministratör och påtala att giltig licens för Google Maps API saknas.",
        {
          variant: "error",
        }
      );
    });

    props.localObserver.subscribe("zeroResults", () => {
      this.props.enqueueSnackbar(
        "Kunde inte hitta vägbeskrivning mellan valda punkter och för det valda transportslaget. Prova att byta färdsätt och sök igen.",
        {
          variant: "warning",
        }
      );
    });

    props.localObserver.subscribe("otherError", (status) => {
      console.error(status);
      this.props.enqueueSnackbar(
        "Ett fel har inträffat. Vänligen försök igen.",
        {
          variant: "warning",
        }
      );
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
          "Klicka i kartan för att välja startpunkt.",
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
      this.setState({ endSelectionInProgress: true }, (e) => {
        this.selectEndSnackbar = this.props.enqueueSnackbar(
          "Klicka i kartan för att välja din destination.",
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
            <StepLabel>Välj startpunkt</StepLabel>
            <StepContent>
              <ToggleButtonGroup
                value={this.state.startMode}
                exclusive
                onChange={this.handleClickOnStartMode}
                size="small"
              >
                <ToggleButton key={1} value="gps">
                  Min position
                </ToggleButton>
                <ToggleButton key={2} value="manual">
                  Välj i kartan
                </ToggleButton>
              </ToggleButtonGroup>
            </StepContent>
          </Step>
          <Step key="pickEnd">
            <StepLabel>Välj destination</StepLabel>
            <StepContent>
              <Button
                variant="contained"
                onClick={this.handleClickOnEndSelection}
                disabled={this.state.endSelectionInProgress === true}
              >
                Välj i kartan
              </Button>
            </StepContent>
          </Step>
          <Step key="pickTravelMode">
            <StepLabel>Välj färdsätt</StepLabel>
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
          Föregående
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
          Nollställ
        </Button>
      </ButtonGroup>
    );
  }
}

export default withSnackbar(RoutingView);
