import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import ReplayIcon from "@material-ui/icons/Replay";
import CancelOutlinedIcon from "@material-ui/icons/CancelOutlined";
import DescriptionOutlinedIcon from "@material-ui/icons/DescriptionOutlined";
import EmailOutlinedIcon from "@material-ui/icons/EmailOutlined";
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  ButtonGroup,
  Button,
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
} from "@material-ui/core";

const styles = (theme) => ({
  bold: {
    fontWeight: 600,
  },
});

const defaultState = {
  activeStep: 0,
  isAreaSelected: false,
  selectedProduct: "document",
  steps: {
    0: { canEnter: true },
    1: { canEnter: false },
    2: { canEnter: true },
    3: { canEnter: true },
  },
};

class GeosuiteExportView extends React.PureComponent {
  state = defaultState;
  // state = {
  //   activeStep: 0,
  //   isAreaSelected: false,
  //   selectedProduct: "document",
  //   steps: {
  //     0: { canEnter: true },
  //     1: { canEnter: false },
  //     2: { canEnter: true },
  //     3: { canEnter: true },
  //   },
  // };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    globalObserver: PropTypes.object.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired,
    closeSnackbar: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.globalObserver = props.globalObserver;
    this.localObserver = props.localObserver;
    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    this.localObserver.subscribe("area-selection-complete", () => {
      this.setState({ isAreaSelected: true });
    });

    this.localObserver.subscribe("area-selection-removed", () => {
      this.setState({ isAreaSelected: false });
    });

    this.localObserver.subscribe("window-closed", () => {
      this.handleReset();
    });

