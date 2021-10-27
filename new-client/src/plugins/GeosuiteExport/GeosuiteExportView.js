import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import ReplayIcon from "@material-ui/icons/Replay";
import CancelOutlinedIcon from "@material-ui/icons/CancelOutlined";
import DescriptionOutlinedIcon from "@material-ui/icons/DescriptionOutlined";
import EmailOutlinedIcon from "@material-ui/icons/EmailOutlined";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import LaunchIcon from "@material-ui/icons/Launch";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  OutlinedInput,
  InputAdornment,
  InputLabel,
  CircularProgress,
} from "@material-ui/core";
import ProductList from "./components/ProductList";
import LinkItem from "./components/LinkItem";

const styles = (theme) => ({
  bold: {
    fontWeight: 600,
  },
  stepButton: {
    marginTop: theme.spacing(2),
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
  link: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  accordion: {
    width: "100%",
  },
  subheading: {
    padding: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,
  },
  paragraph: {
    marginTop: theme.spacing(1),
    marginBotton: theme.spacing(1),
  },
  linkList: {
    maxHeight: 200,
    overflowY: "scroll",
    overflowX: "hidden",
  },
  pending: {
    display: "flex",
    justifyContent: "center",
  },
  pendingContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  noResultMessage: {
    display: "flex",
    justifyContent: "center",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    fontWeight: theme.typography.fontWeightMedium,
  },
});

const defaultState = {
  activeStep: null,
  isAreaSelected: false,
  selectedProduct: "document",
  email: "",
  emailValid: false,
  steps: {
    0: { canEnter: true },
    1: { canEnter: false },
    2: { canEnter: true },
    3: { canEnter: false },
  },
  processComplete: false,
  projects: [],
  documents: [],
  responsePending: false,
  responseFailed: false,
};

/*Make configurable*/
const termsAndConditionsLink = "https://goteborg.se/wps/portal/om-webbplatsen";

const boreholeIntro =
  "Nedan visas alla borrhålsprojekt med undersökningspunkter inom det markerade området.";

const boreholeDescription =
  "Välj om du vill ladda ner hela borrhålsprojektet eller endast punkter inom markering. Du kan välja generellt för alla eller ställa in för varje projekt.";

const documentDescription =
  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur iste minima est? Voluptate hic dicta quaerat modi, vitae maxime ad?";

const errorMessage =
  "Kunde inte hämta resultat. Vänligen försök igen. Kontakta oss om felet kvarstår.";

const referenceSystemText =
  "Geotekniska undersökningspunkter är i koordinatsystemet SWEREF 99 12 00 samt höjdsystemet RH2000";

const deliveryInformationText =
  "Informationen levereras i GeoSuite Toolbox-format via en länk som du får skickad till din e-postadress. För att kunna genomföra beställningen krävs att e-postadressen är registrerad i Geoarkivets mölntjänst.";

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
    this.localObserver.subscribe("area-selection-complete", () => {
      this.setState({ isAreaSelected: true });
    });

    this.localObserver.subscribe("borehole-selection-updated", () => {
      this.boreHoleSelectionUpdated();
    });

    this.localObserver.subscribe("borehole-selection-failed", () => {
      this.boreHoleSelectionFailed();
    });

    this.localObserver.subscribe("document-selection-updated", () => {
      this.documentSelectionUpdated();
    });

    this.localObserver.subscribe("document-selection-failed", () => {
      this.documentSelectionfailed();
    });

    this.localObserver.subscribe("area-selection-removed", () => {
      this.setState({ isAreaSelected: false });
    });

    this.localObserver.subscribe("window-opened", () => {
      this.setState({ activeStep: 0 });
    });

    this.localObserver.subscribe("window-closed", () => {
      this.handleReset();
    });
  };

  handleEmailChange = (value) => {
    const isValid = this.emailIsValid(value);
    this.setState({ email: value, emailValid: isValid });
  };

  emailIsValid = (email) => {
    /*Basic email validation - at least one @ with a '.' somewhere after it.*/
    const emailRegex = /@.*?\./;
    const valid = emailRegex.test(email);
    return valid;
  };

  toggleExportEntireProjects = (shouldExportAll) => {
    const updatedProjects = this.state.projects.map((project) => {
      return { ...project, exportAll: shouldExportAll };
    });
    this.setState({ projects: updatedProjects });
  };

  handleOrderGeosuiteToolboxFormat = () => {
    this.setState({
      responseFailed: false,
      responsePending: true,
    });

    this.props.model.updateBoreholeSelection(
      this.props.model.getSelectedGeometry()
    );
  };

  handleOrderDocumentsFormat = () => {
    this.setState({
      responseFailed: false,
      responsePending: true,
    });

    this.props.model.updateDocumentSelection(
      this.props.model.getSelectedGeometry()
    );
  };

  clearSelection = () => {
    this.props.model.clearSelection();
  };

  boreHoleSelectionUpdated = () => {
    let projects = this.props.model.getSelectedProjects();
    //The 'selected property' will be used to select/deselect the project in UI's selection list.
    //The 'exportAll' will be used to toggle export of all project points/points within selected area.
    projects.forEach((project) => {
      project.selected = true;
      project.exportAll = false;
    });
    this.setState({
      responsePending: false,
      projects: projects,
    });
  };

  boreHoleSelectionFailed = () => {
    console.log("GeosuiteExportView: boreHoleSelectionFailed");
    this.setState({
      responsePending: false,
      responseFailed: true,
    });
  };

  documentSelectionUpdated = () => {
    let documents = this.props.model.getSelectedDocuments();
    //The 'selected property' will be used to select/deselect the project in UI's selection list (NB! pending ÄTA/sprint 2)
    documents.forEach((document) => {
      document.selected = true;
    });
    this.setState({
      responsePending: false,
      documents: documents,
    });
    // TODO: Remove logging:
    console.log("View state updated with the following documents: ", documents);
  };

  documebntSelectionfailed = () => {
    console.log("GeosuiteExportView: documebntSelectionfailed");
    this.setState({
      responsePending: false,
      responseFailed: true,
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
      case null:
        break; //will be reached when we open the tool. Do nothing as all handled by enterStepZero.
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
      case null:
        break; //will be reached when we close the tool. Do nothing as all handled already.
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

  //Actions when entering steps
  handleEnterStepZero = () => {
    console.log("handleEnterStepZero");
    this.props.model.addDrawInteraction();
  };

  handleEnterStepOne = () => {
    console.log("handleEnterStepOne");
  };

  handleEnterStepTwo = () => {
    console.log("handleEnterStepTwo");
    if (this.state.selectedProduct === "document") {
      //moving to the next step should always be enabled when ordering documents
      this.toggleStepEnabled(3, true);
      this.handleOrderDocumentsFormat();
    } else {
      this.handleOrderGeosuiteToolboxFormat();
    }
  };

  /**
   * Performs GeoSuite Toolbox-format export.
   * @summary Handles GeoSuite Toolbox-format export via Trimble API, after UI selection of
   * projects and/or boreholes. Pre-requisite: state must be updated with projects and contain e-mail.
   */
  handleEnterStepThree = () => {
    console.log("handleEnterStepThree");

    if (this.state.selectedProduct !== "document") {
      const email = this.state.email;
      const boreholeIds = [];
      const projectIds = [];
      // Go through user selection in state and build Trimble API input parameters
      this.state.projects
        .filter((proj) => {
          return proj.selected;
        })
        .forEach((proj) => {
          if (proj.exportAll) {
            projectIds.push(proj.id);
          } else {
            boreholeIds.push.apply(boreholeIds, proj.boreholeIds);
          }
        });
      this.props.model.orderGeoSuiteExport(email, boreholeIds, projectIds);
    }
  };

  //Actions when leaving steps
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
        <Typography>{documentDescription}</Typography>
        {this.renderDocumentOrderResult()}
        <Grid
          className={classes.link}
          container
          direction="row"
          alignItems="center"
        >
          <LaunchIcon />
          <Link
            href={`${termsAndConditionsLink}`}
            className={classes.link}
            target="_blank"
          >
            {"Villkor för nyttjande"}
          </Link>
        </Grid>
        {this.renderNextAndBackButtons("Beställ", null)}
      </>
    );
  }

  renderPending() {
    return (
      <>
        <div className={this.props.classes.pendingContainer}>
          <div className={this.props.classes.pending}>
            <CircularProgress variant="indeterminate" size={30} />
          </div>
          <div className={this.props.classes.pending}>
            <Typography>Hämtar resultat...</Typography>
          </div>
        </div>
      </>
    );
  }

  renderFailed(message) {
    return (
      <div>
        <Typography color="error">{`${message}`}</Typography>
      </div>
    );
  }

  renderBoreholeOrderResult() {
    const { responsePending, responseFailed, projects } = this.state;

    if (responsePending) {
      return this.renderPending();
    }

    if (responseFailed) {
      return this.renderFailed(errorMessage);
    }

    return (
      <ProductList
        projects={projects}
        handleExportAll={(shouldExportAll) => {
          this.toggleExportEntireProjects(shouldExportAll);
        }}
      ></ProductList>
    );
  }

  renderDocumentOrderResult() {
    const { classes } = this.props;
    const { responsePending, responseFailed, documents } = this.state;

    if (responsePending) {
      return this.renderPending();
    }

    if (responseFailed) {
      return this.renderFailed(errorMessage);
    }

    return documents.length > 0 ? (
      <div className={classes.linkList}>
        {this.state.documents.map((document) => {
          return <LinkItem key={document.id} link={document} />;
        })}
      </div>
    ) : (
      <div className={classes.noResultMessage}>
        <Typography className={classes.noResultMessage}>
          Inga resultat
        </Typography>
      </div>
    );
  }

  renderOrderStepGeoSuite() {
    const { classes } = this.props;
    return (
      <>
        <Grid container direction="row" alignItems="center">
          <EmailOutlinedIcon />
          <Typography className={classes.subheading} variant="subtitle1">
            {"Borrhålsdata i GeoSuite-format"}
          </Typography>
        </Grid>
        <Typography
          className={classes.paragraph}
        >{`${boreholeIntro}`}</Typography>
        <Typography
          className={classes.paragraph}
        >{`${boreholeDescription}`}</Typography>
        <br />
        {this.renderBoreholeOrderResult()}
        <br />
        <br />
        <Accordion elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.subheading}>
              Referenssystem
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>{`${referenceSystemText}`}</Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.subheading}>
              Leveransinformation
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>{`${deliveryInformationText}`}</Typography>
          </AccordionDetails>
        </Accordion>
        <br />
        <div>
          <FormControl fullWidth>
            <InputLabel htmlFor="emailInput">Din e-postadress</InputLabel>
            <OutlinedInput
              id="emailInput"
              required
              value={this.state.email}
              error={
                this.state.email.length === 0 ? false : !this.state.emailValid
              }
              onChange={(e) => {
                this.handleEmailChange(e.target.value);
              }}
              startAdornment={
                <InputAdornment position="start">@</InputAdornment>
              }
            />
          </FormControl>
          <Grid
            className={classes.link}
            container
            direction="row"
            alignItems="center"
          >
            {/* TODO - set link button color (check if there is a 'link' in palette) */}
            <LaunchIcon />
            <Link
              href={`${termsAndConditionsLink}`}
              className={classes.link}
              target="_blank"
            >
              {"Villkor för nyttjande"}
            </Link>
          </Grid>
        </div>
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

  toggleStepEnabled = (step, isEnabled) => {
    const stepState = { ...this.state.steps };
    stepState[step].canEnter = isEnabled;
    this.setState({ steps: stepState });
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

    //When the projects update or the email validity updates. Toggle availability of the 'Beställ' button.
    if (
      prevState.projects !== this.state.projects ||
      prevState.emailValid !== this.state.emailValid
    ) {
      //toggle availabilty of Beställ knapp based on if there are any orders selected.
      const selectedForOrder = this.state.projects.filter(
        (proj) => proj.selected
      );

      this.toggleStepEnabled(
        3,
        selectedForOrder.length && this.state.emailValid
      );
    }
  }

  render() {
    return (
      <>
        <div>
          <Stepper activeStep={this.state.activeStep} orientation="vertical">
            <Step key="selectArea" completed={false}>
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
            <Step key="selectData" completed={false}>
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
            <Step key="order" completed={false}>
              <StepLabel>Leveransalternativ</StepLabel>
              <StepContent>
                {this.state.selectedProduct === "document"
                  ? this.renderOrderStepDocument()
                  : this.renderOrderStepGeoSuite()}
              </StepContent>
            </Step>
            <Step key="confirmation" completed={false}>
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
