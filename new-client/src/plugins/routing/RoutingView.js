import React from "react";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  ButtonGroup
} from "@material-ui/core";
import { ToggleButtonGroup, ToggleButton } from "@material-ui/lab/";
import DirectionsWalkIcon from "@material-ui/icons/DirectionsWalk";
import DirectionsCarIcon from "@material-ui/icons/DirectionsCar";
import DirectionsBikeIcon from "@material-ui/icons/DirectionsBike";
import DirectionsBusIcon from "@material-ui/icons/DirectionsBus";
import SettingsBackupRestoreIcon from "@material-ui/icons/SettingsBackupRestore";
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";

import { withSnackbar } from "notistack";
import clsx from "clsx";

const styles = theme => ({
  unifiedPadding: {
    padding: theme.spacing(2)
  }
});

class RoutingView extends React.PureComponent {
  state = {
    activeStep: 0,
    startMode: undefined,
    endSelectionInProgress: false,
    travelMode: undefined
  };
  selectStartSnackbar = undefined;
  selectEndSnackbar = undefined;

  constructor(props) {
    super();

    // Used to select the correct step in our Stepper.
    // Also used to close Snackbars when a given stop has completed.
    props.localObserver.subscribe("doneWithStep", step => {
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

    props.localObserver.subscribe("startModeSelected", mode => {
      this.setState({ startMode: mode });
    });

    props.localObserver.subscribe("startStopPointsMissing", () => {
      this.props.enqueueSnackbar(
        "Välj start- och stoppunkt för att kunna navigera.",
        {
          variant: "error"
        }
      );
    });

    props.localObserver.subscribe("requestDenied", () => {
      this.props.enqueueSnackbar(
        "Kunde inte navigera. Kontakta systemadministratör och påtala att giltig licens för Google Maps API saknas.",
        {
          variant: "error"
        }
      );
    });

    props.localObserver.subscribe("zeroResults", () => {
      this.props.enqueueSnackbar(
        "Kunde inte hitta vägbeskrivning mellan valda punkter och för det valda transportslaget. Prova att byta färdsätt och sök igen.",
        {
          variant: "warning"
        }
      );
    });

    props.localObserver.subscribe("otherError", status => {
      console.error(status);
      this.props.enqueueSnackbar(
        "Ett fel har inträffat. Vänligen försök igen.",
        {
          variant: "warning"
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
      this.setState({ endSelectionInProgress: true }, e => {
        this.selectEndSnackbar = this.props.enqueueSnackbar(
          "Klicka i kartan för att välja din destination.",
          { variant: "info", persist: true }
        );
        this.props.model.activateEndMode();
      });
    }
  };

  render() {
    const { classes } = this.props;
    return (
      <>
        <Stepper
          activeStep={this.state.activeStep}
          orientation="vertical"
          className={clsx(classes.unifiedPadding)}
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
        <div id="resultList" className={clsx(classes.unifiedPadding)}></div>
      </>
    );
  }

  renderStepperButtons() {
    const { classes } = this.props;

    return (
      <ButtonGroup fullWidth className={clsx(classes.unifiedPadding)}>
        <Button
          disabled={this.state.activeStep === 0}
          startIcon={<ArrowBackIosIcon />}
          onClick={() => {
            this.setState({ activeStep: this.state.activeStep - 1 });
          }}
        >
          Föregående
        </Button>
        <Button
          startIcon={<SettingsBackupRestoreIcon />}
          onClick={() => {
            this.setState({
              activeStep: 0,
              startMode: undefined,
              travelMode: undefined
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

export default withStyles(styles)(withSnackbar(RoutingView));