    this.localObserver.subscribe("window-opened", () => {
      this.handleEnterStepZero();
    });
  };

  //used when we close using the 'avsluta' button.
  handleClose = () => {
    this.handleReset();
    this.globalObserver.publish(`geosuiteexport.closeWindow`);
  };

  handleReset = () => {
    this.props.model.clearMapFeatures();
    this.props.model.removeDrawInteraction();
    this.setState({
      activeStep: 0,
      isAreaSelected: false,
      selectedProduct: "document",
    });
  };

  //update form in order step.
  handleSelectProduct = (e) => {
    this.setState({ selectedProduct: e.target.value });
  };

  handleLeaveStep = (step) => {
    switch (step) {
      case 0:
        this.handleLeaveStepZero();
        break;
      case 1:
        this.handleLeaveStepOne();
        break;
      case 2:
        this.handleLeaveStepTwo();
        break;
      case 3:
        this.handleLeaveStepThree();
        break;
      default:
        console.warn("Reached an invalid step");
    }
  };

  handleEnterStep = (step) => {
    switch (step) {
      case 0:
        this.handleEnterStepZero();
        break;
      case 1:
        this.handleEnterStepOne();
        break;
      case 2:
        this.handleEnterStepTwo();
        break;
      case 3:
        this.handleEnterStepThree();
        break;
      default:
        console.warn("Reached an invalid step");
    }
  };

  //Actions when leaving steps
  handleEnterStepZero = () => {
    console.log("handleEnterStepZero");
    this.props.model.addDrawInteraction();
  };

  handleEnterStepOne = () => {
    console.log("handleEnterStepOne");
  };

  handleEnterStepTwo = () => {
    console.log("handleEnterStepTwo");
    console.log("Here we will send the WFS request");
  };

  handleEnterStepThree = () => {
    console.log("handleEnterStepThree");
  };

  //Actions when entering steps
  handleLeaveStepZero = () => {
    console.log("handleLeaveStepZero");
    this.props.model.removeDrawInteraction();
  };

  handleLeaveStepOne = () => {
    console.log("handleLeaveStepOne");
  };

  handleLeaveStepTwo = () => {
    console.log("handleLeaveStepTwo");
  };

  handleLeaveStepThree = () => {
    console.log("handleLeaveStepThree");
  };

  renderOrderStepDocument() {
    return (
      <>
        <span>
          <Typography variant="subtitle1">
            <DescriptionOutlinedIcon />
            {"Geotekniska utredningar"}
          </Typography>
        </span>
        {this.renderNextAndBackButtons("Beställ", null)}
      </>
    );
  }

  renderOrderStepGeoSuite() {
    return (
      <>
        <span>
          <Typography variant="subtitle1">
            <EmailOutlinedIcon />
            {"Borrhålsdata i GeoSuite-format"}
          </Typography>
        </span>
        <br />
        <Typography variant="body1">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </Typography>
        <br />
        {this.renderNextAndBackButtons("Beställ", null)}
      </>
    );
  }

  renderConfirmStep = () => {
    const { classes } = this.props;
    return (
      <>
        <Typography className={classes.bold}>
          {" "}
          Tack för din beställning!
        </Typography>
        <br />
        <Typography variant="body1">
          Klicka på VÄLJ MER för att hämta mer data för ditt markerade område
          eller gå vidare med KLAR.
        </Typography>
        <br />
        {this.renderNextAndBackButtons("Välj mer", "Klar")}
      </>
    );
  };

  renderStepperButtons() {
    const { classes } = this.props;

    return (
      <ButtonGroup fullWidth>
        <Button
          disabled={this.state.activeStep === 0}
          startIcon={<ReplayIcon />}
          onClick={() => {
            this.handleReset();
          }}
        >
          Börja Om
        </Button>
        <Button
          startIcon={<CancelOutlinedIcon />}
          onClick={() => {
            this.handleClose();
          }}
        >
          Avsluta
        </Button>
      </ButtonGroup>
    );
  }

  renderNextAndBackButtons = (nextButtonName, backButtonName) => {
    const step = this.state.activeStep;

    return (
      <div>
        <Button
          onClick={() => {
            this.setState({ activeStep: step + 1 });
          }}
          variant="outlined"
          aria-label="Fortsätt till nästa steg"
          disabled={!this.state.steps[step + 1]["canEnter"]}
        >
          {nextButtonName || "Fortsätt"}
        </Button>
        <Button
          disabled={step === 0}
          onClick={() => {
            this.setState({ activeStep: step - 1 });
          }}
          variant="outlined"
          aria-label="Gå tillbaka till föregående steg"
        >
          {backButtonName || "Tillbaka"}
        </Button>
      </div>
    );
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.activeStep !== this.state.activeStep) {
      this.handleLeaveStep(prevState.activeStep);
      this.handleEnterStep(this.state.activeStep);
    }

    if (prevState.isAreaSelected !== this.state.isAreaSelected) {
      const updatedSteps = { ...this.state.steps };
      updatedSteps[1].canEnter = this.state.isAreaSelected;
      this.setState({ steps: updatedSteps });
    }
  }

  render() {
    const { classes } = this.props;

    return (
      <>
        <Stepper activeStep={this.state.activeStep} orientation="vertical">
          <Step key="selectArea">
            <StepLabel>Markera område</StepLabel>
            <StepContent>
              <div>
                <Typography variant="caption">
                  Rita ditt omrråde i kartan, avsluta genom att dubbelklicka.
                </Typography>
                <br />
                <br />
                {this.renderNextAndBackButtons()}
              </div>
            </StepContent>
          </Step>
          <Step key="selectData">
            <StepLabel>Välj produkt</StepLabel>
            <StepContent>
              <FormControl component="fieldset" label="">
                <RadioGroup
                  aria-label=""
                  name=""
                  value={this.state.selectedProduct}
                  onChange={this.handleSelectProduct}
                >
                  <FormControlLabel
                    value="document"
                    label="Geotekniska utredningar"
                    control={<Radio />}
                  ></FormControlLabel>
                  <FormControlLabel
                    value="borrhal"
                    label="Borrhålsdata i GeoSuite format"
                    control={<Radio />}
                  ></FormControlLabel>
                </RadioGroup>
              </FormControl>
              {this.renderNextAndBackButtons()}
            </StepContent>
          </Step>
          <Step key="order">
            <StepLabel>Leveransalternativ</StepLabel>
            <StepContent>
              {this.state.selectedProduct === "document"
                ? this.renderOrderStepDocument()
                : this.renderOrderStepGeoSuite()}
            </StepContent>
          </Step>
          <Step key="confirmation">
            <StepLabel>Bekräftelse</StepLabel>
            <StepContent>{this.renderConfirmStep()}</StepContent>
          </Step>
        </Stepper>
        {this.renderStepperButtons()}
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(GeosuiteExportView));
