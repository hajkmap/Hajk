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
  Box,
  Grid,
  Link,
  List,
  ListItem,
  Paper,
} from "@material-ui/core";

const styles = (theme) => ({
  bold: {
    fontWeight: 600,
  },
  stepButton: {
    marginTop: theme.spacing(2),
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
  subheading: {
    padding: theme.spacing(1),
    fontWeight: 500,
  },
  link: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  productList: {
    maxHeight: 200,
    overflowY: "scroll",
    overflowX: "hidden",
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
  processComplete: false,
};

class GeosuiteExportView extends React.PureComponent {
  state = defaultState;

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
    this.localObserver.subscribe("borehole-selection-updated", () => {
      this.boreHoleSelectionUpdated();
    });

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
      console.log("window opened");
      this.handleEnterStepZero();
    });
  };

  handleOrderGeosuiteToolboxFormat = () => {
    console.log("GeosuiteExportView: handleOrderGeosuiteToolboxFormat");
    this.props.model.updateBoreholeSelection(
      this.props.model.getSelectedGeometry()
    );
  };

  handleOrderDocumentsFormat = () => {
    console.log("GeosuiteExportView: handleOrderDocumentsFormat");
    this.props.model.updateProjectsSelection(
      this.props.model.getSelectedGeometry()
    );
  };

  clearSelection = () => {
    console.log("GeosuiteExportView: clearSelection");
    this.props.model.clearSelection();
  };

  boreHoleSelectionUpdated = () => {
    const selectedProjects = this.props.model.getSelectedProjects();
    console.log(
      "GeosuiteExportView: boreHoleSelectionUpdated. selected=",
      selectedProjects
    );
    selectedProjects.forEach((project) => {
      // Available: Project detail keys: { id<string>, name<string>, numBoreHolesSelected<number>, numBoreHolesTotal<number>, allDocumentsUrl<string> }
      console.log(
        "Selected project %s (id %s), selected %d bore holes (total %d). href=%s for all documents download.",
        project.name,
        project.id,
        project.numBoreHolesSelected,
        project.numBoreHolesTotal,
        project.allDocumentsUrl
      );
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
    this.setState(defaultState);
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
      case 10:
        /*
        Leave the completed state. This will occur when we click on 
        börja om. this is already handled by on the button with handleReset(). 
        */
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
      case 10:
        this.handleProcessComplete();
        break;
      default:
        console.warn("Reached an invalid step");
    }
  };

  handleProcessComplete = () => {
    //set process to complete.
    //this will cause the stepper to display as completed, and the final options buttons to display.
    this.setState({ processComplete: true });
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
    //send the WFS request when we enter the step 'leveransalternativ'
    this.handleOrderGeosuiteToolboxFormat();

    //if document
    //this.handleOrderDocumentsFormat();
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
    const { classes } = this.props;
    return (
      <>
        <Grid container direction="row" alignItems="center">
          <DescriptionOutlinedIcon />
          <Typography variant="subtitle1" className={classes.subheading}>
            {"Geotekniska utredningar"}
          </Typography>
        </Grid>
        <Typography>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur
          iste minima est? Voluptate hic dicta quaerat modi, vitae maxime ad?
        </Typography>
        <Grid
          className={classes.link}
          container
          direction="row"
          alignItems="center"
        >
          {/* TODO - set link button color (check if there is a 'link' in palette) */}
          <DescriptionOutlinedIcon />
          <Link
            href="http://www.google.com"
            className={classes.link}
            target="_blank"
          >
            {"Villkor för nyttjande"}
          </Link>
        </Grid>
        <div>
          <Paper className={classes.productList}>
            <List>
              <ListItem>1</ListItem>
              <ListItem>2</ListItem>
              <ListItem>3</ListItem>
              <ListItem>4</ListItem>
              <ListItem>5</ListItem>
              <ListItem>6</ListItem>
              <ListItem>7</ListItem>
              <ListItem>8</ListItem>
            </List>
          </Paper>
        </div>
        {this.renderNextAndBackButtons("Beställ", null)}
      </>
    );
  }

  renderOrderStepGeoSuite() {
    return (
      <>
        <Grid container direction="row" alignItems="center">
          <EmailOutlinedIcon />
          <Typography variant="subtitle1">
            {"Borrhålsdata i GeoSuite-format"}
          </Typography>
        </Grid>
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
    const step = this.state.activeStep;
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
        <div>
          <Button
            onClick={() => {
              this.setState({ activeStep: 1 });
            }}
            variant="outlined"
            aria-label="Välj mer produkter"
            disabled={false}
            color="primary"
          >
            Välj Mer
          </Button>
          <Button
            disabled={step === 0}
            onClick={() => {
              this.setState({ activeStep: 10 });
            }}
            color="primary"
            aria-label="Klar"
          >
            Klar
          </Button>
        </div>
      </>
    );
  };

  renderStepperButtons() {
    return (
      <ButtonGroup fullWidth>
        <Button
          disabled={this.state.activeStep === 0}
          startIcon={<ReplayIcon />}
          onClick={() => {
            this.handleReset();
          }}
          color="primary"
        >
          Börja Om
        </Button>
        <Button
          startIcon={<CancelOutlinedIcon />}
          onClick={() => {
            this.handleClose();
          }}
          color="primary"
        >
          Avsluta
        </Button>
      </ButtonGroup>
    );
  }

  renderNextAndBackButtons = (nextButtonName, backButtonName) => {
    const step = this.state.activeStep;
    const { classes } = this.props;

    return (
      <Box display="flex">
        <Button
          className={classes.stepButton}
          onClick={() => {
            this.setState({ activeStep: step + 1 });
          }}
          variant="outlined"
          aria-label="Fortsätt till nästa steg"
          disabled={!this.state.steps?.[step + 1]?.["canEnter"]}
          color="primary"
        >
          {nextButtonName || "Fortsätt"}
        </Button>
        <Button
          className={classes.stepButton}
          disabled={step === 0}
          onClick={() => {
            this.setState({ activeStep: step - 1 });
          }}
          variant="text"
          aria-label="Gå tillbaka till föregående steg"
          color="primary"
        >
          {backButtonName || "Tillbaka"}
        </Button>
      </Box>
    );
  };

  componentDidUpdate(prevProps, prevState) {
    //When the step of the stepper tool changes.
    if (prevState.activeStep !== this.state.activeStep) {
      this.handleLeaveStep(prevState.activeStep);
      this.handleEnterStep(this.state.activeStep);
    }

    //When the selected area of interest changes.
    if (prevState.isAreaSelected !== this.state.isAreaSelected) {
      const updatedSteps = { ...this.state.steps };
      updatedSteps[1].canEnter = this.state.isAreaSelected;
      this.setState({ steps: updatedSteps });
    }
  }

  render() {
    return (
      <>
        <div>
          <Stepper activeStep={this.state.activeStep} orientation="vertical">
            <Step key="selectArea">
              <StepLabel>Markera område</StepLabel>
              <StepContent>
                <div>
                  <Typography variant="caption">
                    Rita ditt omrråde i kartan, avsluta genom att dubbelklicka.
                  </Typography>
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
                    aria-label="selektera produkt"
                    name="select-product"
                    value={this.state.selectedProduct}
                    onChange={this.handleSelectProduct}
                  >
                    <FormControlLabel
                      value="document"
                      label="Geotekniska utredningar"
                      control={<Radio color="primary" />}
                    ></FormControlLabel>
                    <FormControlLabel
                      value="borrhal"
                      label="Borrhålsdata i GeoSuite format"
                      control={<Radio color="primary" />}
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
                <div>
                  <Button
                    variant="contained"
                    onClick={() => {
                      this.handleShowSelectionShapeInfo();
                      this.clearSelection();
                    }}
                  >
                    Rensa tillstånd
                  </Button>
                </div>
                <div>
                  <Button
                    variant="contained"
                    onClick={() => {
                      this.handleOrderGeosuiteToolboxFormat();
                    }}
                  >
                    Beställ GeoSuite-export
                  </Button>
                </div>
                <div>
                  <Button
                    variant="contained"
                    onClick={() => {
                      this.handleOrderDocumentsFormat();
                    }}
                  >
                    Hämta handlingar
                  </Button>
                </div>
                <div>
                  <Button
                    variant="contained"
                    onClick={() => {
                      this.boreHoleSelectionUpdated();
                    }}
                  >
                    Visa tillstånd
                  </Button>
                </div>
              </StepContent>
            </Step>
            <Step key="confirmation" completed={this.state.processComplete}>
              <StepLabel>Bekräftelse</StepLabel>
              <StepContent>{this.renderConfirmStep()}</StepContent>
            </Step>
          </Stepper>
        </div>
        <div>
          {this.state.processComplete === true && this.renderStepperButtons()}
        </div>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(GeosuiteExportView));
