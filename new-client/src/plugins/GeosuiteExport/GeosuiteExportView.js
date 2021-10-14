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

class GeosuiteExportView extends React.PureComponent {
  state = {
    activeStep: 0,
    isAreaSelected: false,
    selectedProduct: "document",
  };

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

    this.globalObserver.subscribe("core.closeWindow", (title) => {
      if (title === this.props.title) {
        this.handleReset();
      }
    });
  };

  handleClose = () => {
    this.handleReset();
    this.globalObserver.publish(`geosuiteexport.closeWindow`);
  };

  handleReset = () => {
    this.props.model.clearMapFeatures();
    this.setState({
      activeStep: 0,
      isAreaSelected: false,
      selectedProduct: "document",
    });
  };

  handleDrawAreaStart = () => {
    this.props.model.addDrawInteraction();
  };

  handleStepComplete = (step) => {
    console.log(`handleStepComplete: step: ${step} `);
    switch (step) {
      case 0:
        this.handleStepZeroComplete();
        break;
      case 1:
        this.handleStepOneComplete();
        break;
      case 2:
        this.handleStepTwoComplete();
        break;
      case 3:
        this.handleStepThreeComplete();
        break;
      default:
        console.log("Något gick fel");
    }
  };

  handleStepBack = (step) => {
    this.setState({ activeStep: step - 1 });
  };

  handleStepZeroComplete = () => {
    console.log("handleStepZeroComplete");
    if (this.state.isAreaSelected) {
      this.setState({ activeStep: 1 });
    } else {
      this.props.enqueueSnackbar(
        "Du behöver först rita ett beställningsområde",
        {
          variant: "info",
          persist: false,
          vertical: "bottom",
          horizontal: "center",
        }
      );
    }
  };

  handleStepOneComplete = () => {
    console.log("handleStepOneComplete");
    this.setState({ activeStep: 2 });
  };

  handleStepTwoComplete = () => {
    console.log("handleStepTwoComplete");
    this.setState({ activeStep: 3 });
  };

  handleStepThreeComplete = () => {
    console.log("handleStepThreeComplete");
    this.setState({ activeStep: 3 });
  };

  handleSelectProduct = (e) => {
    this.setState({ selectedProduct: e.target.value });
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
            this.handleStepComplete(step);
          }}
          variant="outlined"
          aria-label="Fortsätt till nästa steg"
        >
          {nextButtonName || "Fortsätt"}
        </Button>
        <Button
          disabled={step === 0}
          onClick={() => {
            this.handleStepBack(step);
          }}
          variant="outlined"
          aria-label="Gå tillbaka till föregående steg"
        >
          {backButtonName || "Tillbaka"}
        </Button>
      </div>
    );
  };

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
                <div>
                  <Button
                    variant="contained"
                    onClick={() => {
                      this.handleDrawAreaStart();
                    }}
                  >
                    Yta
                  </Button>
                </div>
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
