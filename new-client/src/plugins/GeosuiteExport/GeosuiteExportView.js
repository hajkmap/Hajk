import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import SettingsBackupRestoreIcon from "@material-ui/icons/SettingsBackupRestore";
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  ButtonGroup,
  Button,
  Typography,
} from "@material-ui/core";

const styles = (theme) => ({
  drawerContent: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
});

class GeosuiteExportView extends React.PureComponent {
  state = {
    activeStep: 0,
    orderStepContent: "document",
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired, //the classes prop is provided by the material UI theme.
    localObserver: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);

    this.map = props.map;
    this.localObserver = props.localObserver;
    this.bindSubscriptions();
  }

  //example subscriber that we might use when the map selection is complete.
  bindSubscriptions = () => {
    this.localObserver.subscribe("area-select-complete", () => {
      this.areaSelectionCompleted();
    });
  };

  handleDrawAreaStart = () => {
    console.log("GeosuiteExportView: handleDrawAreaStart");
    this.props.model.addDrawInteraction();
  };

  handleShowSelectionShapeInfo = () => {
    console.log("GeosuiteExportView: handleShowSelectionShapeInfo");
    this.props.model.showShapeInfo();
  };

  areaSelectionCompleted = () => {
    console.log("The area is selected, let's build the WFS search");
    this.props.model.createWfsRequest();
  };

  handleStepZeroComplete = () => {
    console.log("step zero complete");
    this.setState({ activeStep: 1 });
  };

  handleStepOneComplete = () => {
    console.log("step one complete");
    this.setState({ activeStep: 2 });
  };

  renderDocumentDownloadStep() {
    return (
      <>
        <p>DOCUMENT LIST</p>
      </>
    );
  }

  renderOrderGeosuiteDataStep() {
    return (
      <>
        <p>Info om att ladda ner GeoSuite data</p>
        <p>form med lista över hittade borrhålprojekt</p>
      </>
    );
  }

  renderStepperButtons() {
    const { classes } = this.props;

    return (
      <ButtonGroup fullWidth>
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
            });
            this.props.model.clearMap();
          }}
        >
          Nollställ
        </Button>
      </ButtonGroup>
    );
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
                  Rita område för uttag:
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
                <div>
                  <Button
                    variant="contained"
                    onClick={() => {
                      this.handleShowSelectionShapeInfo();
                    }}
                  >
                    Shape Info
                  </Button>
                </div>
              </div>
              <div>
                <Button
                  onClick={() => {
                    this.handleStepZeroComplete();
                  }}
                >
                  Nästa
                </Button>
              </div>
            </StepContent>
          </Step>
          <Step key="selectData">
            <StepLabel>Välj data</StepLabel>
            <StepContent>
              <p>Här välja användaren dokument/borrhålsdata</p>
              <Button
                onClick={() => {
                  this.setState({ orderStepContent: "document" });
                  this.handleStepOneComplete();
                }}
              >
                Ladda ner dokument
              </Button>
              <Button
                onClick={() => {
                  this.setState({ orderStepContent: "data" });
                  this.handleStepOneComplete();
                }}
              >
                Beställ Borrhålsdata
              </Button>
            </StepContent>
          </Step>
          <Step key="order">
            <StepLabel>Beställ/Ladda ner</StepLabel>
            <StepContent>
              {this.state.orderStepContent === "document"
                ? this.renderDocumentDownloadStep()
                : this.renderOrderGeosuiteDataStep()}
            </StepContent>
          </Step>
        </Stepper>
        {this.renderStepperButtons()}
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(GeosuiteExportView));
