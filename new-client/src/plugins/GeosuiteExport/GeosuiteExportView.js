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
  CircularProgress,
  FormLabel,
} from "@material-ui/core";
import ProductList from "./components/ProductList";
import { Checkbox } from "@material-ui/core";

const styles = (theme) => ({
  //specific request from SBK to reduce the default MUI stepper padding.
  stepper: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  bold: {
    fontWeight: 500,
  },
  subheading: {
    padding: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,
  },
  checkBoxList: {
    maxHeight: 200,
    overflowY: "scroll",
    overflowX: "hidden",
    border: `1px solid ${theme.palette.divider}`,
    width: "100%",
    //marginTop: theme.spacing(2),
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
  projects: [],
  documents: [],
  activeStep: null,
  isAreaSelected: false,
  selectedProduct: "document",
  email: "",
  emailValid: false,
  steps: {
    0: { enterable: true },
    1: { enterable: false },
    2: { enterable: true },
    3: { enterable: false },
  },
  processComplete: false,
  responsePending: false,
  responseFailed: false,
  savingFile: false,
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
    this.initSubscriptions();
  }

  initSubscriptions = () => {
    this.localObserver.subscribe("area-selection-complete", () => {
      this.setState({ isAreaSelected: true });
    });

    this.localObserver.subscribe("borehole-selection-updated", () => {
      this.boreholeSelectionUpdated();
    });

    this.localObserver.subscribe("borehole-selection-failed", () => {
      this.boreholeSelectionFailed();
    });

    this.localObserver.subscribe("document-selection-updated", () => {
      this.documentSelectionUpdated();
    });

    this.localObserver.subscribe("document-selection-failed", () => {
      this.documentSelectionFailed();
    });

    this.localObserver.subscribe("document-save-done", () => {
      this.documentSaveDone();
    });

    this.localObserver.subscribe("document-save-failed", () => {
      this.documentSaveFailed();
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
    //Basic email validation - at least one @ with a '.' somewhere after it.
    //There must be at least one character before the @ and at least one character after the following '.'
    const emailRegex = /.@.*?\../;
    const valid = emailRegex.test(email);
    return valid;
  };

  //toggle all projects exportAll setting, which controls the information that is exported for that borehole
  //when the order is completed. if exportAll is true, all boreholes within the project will be exported.
  //if exportAll is false, only those boreholes within the drawn polygon that belong to the project will be exported.
  toggleEntireProjectsForAll = (shouldExportAll) => {
    const updatedProjects = this.state.projects.map((project) => {
      return { ...project, exportAll: shouldExportAll };
    });
    this.setState({ projects: updatedProjects });
  };

  toggleEntireProject = (projectId, shouldExportAll) => {
    const projectToUpdate = this.state.projects.find(
      (project) => project.id === projectId
    );

    const updatedProject = { ...projectToUpdate, exportAll: shouldExportAll };

    const updatedProjects = this.state.projects.map((project) => {
      if (project.id === projectId) {
        return updatedProject;
      } else {
        return project;
      }
    });

    this.setState({ projects: updatedProjects });
  };

  //Ask the model to do a wfs search against the boreholes layer, and then then get the projects for those boreholes
  //from the Trimble GeoSuite API. When the model is ready is will publish "borehole-selection-updated"
  handleOrderGeosuiteToolboxFormat = () => {
    this.setState({
      responseFailed: false,
      responsePending: true,
    });

    this.props.model.updateBoreholeSelection(
      this.props.model.getSelectedGeometry()
    );
  };

  //Ask the model to do a wfs search against the document wfs layer, and update the documents. When the model is
  //ready it will publish "document-selection-updated".
  handleOrderDocumentsFormat = () => {
    this.setState({
      responseFailed: false,
      responsePending: true,
    });

    this.props.model.updateDocumentSelection(
      this.props.model.getSelectedGeometry()
    );
  };

  //update the projects state if the projects on the model have been updated.
  //The added 'selected property' is used select/deselect the project in UI's selection list.
  //The added 'exportAll' will be used to toggle export of all project points (e.g. boreholes) within selected area, or //for the entire project.
  boreholeSelectionUpdated = () => {
    let projects = this.props.model.getSelectedProjects();
    projects.forEach((project) => {
      project.selected = true;
      project.exportAll = false;
    });
    this.setState({
      responsePending: false,
      projects: projects,
    });
  };

  boreholeSelectionFailed = () => {
    this.setState({
      responsePending: false,
      responseFailed: true,
    });
  };

  // Update the documents state if the projects on the model have been updated.
  // The added 'selected property' can be used to select/deselect the project in UI's selection list.
  // NB! The 'selected' property is not currently used, it is prepared for the next development
  // iteration with planned changes to the document list by SBK Gothenburg.
  documentSelectionUpdated = () => {
    let documents = this.props.model.getSelectedDocuments();
    documents.forEach((document) => {
      document.selected = true;
    });
    this.setState({
      responsePending: false,
      documents: documents,
      savingFile: true,
    });
  };

  documentSelectionFailed = () => {
    this.setState({
      responsePending: false,
      responseFailed: true,
      savingFile: false,
    });
  };

  documentSaveDone = () => {
    this.setState({
      savingFile: false,
    });
  };

  documentSaveFailed = () => {
    this.setState({
      savingFile: false,
    });
    this.props.enqueueSnackbar(this.#getErrorMessage());
  };

  handleDocumentCheckboxChange = (event) => {
    let documents = this.props.model.getSelectedDocuments();

    let value = event.target.value;

    let document = documents.find((doc) => doc.id === value);
    document.selected = event.target.checked;

    this.setState({
      documents: documents,
    });
  };

  handleDocumentSelectAllClear = (event) => {
    let documents = this.props.model.getSelectedDocuments();
    let selectAll = event.target.value === "true" ? true : false;
    documents.forEach((document) => {
      document.selected = selectAll;
    });
    this.setState({
      documents: documents,
    });
  };

  //This is used when manually closing the plugin via the 'Avsluta' button.
  handleClose = () => {
    this.handleReset();
    this.globalObserver.publish(`geosuiteexport.closeWindow`);
  };

  //reset the plugin to it's initial state upon closing.
  handleReset = () => {
    this.props.model.clearMapFeatures();
    this.props.model.removeDrawInteraction();
    this.setState(defaultState);
  };

  handleLeaveStep = (step) => {
    switch (step) {
      case null:
        break; //this will be reached when we open the tool. Do nothing as all handled by enterDrawStep.
      case 0:
        this.handleLeaveDrawStep();
        break;
      case 1:
        this.handleLeaveProductChoiceStep();
        break;
      case 2:
        this.handleLeaveOrderStep();
        break;
      case 3:
        this.handleLeaveConfirmationStep();
        break;
      case 100:
        /*
        Leave the completed state. This will occur when we click on 
        börja om. This is already handled by the button click handler. 
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
        this.handleEnterDrawStep();
        break;
      case 1:
        this.handleEnterProductChoiceStep();
        break;
      case 2:
        this.handleEnterOrderStep();
        break;
      case 3:
        this.handleEnterConfirmationStep();
        break;
      case 100:
        this.handleProcessComplete();
        break;
      default:
        console.warn("Reached an invalid step");
    }
  };

  //set process to complete.
  //this will cause the stepper to display as completed, and the final options buttons to display.
  handleProcessComplete = () => {
    this.props.model.clearMapFeatures();
    this.props.model.removeDrawInteraction();
    this.setState({ processComplete: true });
  };

  /** Actions when entering steps **/

  handleEnterDrawStep = () => {
    this.props.model.addDrawInteraction();
  };

  handleEnterProductChoiceStep = () => {};

  handleEnterOrderStep = () => {
    if (this.state.selectedProduct === "document") {
      this.toggleStepEnabled(3, true); //moving to the next step should always be enabled when ordering documents.
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
  handleEnterConfirmationStep = () => {
    if (this.state.selectedProduct === "document") {
      let documents = this.props.model.getSelectedDocuments();

      this.props.model.zipDocuments(documents);
    } else if (this.state.selectedProduct !== "document") {
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

  /** Actions when leaving steps **/
  handleLeaveDrawStep = () => {
    this.props.model.removeDrawInteraction();
  };

  handleLeaveProductChoiceStep = () => {};

  handleLeaveOrderStep = () => {};

  handleLeaveConfirmationStep = () => {};

  //reset to the first step when the user clicks 'Börja om'.
  handleLeaveFinalStep = () => {
    this.handleReset();
    this.setState({ activeStep: 0 });
  };

  //render the orderStep for the product 'documents'.
  renderOrderStepDocument() {
    const { classes, options } = this.props;
    const termsAndConditionsLink = this.#getTermsAndConditionsLink();
    const documentDescription =
      options.view?.projects?.order?.description ??
      "Välj geoteknisk utredning nedan för att hämta motsvarande handlingar.";
    const documentSaveDescription =
      options.view?.projects?.order?.saveDescription ??
      'När du trycker "SPARA FIL" kommer en dialog att visas när alla undersökningar har hämtats';
    return (
      <>
        <Grid container direction="row" alignItems="center">
          <DescriptionOutlinedIcon />
          <Typography variant="subtitle1" className={classes.subheading}>
            {"Geotekniska utredningar"}
          </Typography>
        </Grid>
        <Typography>{documentDescription}</Typography>
        <Grid container direction="row" alignItems="center">
          <Grid item xs={6}>
            <Link
              component="button"
              value={true}
              onClick={this.handleDocumentSelectAllClear}
            >
              {"Välj Alla"}
            </Link>
          </Grid>
          <Grid item xs={6} style={{ textAlign: "right" }}>
            <Link
              component="button"
              value={false}
              onClick={this.handleDocumentSelectAllClear}
            >
              {"Rensa"}
            </Link>
          </Grid>
        </Grid>
        {this.renderDocumentOrderResult()}
        <Grid
          container
          direction="row"
          alignItems="center"
          style={{ marginTop: "16px", marginBottom: "8px" }}
        >
          <Link href={termsAndConditionsLink} target="_blank">
            <Box display="flex" alignItems="center" gridColumnGap="4px">
              {"Villkor för nyttjande"}
              <LaunchIcon fontSize="small" />
            </Box>
          </Link>
        </Grid>
        <Grid
          container
          direction="row"
          alignItems="center"
          style={{ marginTop: "16px", marginBottom: "8px" }}
        >
          <Typography>{documentSaveDescription}</Typography>
        </Grid>
        {this.renderNextAndBackButtons("Spara fil", null)}
      </>
    );
  }

  //render a spinner while the results are pending.
  renderPending(displayText) {
    return (
      <Grid container direction="row" justify="center">
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center">
            <CircularProgress variant="indeterminate" size={30} />
          </Box>
        </Grid>
        <Grid item>
          <Typography>{displayText}</Typography>
        </Grid>
      </Grid>
    );
  }

  renderFailed(message) {
    return (
      <div>
        <Typography color="error">{`${message}`}</Typography>
      </div>
    );
  }

  //The results to be shown in the OrderStep for product 'borehole'.
  renderBoreholeOrderResult() {
    const { responsePending, responseFailed, projects } = this.state;

    if (responsePending) {
      return this.renderPending("Hämtar resultat...");
    }

    if (responseFailed) {
      return this.renderFailed(this.#getErrorMessage());
    }

    return (
      <ProductList
        exportPerProject={true}
        projects={projects}
        handleExportAll={(shouldExportAll) => {
          this.toggleEntireProjectsForAll(shouldExportAll);
        }}
        handleToggleProjectExport={(projectId, shouldExportAll) => {
          this.toggleEntireProject(projectId, shouldExportAll);
        }}
      ></ProductList>
    );
  }

  //The results to be shown in the OrderStep for product 'documents'.
  renderDocumentOrderResult() {
    const { classes } = this.props;
    const { responsePending, responseFailed, documents } = this.state;

    if (responsePending) {
      return this.renderPending("Hämtar resultat...");
    }

    if (responseFailed) {
      return this.renderFailed(this.#getErrorMessage());
    }

    return documents.length > 0 ? (
      <Grid container columns={1}>
        <div className={classes.checkBoxList}>
          {this.state.documents.map((document) => {
            return (
              <Grid item key={document.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={document.selected}
                      onChange={this.handleDocumentCheckboxChange}
                      value={document.id}
                    />
                  }
                  label={document.title}
                />
              </Grid>
            );
          })}
        </div>
      </Grid>
    ) : (
      <div className={classes.noResultMessage}>
        <Typography className={classes.noResultMessage}>
          Inga resultat
        </Typography>
      </div>
    );
  }

  //render the orderStep for the product 'borehole'.
  renderOrderStepGeoSuite() {
    const { classes, options } = this.props;
    const termsAndConditionsLink = this.#getTermsAndConditionsLink();
    const boreholeIntro =
      options.view?.boreholes?.order?.intro ??
      "Nedan visas alla borrhålsprojekt med undersökningspunkter inom det markerade området.";
    const boreholeDescription =
      options.view?.boreholes?.order?.description ??
      "Välj om du vill ladda ner hela borrhålsprojektet eller endast punkter inom markering. Du kan välja generellt för alla eller ställa in för varje projekt.";
    const referenceSystemText =
      options.view?.boreholes?.order?.referenceSystemText ??
      "Geotekniska undersökningspunkter är i koordinatsystemet SWEREF 99 12 00 samt höjdsystemet RH2000";
    const deliveryInformationText =
      options.view?.boreholes?.order?.informationText ??
      "Informationen levereras i GeoSuite Toolbox-format via en länk som du får skickad till din e-postadress. För att kunna genomföra beställningen krävs att e-postadressen är registrerad i Geoarkivets molntjänst.";
    const deliveryInformationLink = options.view?.boreholes?.order
      ?.informationLink || {
      linkText: "",
      linkHref: "",
    };
    return (
      <div>
        <Grid container>
          <Grid container direction="row" alignItems="center">
            <EmailOutlinedIcon />
            <Typography className={classes.subheading} variant="subtitle1">
              {"Borrhålsdata i GeoSuite-format"}
            </Typography>
          </Grid>
          <Typography paragraph>{boreholeIntro}</Typography>
          <Typography paragraph>{boreholeDescription}</Typography>
          {this.renderBoreholeOrderResult()}

          <Grid item xs={12} style={{ marginTop: "20px" }}>
            <Accordion
              elevation={0}
              style={{ paddingLeft: "0px", marginLeft: "0px" }}
            >
              <AccordionSummary
                style={{ padding: "0px" }}
                expandIcon={<ExpandMoreIcon />}
              >
                <Typography className={classes.bold}>Referenssystem</Typography>
              </AccordionSummary>
              <AccordionDetails style={{ padding: "0px" }}>
                <Typography>{referenceSystemText}</Typography>
              </AccordionDetails>
            </Accordion>
            <Accordion elevation={0}>
              <AccordionSummary
                style={{ padding: "0px" }}
                expandIcon={<ExpandMoreIcon />}
              >
                <Typography className={classes.bold}>
                  Leveransinformation
                </Typography>
              </AccordionSummary>
              <AccordionDetails style={{ padding: "0px" }}>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography>{deliveryInformationText}</Typography>
                  </Grid>
                  {deliveryInformationLink.linkText && (
                    <Grid item xs={12}>
                      <Link
                        href={deliveryInformationLink.linkHref}
                        target="_blank"
                      >
                        <Typography>
                          {deliveryInformationLink.linkText}
                        </Typography>
                      </Link>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12} style={{ marginTop: "16px" }}>
            <FormControl fullWidth>
              <FormLabel style={{ padding: "4px 0px" }}>
                Din e-postadress
              </FormLabel>
              <OutlinedInput
                id="emailInput"
                required
                value={this.state.email}
                margin="dense"
                placeholder="E-postadress"
                error={
                  this.state.email.length === 0 ? false : !this.state.emailValid
                }
                onChange={(e) => {
                  this.handleEmailChange(e.target.value);
                }}
              />
            </FormControl>
          </Grid>

          <Grid
            style={{ marginTop: "16px", marginBottom: "8px" }}
            container
            direction="row"
            alignItems="center"
          >
            <Link href={termsAndConditionsLink} target="_blank">
              <Box display="flex" alignItems="center" gridColumnGap="4px">
                {"Villkor för nyttjande"}
                <LaunchIcon fontSize="small" />
              </Box>
            </Link>
          </Grid>

          {this.renderNextAndBackButtons("Beställ", null)}
        </Grid>
      </div>
    );
  }

  renderConfirmationStep = () => {
    const { classes, options } = this.props;
    const deliveryConfirmationHeader =
      options.view?.boreholes?.confirmation?.header ??
      "Tack för din beställning!";
    const confirmDeliveryInformationText =
      options.view?.boreholes?.confirmation?.informationText ??
      "Ett e-postmeddelande med vidare instruktioner kommer att skickas till dig.";
    const whereNextText =
      options.view?.boreholes?.confirmation?.whereNextText ??
      "Klicka på VÄLJ MER för att hämta mer data för ditt markerade område eller gå vidare med KLAR.";
    const step = this.state.activeStep;
    return (
      <>
        <Typography className={classes.bold}>
          {" "}
          {deliveryConfirmationHeader}
        </Typography>
        <br />
        <Typography variant="body1">
          {confirmDeliveryInformationText}
        </Typography>
        <br />
        <Typography variant="body1">{whereNextText}</Typography>
        <br />
        <div>
          <Button
            disabled={step === 0}
            onClick={() => {
              this.setState({ activeStep: 100 });
            }}
            variant="contained"
            color="primary"
            aria-label="Klar"
          >
            Klar
          </Button>
          <Button
            onClick={() => {
              this.setState({ activeStep: 1 });
            }}
            aria-label="Välj mer produkter"
            disabled={false}
            color="primary"
          >
            Välj mer
          </Button>
        </div>
      </>
    );
  };

  renderConfirmStepDocument = () => {
    const { classes, options } = this.props;
    const deliveryConfirmationHeader =
      options.view?.boreholes?.confirmation?.header ??
      "Tack för din beställning!";
    const whereNextText =
      options.view?.boreholes?.confirmation?.whereNextText ??
      "Klicka på VÄLJ MER för att hämta mer data för ditt markerade område eller gå vidare med KLAR.";
    //const step = this.state.activeStep;
    const { savingFile, step } = this.state;

    if (savingFile) {
      return this.renderPending("Skapar ZIP-fil...");
    }

    return (
      <>
        <Typography className={classes.bold}>
          {" "}
          {deliveryConfirmationHeader}
        </Typography>
        <br />
        <Typography variant="body1">{whereNextText}</Typography>
        <br />
        <div>
          <Button
            disabled={step === 0}
            onClick={() => {
              this.setState({ activeStep: 100 });
            }}
            variant="contained"
            color="primary"
            aria-label="Klar"
          >
            Klar
          </Button>
          <Button
            onClick={() => {
              this.setState({ activeStep: 1 });
            }}
            aria-label="Välj mer produkter"
            disabled={false}
            color="primary"
          >
            Välj mer
          </Button>
        </div>
      </>
    );
  };

  renderStepperButtons() {
    return (
      <div style={{ width: "80%", margin: "0 auto" }}>
        <Button
          disabled={this.state.activeStep === 0}
          startIcon={<ReplayIcon />}
          onClick={() => {
            this.handleLeaveFinalStep();
          }}
          color="primary"
          variant="outlined"
          fullWidth
          style={{ marginBottom: "5px" }}
        >
          Börja Om
        </Button>
        <Button
          startIcon={<CancelOutlinedIcon />}
          onClick={() => {
            this.handleClose();
          }}
          color="primary"
          variant="outlined"
          fullWidth
          style={{ marginTop: "5px" }}
        >
          Avsluta
        </Button>
      </div>
    );
  }

  renderNextAndBackButtons = (nextButtonName, backButtonName) => {
    const step = this.state.activeStep;

    return (
      <Box display="flex" mt={1} gridColumnGap={"10px"}>
        <Button
          onClick={() => {
            this.setState({ activeStep: step + 1 });
          }}
          variant="contained"
          aria-label="Fortsätt till nästa steg"
          disabled={!this.state.steps?.[step + 1]?.["enterable"]}
          color="primary"
        >
          {nextButtonName || "Fortsätt"}
        </Button>
        <Button
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

  //Toggle whether a step should be enabled or not.
  //If a step is not enabled, the button to enter that step will be disabled.
  toggleStepEnabled = (step, isEnabled) => {
    const stepState = { ...this.state.steps };
    stepState[step].enterable = isEnabled;
    this.setState({ steps: stepState });
  };

  #getTermsAndConditionsLink = () => {
    const { options } = this.props;
    return (
      options.view?.termsAndConditionsLink ??
      "https://goteborg.se/wps/portal/om-webbplatsen"
    );
  };

  #getErrorMessage = () => {
    const { options } = this.props;
    return (
      options.view?.errorMessage ??
      "Kunde inte hämta resultat. Vänligen försök igen. Kontakta oss om felet kvarstår."
    );
  };

  componentDidMount() {
    //The standard way that we start the stepper is by changing the activeStep state
    //causing componentDidUpdate to handleEnterStep. Because onWindowShow() does not
    //get called for a plugin when visibleAtStart is true, we handle this in componentDidMount instead.
    if (this.props?.options?.visibleAtStart) {
      this.setState({ activeStep: 0 });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    //When the step of the stepper tool change, leave the current step and enter the new active step.
    if (prevState.activeStep !== this.state.activeStep) {
      this.handleLeaveStep(prevState.activeStep);
      this.handleEnterStep(this.state.activeStep);
    }

    //When the selected area of interest changes.
    if (prevState.isAreaSelected !== this.state.isAreaSelected) {
      const updatedSteps = { ...this.state.steps };
      updatedSteps[1].enterable = this.state.isAreaSelected;
      this.setState({ steps: updatedSteps });
    }

    // When the documents update. Toggle availability of the 'Beställ' button.
    if (prevState.documents !== this.state.documents) {
      if (this.state.selectedProduct === "document") {
        const selectedForOrder = this.state.documents.filter(
          (doc) => doc.selected
        );
        this.toggleStepEnabled(3, selectedForOrder.length > 0);
      }
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
    const { options, classes } = this.props;
    const description =
      options.view?.digitizeDescription ??
      "Rita ditt område i kartan, avsluta genom att dubbelklicka.";
    return (
      <>
        <div>
          <Stepper
            activeStep={this.state.activeStep}
            orientation="vertical"
            className={classes.stepper}
          >
            <Step key="selectArea" completed={false}>
              <StepLabel>Markera område</StepLabel>
              <StepContent>
                <div>
                  <Typography variant="caption" paragraph>
                    {description}
                  </Typography>
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
                    onChange={(e) =>
                      this.setState({
                        selectedProduct: e.target.value,
                      })
                    }
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
              <StepContent>
                {this.state.selectedProduct === "document"
                  ? this.renderConfirmStepDocument()
                  : this.renderConfirmationStep()}
              </StepContent>
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
